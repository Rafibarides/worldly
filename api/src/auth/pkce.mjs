import crypto from 'node:crypto';

const b64url = (buf) =>
  buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export function generatePkce() {
  const codeVerifier = b64url(crypto.randomBytes(32));
  const codeChallenge = b64url(crypto.createHash('sha256').update(codeVerifier).digest());
  return { codeVerifier, codeChallenge };
}

// Short-lived store mapping OAuth `state` → codeVerifier. In-memory is fine for a
// single dev instance; swap for Turso/redis if we ever run multiple instances.
const TTL_MS = 10 * 60 * 1000;
const store = new Map();

export function rememberVerifier(state, codeVerifier) {
  store.set(state, { codeVerifier, expires: Date.now() + TTL_MS });
}

export function takeVerifier(state) {
  const entry = store.get(state);
  store.delete(state);
  if (!entry || entry.expires < Date.now()) return null;
  return entry.codeVerifier;
}

export const newState = () => b64url(crypto.randomBytes(16));
