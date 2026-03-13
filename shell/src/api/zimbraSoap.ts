/**
 * Zimbra SOAP API client.
 * Authenticates via preauth, then uses authToken for subsequent calls.
 * Tested against Zimbra 10.1.x JSON SOAP API.
 */

const ZIMBRA_PREAUTH_KEY = import.meta.env.VITE_ZIMBRA_PREAUTH_KEY ?? '';
const SOAP_URL = '/zimbra-soap/';

async function computePreauth(email: string, timestamp: number, expires: number): Promise<string> {
  const data = `${email}|name|${expires}|${timestamp}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ZIMBRA_PREAUTH_KEY),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Cache auth tokens per email
const tokenCache = new Map<string, { token: string; expires: number }>();

export async function zimbraAuth(email: string): Promise<string> {
  const cached = tokenCache.get(email);
  if (cached && cached.expires > Date.now()) return cached.token;

  if (!ZIMBRA_PREAUTH_KEY) throw new Error('ZIMBRA_PREAUTH_KEY non configure');

  const timestamp = Date.now();
  const expires = 0;
  const preauth = await computePreauth(email, timestamp, expires);

  const res = await fetch(SOAP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Body: {
        AuthRequest: {
          _jsns: 'urn:zimbraAccount',
          account: { _content: email, by: 'name' },
          preauth: { _content: preauth, timestamp: String(timestamp), expires: String(expires) },
        },
      },
    }),
  });

  if (!res.ok) throw new Error(`Zimbra auth failed: ${res.status}`);
  const data = await res.json();
  const authToken = data.Body?.AuthResponse?.authToken?.[0]?._content;
  if (!authToken) throw new Error('No authToken in Zimbra response');

  // Cache for 55 minutes (lifetime is ~48h but be conservative)
  tokenCache.set(email, { token: authToken, expires: Date.now() + 55 * 60 * 1000 });
  return authToken;
}

async function soapRequest(authToken: string, body: Record<string, unknown>): Promise<any> {
  const res = await fetch(SOAP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Header: {
        context: { _jsns: 'urn:zimbra', authToken: { _content: authToken } },
      },
      Body: body,
    }),
  });
  if (!res.ok) throw new Error(`Zimbra SOAP error: ${res.status}`);
  return res.json();
}

// ── Mail ──

export interface ZimbraMail {
  id: string;
  subject: string;
  from: string;
  fromDisplay: string;
  date: number;
  fragment: string;
  unread: boolean;
  hasAttachment: boolean;
}

export async function getInbox(authToken: string, limit = 10): Promise<{ messages: ZimbraMail[]; unread: number }> {
  const data = await soapRequest(authToken, {
    SearchRequest: {
      _jsns: 'urn:zimbraMail',
      query: 'in:inbox',
      types: 'message',
      sortBy: 'dateDesc',
      limit,
      fetch: '1',
    },
  });

  const sr = data.Body?.SearchResponse;
  const msgs: ZimbraMail[] = (sr?.m || []).map((m: any) => {
    // m.e is array of email addresses: t='f' means from, t='t' means to
    const fromEntry = m.e?.find((e: any) => e.t === 'f');
    // m.f is flags string: 'u' = unread, 'a' = attachment, 'f' = flagged, '!' = urgent
    const flags = m.f || '';
    return {
      id: m.id,
      subject: m.su || '(sans objet)',
      from: fromEntry?.a || m.e?.[0]?.a || 'Inconnu',
      fromDisplay: fromEntry?.d || fromEntry?.a?.split('@')[0] || 'Inconnu',
      date: m.d,
      fragment: m.fr || '',
      unread: flags.includes('u'),
      hasAttachment: flags.includes('a'),
    };
  });

  // Get inbox folder unread count (folder id=2 is Inbox)
  let unread = msgs.filter((m) => m.unread).length;
  try {
    const folderData = await soapRequest(authToken, {
      GetFolderRequest: { _jsns: 'urn:zimbraMail', folder: { l: '2' } },
    });
    const folder = folderData.Body?.GetFolderResponse?.folder?.[0];
    // folder.u = unread count, folder.n = total count
    if (folder?.u != null) unread = folder.u;
  } catch { /* use search count */ }

  return { messages: msgs, unread };
}

// ── Calendar ──

export interface ZimbraEvent {
  id: string;
  name: string;
  location: string;
  fragment: string;
  start: number;
  end: number;
  allDay: boolean;
  status: string;
  organizer: string;
  isRecurring: boolean;
}

export async function getCalendarEvents(authToken: string, daysAhead = 7): Promise<ZimbraEvent[]> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + daysAhead * 86400000);

  const data = await soapRequest(authToken, {
    SearchRequest: {
      _jsns: 'urn:zimbraMail',
      query: 'in:calendar',
      types: 'appointment',
      sortBy: 'dateAsc',
      limit: 50,
      calExpandInstStart: start.getTime(),
      calExpandInstEnd: end.getTime(),
    },
  });

  const sr = data.Body?.SearchResponse;
  const events: ZimbraEvent[] = [];

  for (const a of sr?.appt || []) {
    // Each appointment can have multiple instances (recurring events)
    // dur is at the appointment level, inst[].s is instance start time
    const dur = a.dur || 3600000; // default 1 hour
    const instances = a.inst || [];

    for (const inst of instances) {
      const instStart = inst.s || a.d || 0;
      // Filter to only instances within our range
      if (instStart >= start.getTime() && instStart < end.getTime()) {
        events.push({
          id: `${a.id}-${instStart}`,
          name: a.name || '(sans titre)',
          location: a.loc || '',
          fragment: a.fr || '',
          start: instStart,
          end: instStart + dur,
          allDay: !!a.allDay,
          status: a.status || 'CONF',
          organizer: a.or?.d || a.or?.a || '',
          isRecurring: !!a.recur,
        });
      }
    }
  }

  return events.sort((a, b) => a.start - b.start);
}

// ── Tasks ──

export interface ZimbraTask {
  id: string;
  name: string;
  fragment: string;
  status: string; // NEED, INPR, COMP, WAIT, DEFERRED
  priority: string; // 0=none, 1=high, 5=normal, 9=low
  percentComplete: number;
  dueDate: number | null;
  categories: string[];
}

export async function getTasks(authToken: string): Promise<ZimbraTask[]> {
  const data = await soapRequest(authToken, {
    SearchRequest: {
      _jsns: 'urn:zimbraMail',
      query: 'in:tasks',
      types: 'task',
      sortBy: 'dateAsc',
      limit: 30,
    },
  });

  const sr = data.Body?.SearchResponse;
  return (sr?.task || []).map((t: any) => {
    // Task fields are at the top level (not nested in comp[])
    // t.inst[].dueDate = due date in ms
    // t.name = task name
    // t.status = NEED, INPR, COMP, WAIT, DEFERRED
    // t.priority = "1" (high), "5" (normal), "9" (low)
    // t.percentComplete = "0" to "100"
    // t.category = [{_content: "..."}]
    const dueDate = t.inst?.[0]?.dueDate || null;
    const categories = (t.category || []).map((c: any) => c._content || c);

    return {
      id: t.id,
      name: t.name || t.su || '(sans titre)',
      fragment: t.fr || '',
      status: t.status || 'NEED',
      priority: t.priority || '0',
      percentComplete: parseInt(t.percentComplete || '0', 10),
      dueDate,
      categories,
    };
  });
}

// ── Calendar Invite ──

export interface CalendarInviteParams {
  subject: string;
  location?: string;
  content?: string;
  start: Date;
  end: Date;
  attendees: string[]; // email addresses
  allDay?: boolean;
}

export async function sendCalendarInvite(authToken: string, params: CalendarInviteParams): Promise<string> {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const data = await soapRequest(authToken, {
    CreateAppointmentRequest: {
      _jsns: 'urn:zimbraMail',
      m: {
        su: { _content: params.subject },
        mp: {
          ct: 'text/plain',
          content: { _content: params.content || '' },
        },
        e: params.attendees.map((addr) => ({ a: addr, t: 't' })),
        inv: {
          comp: [{
            name: params.subject,
            loc: params.location || '',
            status: 'CONF',
            fb: 'B',
            transp: 'O',
            allDay: params.allDay ? '1' : '0',
            s: { d: fmt(params.start), tz: 'Europe/Paris' },
            e: { d: fmt(params.end), tz: 'Europe/Paris' },
            at: params.attendees.map((addr) => ({
              a: addr,
              role: 'REQ',
              ptst: 'NE',
              rsvp: '1',
            })),
            or: { a: '', d: '' }, // will be filled by server
          }],
        },
      },
    },
  });

  return data.Body?.CreateAppointmentResponse?.calItemId || '';
}

// ── Email Invite ──

export interface EmailInviteParams {
  to: string[];
  subject: string;
  body: string;
  cc?: string[];
}

export async function sendEmailInvite(authToken: string, params: EmailInviteParams): Promise<string> {
  const recipients = [
    ...params.to.map((addr) => ({ a: addr, t: 't' })),
    ...(params.cc || []).map((addr) => ({ a: addr, t: 'c' })),
  ];

  const data = await soapRequest(authToken, {
    SendMsgRequest: {
      _jsns: 'urn:zimbraMail',
      m: {
        su: { _content: params.subject },
        e: recipients,
        mp: {
          ct: 'text/plain',
          content: { _content: params.body },
        },
      },
    },
  });

  return data.Body?.SendMsgResponse?.m?.[0]?.id || '';
}
