const CLIENT_ID_KEY = 'az104-client-id';

export function getClientId(): string {
  if (typeof window === 'undefined') return 'server-side';
  const existing = window.localStorage.getItem(CLIENT_ID_KEY);
  if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) return existing;
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 32);
  window.localStorage.setItem(CLIENT_ID_KEY, id);
  return id;
}
