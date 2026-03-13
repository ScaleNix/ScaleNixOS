const ZIMBRA_PREAUTH_KEY = import.meta.env.VITE_ZIMBRA_PREAUTH_KEY ?? '';
const ZIMBRA_URL = import.meta.env.VITE_ZIMBRA_URL ?? '';

/**
 * Generate a Zimbra preauth URL for SSO.
 * The preauth token is HMAC-SHA1(account + "|name|" + expires + "|" + timestamp, key)
 */
export async function getZimbraPreauthUrl(
  email: string,
  targetFragment?: string,
): Promise<string> {
  if (!ZIMBRA_PREAUTH_KEY || !ZIMBRA_URL) return ZIMBRA_URL + '/' + (targetFragment ?? '');

  const timestamp = Date.now(); // Zimbra expects milliseconds
  const expires = 0; // 0 = use server default

  // Preauth token format: account_name + "|" + "name" + "|" + expires + "|" + timestamp
  const data = `${email}|name|${expires}|${timestamp}`;

  // HMAC-SHA1 using Web Crypto API
  const encoder = new TextEncoder();
  const keyData = encoder.encode(ZIMBRA_PREAUTH_KEY);
  const msgData = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );

  const sig = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  const token = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const params = new URLSearchParams({
    account: email,
    by: 'name',
    timestamp: String(timestamp),
    expires: String(expires),
    preauth: token,
  });

  const base = `${ZIMBRA_URL}/service/preauth?${params.toString()}`;
  // The hash fragment is client-side only and survives the 302 redirect from Zimbra's
  // preauth endpoint. Append it directly after the query string.
  return targetFragment ? `${base}${targetFragment}` : base;
}

export function isZimbraApp(appId: string): boolean {
  return appId === 'zimbra-mail' || appId === 'zimbra-calendar';
}
