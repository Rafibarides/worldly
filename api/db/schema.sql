-- Worldly database schema (Turso / libSQL / SQLite)  ── v2 ──
-- Derived from the legacy Firestore model + actual client usage, then tightened.
--
-- Key modeling decisions:
--   * users.id is our OWN stable internal id (decoupled from the auth provider).
--     - Migrated users keep their original Firebase uid here, so every existing
--       friendship/challenge/game reference stays valid.
--     - New users get a generated id. workos_user_id links to the auth provider
--       and can change without touching the rest of the schema.
--   * Challenges are strictly 1v1, so scores live inline (no child table / joins).
--   * No game_countries table: per-player guesses live on game_participants.countries_guessed.
--   * No denormalized users.friends array: confirmed friends are derived from `friendships`.
--   * Booleans are 0/1 INTEGER. Timestamps are ISO TEXT (Outerbase-friendly).

PRAGMA foreign_keys = ON;

-- ───────────────────────────── users ─────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,            -- internal id (legacy Firebase uid, or generated)
  workos_user_id  TEXT UNIQUE,                 -- auth provider id; NULL until linked
  username        TEXT NOT NULL UNIQUE,
  username_lower  TEXT UNIQUE,                  -- lowercased username for case-insensitive search/uniqueness
  email           TEXT NOT NULL UNIQUE,
  avatar_url      TEXT,                        -- Cloudflare R2 URL (or dicebear fallback)
  level           INTEGER NOT NULL DEFAULT 1,  -- cached; recomputed from games_played on write
  games_played    INTEGER NOT NULL DEFAULT 0,
  games_won       INTEGER NOT NULL DEFAULT 0,
  expo_push_token TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_username_lower ON users (username_lower);
CREATE INDEX IF NOT EXISTS idx_users_workos ON users (workos_user_id);

-- Per-continent "scored 100%" counters (replaces users.continentsTracked map).
CREATE TABLE IF NOT EXISTS user_continents (
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  continent     TEXT NOT NULL,                 -- Africa | Asia | Europe | North America | South America | Oceania
  perfect_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, continent)
);

-- ──────────────────────────── badges ─────────────────────────────
CREATE TABLE IF NOT EXISTS badges (
  id             TEXT PRIMARY KEY,             -- "Africa", "worldExplorer", ...
  name           TEXT NOT NULL,
  continent      TEXT,
  description    TEXT,
  times_required INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id        TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at       TEXT NOT NULL DEFAULT (datetime('now')),
  times_completed INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, badge_id)
);

-- ─────────────────────────── friendships ─────────────────────────
-- One row per relationship. requester_id sent the request to addressee_id.
-- Confirmed friends are derived (status='confirmed'); no array kept on users.
CREATE TABLE IF NOT EXISTS friendships (
  id           TEXT PRIMARY KEY,
  requester_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending', -- pending | confirmed
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (requester_id, addressee_id)
);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships (addressee_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships (requester_id, status);

-- ─────────────────────────── challenges ──────────────────────────
-- Strictly 1v1 → scores inlined, no join table.
CREATE TABLE IF NOT EXISTS challenges (
  id                TEXT PRIMARY KEY,
  game_id           TEXT,                        -- logical id shared with the live (socket) session
  challenger_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenged_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'pending', -- pending | active | accepted | cancelled | completed
  challenger_joined INTEGER NOT NULL DEFAULT 0,
  challenged_joined INTEGER NOT NULL DEFAULT 0,
  challenger_score  INTEGER NOT NULL DEFAULT 0,
  challenged_score  INTEGER NOT NULL DEFAULT 0,
  winner_id         TEXT REFERENCES users(id),
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_challenges_challenged ON challenges (challenged_id, status);
CREATE INDEX IF NOT EXISTS idx_challenges_challenger ON challenges (challenger_id, status);
CREATE INDEX IF NOT EXISTS idx_challenges_game ON challenges (game_id);

-- Missed challenges log (timeout / decline). Drives the "Logs" tab + re-challenge.
CREATE TABLE IF NOT EXISTS missed_challenges (
  id            TEXT PRIMARY KEY,
  challenger_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenged_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_missed_challenged ON missed_challenges (challenged_id);

-- ───────────────────────────── games ─────────────────────────────
-- Lightweight history (solo + multiplayer). Live country state stays in the
-- socket session; only the outcome is persisted here.
CREATE TABLE IF NOT EXISTS games (
  id         TEXT PRIMARY KEY,
  game_type  TEXT NOT NULL,                    -- solo | multiplayer | capitals | flags
  status     TEXT NOT NULL DEFAULT 'in-progress', -- in-progress | completed
  winner_id  TEXT REFERENCES users(id),
  start_time TEXT NOT NULL DEFAULT (datetime('now')),
  end_time   TEXT
);

CREATE TABLE IF NOT EXISTS game_participants (
  id                TEXT PRIMARY KEY,
  game_id           TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score             INTEGER NOT NULL DEFAULT 0,
  countries_guessed TEXT NOT NULL DEFAULT '[]', -- JSON array of country names
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (game_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_participants_user ON game_participants (user_id);

-- ─────────────────────────── notifications ───────────────────────
-- In-app notification feed (push is sent separately via Expo).
CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT,                             -- friendRequest | challenge | system
  message    TEXT NOT NULL,
  is_read    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, is_read);
