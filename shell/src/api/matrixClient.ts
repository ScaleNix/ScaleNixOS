/**
 * Matrix (Synapse) client-server API client.
 * Uses password login or existing access token.
 */

const MATRIX_API = '/matrix-api/client/v3';

// Cache access tokens per user
const tokenCache = new Map<string, { token: string; userId: string; expires: number }>();

export async function matrixLogin(username: string, password: string): Promise<{ token: string; userId: string }> {
  const cached = tokenCache.get(username);
  if (cached && cached.expires > Date.now()) return { token: cached.token, userId: cached.userId };

  const res = await fetch(`${MATRIX_API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'm.login.password',
      identifier: { type: 'm.id.user', user: username },
      password,
      initial_device_display_name: 'ScalenixOS Widget',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Matrix login failed: ${res.status}`);
  }

  const data = await res.json();
  const token = data.access_token;
  const userId = data.user_id;
  if (!token) throw new Error('No access_token in Matrix response');

  // Cache for 1 hour
  tokenCache.set(username, { token, userId, expires: Date.now() + 60 * 60 * 1000 });
  return { token, userId };
}

async function matrixGet(token: string, path: string, params?: Record<string, string>): Promise<any> {
  const url = new URL(`${MATRIX_API}${path}`, window.location.origin);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Matrix API error: ${res.status}`);
  return res.json();
}

// ── Rooms ──

export interface MatrixRoom {
  roomId: string;
  name: string;
  topic: string;
  avatarUrl: string | null;
  memberCount: number;
}

export async function getJoinedRooms(token: string): Promise<string[]> {
  const data = await matrixGet(token, '/joined_rooms');
  return data.joined_rooms || [];
}

export async function getRoomInfo(token: string, roomId: string): Promise<MatrixRoom> {
  let name = roomId;
  let topic = '';
  let avatarUrl: string | null = null;
  let memberCount = 0;

  try {
    const state = await matrixGet(token, `/rooms/${encodeURIComponent(roomId)}/state`);
    for (const evt of state) {
      if (evt.type === 'm.room.name') name = evt.content?.name || name;
      if (evt.type === 'm.room.topic') topic = evt.content?.topic || '';
      if (evt.type === 'm.room.avatar') avatarUrl = evt.content?.url || null;
      if (evt.type === 'm.room.member' && evt.content?.membership === 'join') memberCount++;
    }
  } catch { /* fallback */ }

  return { roomId, name, topic, avatarUrl, memberCount };
}

// ── Messages ──

export interface MatrixMessage {
  eventId: string;
  sender: string;
  senderName: string;
  body: string;
  timestamp: number;
  type: string;
}

export async function getRoomMessages(token: string, roomId: string, limit = 10): Promise<MatrixMessage[]> {
  const data = await matrixGet(token, `/rooms/${encodeURIComponent(roomId)}/messages`, {
    dir: 'b',
    limit: String(limit),
    filter: JSON.stringify({ types: ['m.room.message'] }),
  });

  return (data.chunk || [])
    .filter((evt: any) => evt.type === 'm.room.message')
    .map((evt: any) => ({
      eventId: evt.event_id,
      sender: evt.sender,
      senderName: evt.sender?.split(':')[0]?.replace('@', '') || evt.sender,
      body: evt.content?.body || '',
      timestamp: evt.origin_server_ts,
      type: evt.content?.msgtype || 'm.text',
    }))
    .reverse();
}

// ── Sync (lightweight) ──

export async function getInitialSync(token: string): Promise<{
  rooms: Array<{ id: string; name: string; lastMessage: string; lastTs: number; unread: number }>;
  userId: string;
}> {
  // Get our own user ID first
  const whoami = await matrixGet(token, '/account/whoami');
  const myUserId: string = whoami.user_id;

  const data = await matrixGet(token, '/sync', {
    filter: JSON.stringify({
      room: {
        timeline: { limit: 1 },
        state: { types: ['m.room.name', 'm.room.canonical_alias', 'm.room.member'] },
      },
      presence: { types: [] },
      account_data: { types: [] },
    }),
    timeout: '0',
  });

  const join = data.rooms?.join || {};
  const rooms = Object.entries(join).map(([roomId, room]: [string, any]) => {
    let name = '';
    const stateEvents = room.state?.events || [];
    const members: Array<{ userId: string; displayname: string }> = [];

    for (const evt of stateEvents) {
      if (evt.type === 'm.room.name') name = evt.content?.name || '';
      if (evt.type === 'm.room.canonical_alias' && !name)
        name = evt.content?.alias || '';
      if (evt.type === 'm.room.member' && evt.content?.membership === 'join') {
        members.push({ userId: evt.state_key, displayname: evt.content?.displayname || evt.state_key });
      }
    }

    // For DMs (no explicit name), use the other member's display name
    if (!name) {
      const otherMembers = members.filter((m) => m.userId !== myUserId);
      if (otherMembers.length === 1) {
        name = otherMembers[0].displayname;
      } else if (otherMembers.length > 1) {
        name = otherMembers.map((m) => m.displayname.split(' ')[0]).join(', ');
      } else {
        name = roomId;
      }
    }

    const timeline = room.timeline?.events || [];
    const lastMsg = timeline.filter((e: any) => e.type === 'm.room.message').pop();
    const unread = room.unread_notifications?.notification_count || 0;

    return {
      id: roomId,
      name,
      lastMessage: lastMsg?.content?.body || '',
      lastTs: lastMsg?.origin_server_ts || 0,
      unread,
    };
  });

  return { rooms: rooms.sort((a, b) => b.lastTs - a.lastTs), userId: myUserId };
}

// ── Room Invites ──

/**
 * Invite a user to a Matrix room by user ID (e.g. @alice:scalenix.fr).
 */
export async function inviteToRoom(token: string, roomId: string, userId: string): Promise<void> {
  const res = await fetch(`${MATRIX_API}/rooms/${encodeURIComponent(roomId)}/invite`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Invite failed: ${res.status}`);
  }
}

/**
 * Create a shareable invite link for a Matrix room.
 * Uses matrix.to URI format: https://matrix.to/#/!roomId:server
 * Falls back to room alias if available.
 */
export async function getRoomInviteLink(token: string, roomId: string): Promise<string> {
  // Try to get the canonical alias first (more user-friendly)
  try {
    const state = await matrixGet(token, `/rooms/${encodeURIComponent(roomId)}/state/m.room.canonical_alias`);
    if (state.alias) {
      return `https://matrix.to/#/${encodeURIComponent(state.alias)}`;
    }
  } catch { /* no alias */ }

  return `https://matrix.to/#/${encodeURIComponent(roomId)}`;
}

/**
 * Create a new room with invite link capability.
 * Sets join_rules to 'public' so anyone with the link can join.
 */
export async function createInvitableRoom(
  token: string,
  name: string,
  topic?: string,
): Promise<{ roomId: string; inviteLink: string }> {
  const res = await fetch(`${MATRIX_API}/createRoom`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      topic: topic || '',
      preset: 'public_chat',
      visibility: 'private',
      initial_state: [
        { type: 'm.room.join_rules', state_key: '', content: { join_rule: 'public' } },
        { type: 'm.room.history_visibility', state_key: '', content: { history_visibility: 'shared' } },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Room creation failed: ${res.status}`);
  }

  const data = await res.json();
  const newRoomId = data.room_id;
  const inviteLink = await getRoomInviteLink(token, newRoomId);
  return { roomId: newRoomId, inviteLink };
}

/**
 * Make an existing room joinable via link by setting join_rules to public.
 */
export async function makeRoomJoinable(token: string, roomId: string): Promise<string> {
  const res = await fetch(`${MATRIX_API}/rooms/${encodeURIComponent(roomId)}/state/m.room.join_rules`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ join_rule: 'public' }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to update join rules: ${res.status}`);
  }

  return getRoomInviteLink(token, roomId);
}
