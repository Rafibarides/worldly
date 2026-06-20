import { Router } from 'express';
import { workos, WORKOS_CLIENT_ID } from '../workos.mjs';
import { createUser, findByUsernameLower, upsertFromWorkos, toPublicUser } from '../users.mjs';
import { generatePkce, rememberVerifier, takeVerifier, newState } from './pkce.mjs';

const router = Router();
const REDIRECT_URI = process.env.WORKOS_REDIRECT_URI || 'worldly://auth/callback';

// Live username availability check for the sign-up screen.
router.get('/username-available', async (req, res) => {
  const username = String(req.query.username || '').trim();
  if (!username) return res.json({ available: false });
  const taken = await findByUsernameLower(username.toLowerCase());
  res.json({ available: !taken });
});

const session = (auth, user) => ({
  user: toPublicUser(user),
  accessToken: auth.accessToken,
  refreshToken: auth.refreshToken,
});

// ── Email + password (headless: our own UI calls these) ───────────
router.post('/signup', async (req, res) => {
  const { email, password, username } = req.body || {};
  if (!email || !password || !username) {
    return res.status(400).json({ error: 'email, password and username are required' });
  }
  try {
    if (await findByUsernameLower(username.toLowerCase())) {
      return res.status(409).json({ error: 'username_taken' });
    }
    // emailVerified:true → no verification gate before first login (matches our
    // current product decision). Swap to a real OTP/hosted verify flow at launch.
    const workosUser = await workos.userManagement.createUser({ email, password, emailVerified: true });
    const auth = await workos.userManagement.authenticateWithPassword({
      clientId: WORKOS_CLIENT_ID,
      email,
      password,
    });
    const user = await createUser({ workosUserId: workosUser.id, username, email });
    // Fire-and-forget email verification.
    workos.userManagement.sendVerificationEmail({ userId: workosUser.id }).catch(() => {});
    return res.status(201).json(session(auth, user));
  } catch (err) {
    return res.status(400).json({ error: 'signup_failed', detail: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
  try {
    const auth = await workos.userManagement.authenticateWithPassword({
      clientId: WORKOS_CLIENT_ID,
      email,
      password,
    });
    const user = await upsertFromWorkos(auth.user); // links migrated accounts by email
    return res.json(session(auth, user));
  } catch (err) {
    return res.status(401).json({ error: 'login_failed', detail: err.message });
  }
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });
  try {
    const auth = await workos.userManagement.authenticateWithRefreshToken({
      clientId: WORKOS_CLIENT_ID,
      refreshToken,
    });
    const user = await upsertFromWorkos(auth.user);
    return res.json(session(auth, user));
  } catch (err) {
    return res.status(401).json({ error: 'refresh_failed', detail: err.message });
  }
});

// ── OAuth / hosted flows (Google now; OTP/verify reuse AuthKit) ────
// Start: app opens the returned `url` in a browser; WorkOS redirects to
// WORKOS_REDIRECT_URI with ?code&state which the app deep-links back here.
router.get('/oauth/start', (req, res) => {
  const provider = req.query.provider || 'authkit'; // 'GoogleOAuth' | 'authkit'
  const { codeVerifier, codeChallenge } = generatePkce();
  const state = newState();
  rememberVerifier(state, codeVerifier);
  const url = workos.userManagement.getAuthorizationUrl({
    clientId: WORKOS_CLIENT_ID,
    provider,
    redirectUri: REDIRECT_URI,
    codeChallenge,
    codeChallengeMethod: 'S256',
    state,
  });
  res.json({ url, state });
});

router.post('/oauth/callback', async (req, res) => {
  const { code, state } = req.body || {};
  if (!code || !state) return res.status(400).json({ error: 'code and state required' });
  const codeVerifier = takeVerifier(state);
  if (!codeVerifier) return res.status(400).json({ error: 'invalid_or_expired_state' });
  try {
    const auth = await workos.userManagement.authenticateWithCodeAndVerifier({
      clientId: WORKOS_CLIENT_ID,
      code,
      codeVerifier,
    });
    const user = await upsertFromWorkos(auth.user);
    return res.json(session(auth, user));
  } catch (err) {
    return res.status(401).json({ error: 'oauth_failed', detail: err.message });
  }
});

// ── Password reset (hosted): returns a WorkOS URL for the app to open ─
router.post('/password-reset', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email required' });
  try {
    const reset = await workos.userManagement.createPasswordReset({ email });
    return res.json({ passwordResetUrl: reset.passwordResetUrl });
  } catch (err) {
    // Don't reveal whether the email exists.
    return res.json({ ok: true });
  }
});

export default router;
