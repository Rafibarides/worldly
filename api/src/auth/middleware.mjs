import { createRemoteJWKSet, jwtVerify } from 'jose';
import { workos, WORKOS_CLIENT_ID } from '../workos.mjs';
import { findByWorkosId } from '../users.mjs';

// WorkOS signs access tokens with keys published at its JWKS endpoint.
let jwks;
function getJwks() {
  if (!jwks) jwks = createRemoteJWKSet(new URL(workos.userManagement.getJwksUrl(WORKOS_CLIENT_ID)));
  return jwks;
}

/**
 * Verifies the Bearer access token, then attaches:
 *   req.auth = { workosUserId, claims }
 *   req.user = the Turso user row (or null if not provisioned yet)
 */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'missing_token' });

    const { payload } = await jwtVerify(token, getJwks());
    const workosUserId = payload.sub;
    req.auth = { workosUserId, claims: payload };
    req.user = await findByWorkosId(workosUserId);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid_token', detail: err.message });
  }
}
