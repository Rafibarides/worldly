// Single gateway between the app and the Worldly API server.
// The app talks ONLY to this server — never to Turso/WorkOS secrets directly.
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Resolve the API base URL:
//  1) explicit override in app.json → extra.API_URL
//  2) dev: reuse the Metro host IP (the Mac's LAN IP) on port 3000, so a phone
//     on the same Wi-Fi can reach it without hardcoding an address
//  3) fallback to localhost (simulator)
function resolveBaseUrl() {
  const override = Constants.expoConfig?.extra?.API_URL;
  if (override) return override;
  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:3000`;
  }
  return 'http://localhost:3000';
}

export const API_URL = resolveBaseUrl();

const ACCESS = 'worldly.accessToken';
const REFRESH = 'worldly.refreshToken';

export async function getTokens() {
  const [accessToken, refreshToken] = await Promise.all([
    AsyncStorage.getItem(ACCESS),
    AsyncStorage.getItem(REFRESH),
  ]);
  return { accessToken, refreshToken };
}

export async function setTokens({ accessToken, refreshToken }) {
  const ops = [];
  if (accessToken) ops.push(AsyncStorage.setItem(ACCESS, accessToken));
  if (refreshToken) ops.push(AsyncStorage.setItem(REFRESH, refreshToken));
  await Promise.all(ops);
}

export async function clearTokens() {
  await Promise.all([AsyncStorage.removeItem(ACCESS), AsyncStorage.removeItem(REFRESH)]);
}

async function rawRequest(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `HTTP ${res.status}`), { status: res.status, data });
  return data;
}

// Authenticated request with one transparent refresh-and-retry on 401.
export async function request(path, options = {}) {
  const { accessToken } = await getTokens();
  try {
    return await rawRequest(path, { ...options, token: accessToken });
  } catch (err) {
    if (err.status !== 401) throw err;
    const refreshed = await tryRefresh();
    if (!refreshed) throw err;
    return rawRequest(path, { ...options, token: refreshed.accessToken });
  }
}

async function tryRefresh() {
  const { refreshToken } = await getTokens();
  if (!refreshToken) return null;
  try {
    const data = await rawRequest('/auth/refresh', { method: 'POST', body: { refreshToken } });
    await setTokens(data);
    return data;
  } catch {
    await clearTokens();
    return null;
  }
}

// ── Auth API ──────────────────────────────────────────────────────
async function persist(data) {
  await setTokens(data);
  return data.user;
}

export const auth = {
  signUp: async ({ email, password, username }) =>
    persist(await rawRequest('/auth/signup', { method: 'POST', body: { email, password, username } })),

  logIn: async ({ email, password }) =>
    persist(await rawRequest('/auth/login', { method: 'POST', body: { email, password } })),

  // Google / hosted flows: get a URL to open in the browser, then exchange the code.
  oauthStart: (provider = 'GoogleOAuth') =>
    rawRequest(`/auth/oauth/start?provider=${encodeURIComponent(provider)}`),

  oauthCallback: async ({ code, state }) =>
    persist(await rawRequest('/auth/oauth/callback', { method: 'POST', body: { code, state } })),

  usernameAvailable: (username) =>
    rawRequest(`/auth/username-available?username=${encodeURIComponent(username)}`),

  passwordReset: (email) => rawRequest('/auth/password-reset', { method: 'POST', body: { email } }),

  me: () => request('/users/me'),

  logOut: clearTokens,
};

export const health = () => rawRequest('/health');
