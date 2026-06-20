# Worldly

A fast-paced, real-time multiplayer geography game for iOS & Android. Name countries
against the clock — solo or head-to-head against friends — fill in a live world map,
earn continent badges, and climb levels.

## Tech stack (2026 rebuild)

- **App:** React Native + Expo (SDK 52), React Navigation, an SVG vector world map
  (`d3-geo` + `topojson` + `react-native-svg`).
- **Auth:** [WorkOS](https://workos.com) User Management — own UI for email/password
  (headless via our API), hosted redirects for Google / OTP / password reset.
- **Database:** **Turso** (edge-hosted libSQL/SQLite) — free, never sleeps. Day-to-day
  row editing (support, restoring points) is done live in [Outerbase Studio](https://studio.outerbase.com),
  a browser GUI pointed at Turso — a live spreadsheet over the real database, no SQL
  needed for routine fixes. A bespoke React admin panel will come later.
- **Images:** Cloudflare R2 (profile avatars), via server-signed upload URLs.
- **Realtime + push:** Socket.IO (live game/challenge state) and Expo Push Notifications,
  both served by our API.

The app never talks to Turso or WorkOS secrets directly — it goes through our API
server. The Turso token and WorkOS API key live only on the server.

## Directory layout

```
worldly/
├─ client/                  # The mobile app (Expo). Entry: src/App.jsx
│  ├─ src/
│  │  ├─ screens/           # Auth, Game, Friends, Profile, Home, Logs, ...
│  │  ├─ navigation/        # Bottom tabs + stacks
│  │  ├─ contexts/          # AuthContext, AudioContext
│  │  ├─ components/        # MapView, ProfileView, Badge, CachedImage, ...
│  │  ├─ services/          # api.js (→ our server), socket.js, firebase.js (legacy, being removed)
│  │  └─ utils/             # country data, leveling, helpers
│  ├─ assets/               # images, sounds, geojson
│  ├─ android/  ios/        # native projects (dev-client / prebuild)
│  └─ app.json              # Expo config (the REAL one)
│
├─ api/                     # Backend: Turso + WorkOS + Socket.IO + (soon) R2 + push
│  ├─ src/
│  │  ├─ index.mjs          # Express app + Socket.IO server
│  │  ├─ db.mjs             # libSQL (Turso) client
│  │  ├─ workos.mjs         # WorkOS client (lazy)
│  │  ├─ users.mjs          # Turso user repo + WorkOS↔Turso linking
│  │  └─ auth/              # routes.mjs, middleware.mjs (JWT verify), pkce.mjs
│  ├─ db/                   # schema.sql, seed.sql, migrate.mjs
│  ├─ scripts/              # Firebase → Turso migration (1-export, 2-import)
│  └─ .env                  # secrets (gitignored)
│
├─ server/  server.js       # legacy Firebase Functions + old socket server (reference only)
├─ firebase.json .firebaserc# kept only during the data-migration window
├─ roadmap.md  world-db.md  # product roadmap + legacy data-model notes
└─ api-key.txt              # Turso token scratch file (gitignored)
```

## Running locally (dev)

**1. API server** (from `api/`):
```bash
npm install
npm run migrate        # one-time: create Turso tables + seed badges
npm run dev            # http://localhost:3000  (try /health)
```

**2. App** (from `client/`):
```bash
npm install
npx expo start         # Fast Refresh works in Expo Go AND dev builds
```

Notes:
- A phone on the **same Wi-Fi** reaches the API via the Mac's LAN IP; the app derives
  this automatically in dev (see `client/src/services/api.js`).
- **Expo Go** is fine for fast iteration on UI + email/password auth + gameplay.
- A **dev build** (EAS) is required for Google sign-in (custom-scheme deep link) and
  push notifications. Dev builds keep Fast Refresh, exactly like Expo Go.

## Migrating the old Firebase data

The original users/games live in Firestore (project `wordly-app-b86b5`). With a fresh
service-account key at `api/secrets/firebase-service-account.json`:
```bash
cd api && npm run fb:export && npm run fb:import
```
Passwords don't transfer (users reset or sign in with Google); everything else does.
Old Storage avatar images are gone — users re-pick an avatar.
```
