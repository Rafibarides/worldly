import crypto from 'node:crypto';
import { db } from './db.mjs';

// Shape sent to the client. Mirrors what the app's AuthContext expects (`uid`, stats, etc.).
export function toPublicUser(row) {
  if (!row) return null;
  return {
    uid: row.id,
    username: row.username,
    email: row.email,
    avatarUrl: row.avatar_url,
    level: row.level,
    stats: { gamesPlayed: row.games_played, gamesWon: row.games_won, level: row.level },
  };
}

export async function findByWorkosId(workosUserId) {
  const { rows } = await db.execute({
    sql: 'SELECT * FROM users WHERE workos_user_id = ? LIMIT 1',
    args: [workosUserId],
  });
  return rows[0] ?? null;
}

export async function findByEmail(email) {
  const { rows } = await db.execute({
    sql: 'SELECT * FROM users WHERE email = ? LIMIT 1',
    args: [email],
  });
  return rows[0] ?? null;
}

export async function findByUsernameLower(usernameLower) {
  const { rows } = await db.execute({
    sql: 'SELECT * FROM users WHERE username_lower = ? LIMIT 1',
    args: [usernameLower],
  });
  return rows[0] ?? null;
}

export async function findById(id) {
  const { rows } = await db.execute({ sql: 'SELECT * FROM users WHERE id = ? LIMIT 1', args: [id] });
  return rows[0] ?? null;
}

async function linkWorkosId(id, workosUserId) {
  await db.execute({
    sql: "UPDATE users SET workos_user_id = ?, updated_at = datetime('now') WHERE id = ?",
    args: [workosUserId, id],
  });
}

function defaultAvatar(seed) {
  return `https://api.dicebear.com/9.x/avataaars/png?seed=${encodeURIComponent(seed)}`;
}

/**
 * Resolve a Turso user from a WorkOS authentication result.
 *  - already linked → return it
 *  - migrated user (same email, no workos id yet) → link and return it
 *  - brand new → create it
 */
export async function upsertFromWorkos(workosUser, { username } = {}) {
  const byWorkos = await findByWorkosId(workosUser.id);
  if (byWorkos) return byWorkos;

  const byEmail = await findByEmail(workosUser.email);
  if (byEmail) {
    await linkWorkosId(byEmail.id, workosUser.id);
    return findById(byEmail.id);
  }

  const id = crypto.randomUUID();
  const baseName =
    username || workosUser.firstName || workosUser.email.split('@')[0];
  const finalName = await uniqueUsername(baseName);
  await db.execute({
    sql: `INSERT INTO users (id, workos_user_id, username, username_lower, email, avatar_url)
          VALUES (?,?,?,?,?,?)`,
    args: [id, workosUser.id, finalName, finalName.toLowerCase(), workosUser.email, defaultAvatar(finalName)],
  });
  return findById(id);
}

// Create a brand-new user during email/password signup (username chosen by the user).
export async function createUser({ workosUserId, username, email }) {
  const id = crypto.randomUUID();
  await db.execute({
    sql: `INSERT INTO users (id, workos_user_id, username, username_lower, email, avatar_url)
          VALUES (?,?,?,?,?,?)`,
    args: [id, workosUserId, username, username.toLowerCase(), email, defaultAvatar(username)],
  });
  return findById(id);
}

async function uniqueUsername(base) {
  let candidate = base.replace(/\s+/g, '').slice(0, 20) || 'player';
  let n = 0;
  // Append a numeric suffix until the lowercased name is free.
  while (await findByUsernameLower(candidate.toLowerCase())) {
    n += 1;
    candidate = `${base.slice(0, 16)}${n}`;
  }
  return candidate;
}
