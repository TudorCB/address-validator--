// Client-side helpers for obtaining a session token in Admin UI pages.
// Tries App Bridge first, falls back to dev stub in non-production.

let cachedToken = null;
let lastFetchedAt = 0;

function getApiKey() {
  try {
    const meta = document.querySelector('meta[name="shopify-api-key"]');
    return meta ? meta.getAttribute('content') : '';
  } catch {}
  return '';
}

function getHostParam() {
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get('host') || '';
  } catch {}
  return '';
}

async function getBridgeToken() {
  const { default: createApp } = await import('@shopify/app-bridge');
  const { getSessionToken } = await import('@shopify/app-bridge-utils');
  const apiKey = getApiKey();
  const host = getHostParam();
  if (!apiKey || !host) return null;
  const app = createApp({ apiKey, host, forceRedirect: false });
  try {
    const token = await getSessionToken(app);
    return token || null;
  } catch {
    return null;
  }
}

export async function getAuthorizationHeader() {
  if (typeof window === 'undefined') return {};
  const now = Date.now();
  if (cachedToken && now - lastFetchedAt < 45_000) {
    return { authorization: `Bearer ${cachedToken}` };
  }
  const token = await getBridgeToken();
  if (token) {
    cachedToken = token;
    lastFetchedAt = now;
    return { authorization: `Bearer ${token}` };
  }
  // Fallback for local dev only
  const isProd = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE === 'production')
    || (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production');
  if (!isProd) {
    return { authorization: 'Bearer dev.stub.jwt' };
  }
  return {};
}

export async function authFetch(input, init = {}) {
  const hdr = await getAuthorizationHeader();
  const nextInit = { ...init, headers: { ...(init.headers || {}), ...hdr } };
  return fetch(input, nextInit);
}
