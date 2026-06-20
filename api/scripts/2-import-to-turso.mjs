/**
 * Step 2 of the Firebase → Turso migration.
 *
 * Reads ./migration-data/*.json (from step 1), transforms the legacy Firestore
 * shapes into the v2 schema, and inserts into Turso. Idempotent: re-running
 * upserts rather than duplicating.
 *
 * Notes:
 *   - Passwords cannot be migrated. Migrated users get workos_user_id = NULL and
 *     link to WorkOS on their first sign-in (matched by email), via password
 *     reset or Google.
 *   - Field names are read defensively because the legacy data was inconsistent
 *     (e.g. requesteeId vs recipientId, challengedId vs recipientId).
 *
 * Run (after `npm run migrate`):  npm run fb:import
 */
import 'dotenv/config';
import { readFileSync, existsSync } from 'node:fs';
import { db } from '../src/db.mjs';

const DIR = './migration-data';
const load = (name) => (existsSync(`${DIR}/${name}.json`) ? JSON.parse(readFileSync(`${DIR}/${name}.json`, 'utf8')) : []);
const pick = (o, ...keys) => keys.map((k) => o?.[k]).find((v) => v !== undefined && v !== null);
const bool = (v) => (v ? 1 : 0);
const stats = {};
const bump = (k) => (stats[k] = (stats[k] || 0) + 1);

async function importUsers() {
  for (const u of load('users')) {
    const id = pick(u, 'id', 'uid', 'userId');
    const email = pick(u, 'email');
    const username = pick(u, 'username') || (email ? email.split('@')[0] : null);
    if (!id || !email || !username) { bump('users_skipped'); continue; }
    const s = u.stats || {};
    try {
      await db.execute({
        sql: `INSERT INTO users (id, username, username_lower, email, avatar_url, level, games_played, games_won, expo_push_token)
              VALUES (?,?,?,?,?,?,?,?,?)
              ON CONFLICT(id) DO UPDATE SET
                username=excluded.username, username_lower=excluded.username_lower, email=excluded.email,
                avatar_url=excluded.avatar_url, level=excluded.level,
                games_played=excluded.games_played, games_won=excluded.games_won`,
        args: [
          id, username, pick(u, 'username_lower') || username.toLowerCase(),
          email, pick(u, 'avatarUrl', 'avatar_url') ?? null,
          pick(u, 'level') ?? s.level ?? 1,
          pick(s, 'gamesPlayed') ?? u.gamesPlayed ?? 0,
          pick(s, 'gamesWon') ?? u.gamesWon ?? 0,
          pick(u, 'expoPushToken') ?? null,
        ],
      });
      bump('users');
      const continents = u.continentsTracked || {};
      for (const [continent, count] of Object.entries(continents)) {
        await db.execute({
          sql: `INSERT INTO user_continents (user_id, continent, perfect_count) VALUES (?,?,?)
                ON CONFLICT(user_id, continent) DO UPDATE SET perfect_count=excluded.perfect_count`,
          args: [id, continent, Number(count) || 0],
        });
      }
      for (const badgeId of u.badges || []) {
        await db.execute({
          sql: `INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?,?)`,
          args: [id, badgeId],
        }).catch(() => {});
      }
    } catch (e) { bump('users_error'); console.warn('user', id, e.message); }
  }
}

async function importFriendships() {
  for (const f of load('friendships')) {
    const requester = pick(f, 'requesterId', 'user1');
    const addressee = pick(f, 'requesteeId', 'recipientId', 'user2');
    if (!requester || !addressee) { bump('friendships_skipped'); continue; }
    await db.execute({
      sql: `INSERT INTO friendships (id, requester_id, addressee_id, status)
            VALUES (?,?,?,?) ON CONFLICT(requester_id, addressee_id) DO UPDATE SET status=excluded.status`,
      args: [pick(f, 'id') || `${requester}_${addressee}`, requester, addressee, pick(f, 'status') || 'pending'],
    }).then(() => bump('friendships')).catch((e) => { bump('friendships_error'); console.warn(e.message); });
  }
}

async function importChallenges() {
  for (const c of load('challenges')) {
    const challenger = pick(c, 'challengerId');
    const challenged = pick(c, 'challengedId', 'recipientId');
    if (!challenger || !challenged) { bump('challenges_skipped'); continue; }
    const scoreFor = (uid) => (c.scoreList || []).find((s) => s.uid === uid)?.score ?? 0;
    await db.execute({
      sql: `INSERT INTO challenges (id, game_id, challenger_id, challenged_id, status,
              challenger_joined, challenged_joined, challenger_score, challenged_score, winner_id)
            VALUES (?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(id) DO UPDATE SET status=excluded.status`,
      args: [
        pick(c, 'id', 'challengeId') || `${c.gameId || Date.now()}`,
        pick(c, 'gameId') ?? null, challenger, challenged, pick(c, 'status') || 'pending',
        bool(c.challengerJoined), bool(c.challengedJoined),
        scoreFor(challenger), scoreFor(challenged), pick(c, 'winnerId') ?? null,
      ],
    }).then(() => bump('challenges')).catch((e) => { bump('challenges_error'); console.warn(e.message); });
  }
}

async function importGames() {
  for (const g of load('games')) {
    const id = pick(g, 'gameId', 'id');
    if (!id) { bump('games_skipped'); continue; }
    await db.execute({
      sql: `INSERT INTO games (id, game_type, status, winner_id, start_time, end_time)
            VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status, winner_id=excluded.winner_id`,
      args: [id, pick(g, 'gameType') || 'solo', pick(g, 'status') || 'completed',
        pick(g, 'winnerId') ?? null, pick(g, 'startTime') ?? null, pick(g, 'endTime') ?? null],
    }).then(() => bump('games')).catch((e) => { bump('games_error'); console.warn(e.message); });
  }
  for (const p of load('gameParticipants')) {
    const gameId = pick(p, 'gameId');
    const userId = pick(p, 'userId');
    if (!gameId || !userId) { bump('participants_skipped'); continue; }
    await db.execute({
      sql: `INSERT INTO game_participants (id, game_id, user_id, score, countries_guessed)
            VALUES (?,?,?,?,?) ON CONFLICT(game_id, user_id) DO UPDATE SET score=excluded.score`,
      args: [`${gameId}_${userId}`, gameId, userId, pick(p, 'score') ?? 0,
        JSON.stringify(p.countriesGuessed || [])],
    }).then(() => bump('participants')).catch((e) => { bump('participants_error'); console.warn(e.message); });
  }
}

async function importNotifications() {
  for (const n of load('notifications')) {
    const userId = pick(n, 'userId');
    if (!userId) { bump('notifications_skipped'); continue; }
    await db.execute({
      sql: `INSERT OR IGNORE INTO notifications (id, user_id, type, message, is_read) VALUES (?,?,?,?,?)`,
      args: [pick(n, 'id') || `${userId}_${Date.parse(n.timeStamp) || Date.now()}`, userId,
        pick(n, 'type') ?? null, pick(n, 'message') || '', bool(n.isRead)],
    }).then(() => bump('notifications')).catch((e) => { bump('notifications_error'); console.warn(e.message); });
  }
}

async function main() {
  await importUsers();        // must run first (FKs)
  await importFriendships();
  await importChallenges();
  await importGames();
  await importNotifications();
  console.log('\nImport summary:', stats);
}

main().catch((e) => { console.error('Import failed:', e); process.exit(1); });
