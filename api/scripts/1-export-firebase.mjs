/**
 * Step 1 of the Firebase → Turso migration.
 *
 * Dumps the old Firestore collections and the Firebase Auth user list to local
 * JSON files under ./migration-data/. This only READS from Firebase.
 *
 * Prerequisites:
 *   - The old Firebase project (wordly-app-b86b5) must still be accessible.
 *   - A fresh service-account key downloaded to the path in FIREBASE_SERVICE_ACCOUNT_PATH
 *     (Firebase console → Project settings → Service accounts → Generate new private key).
 *   - `npm install` in this folder (installs firebase-admin from devDependencies).
 *
 * Run:  npm run fb:export
 */
import 'dotenv/config';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './secrets/firebase-service-account.json';
if (!existsSync(saPath)) {
  console.error(`\nService-account key not found at: ${saPath}`);
  console.error('Download one from the Firebase console and set FIREBASE_SERVICE_ACCOUNT_PATH.\n');
  process.exit(1);
}

const admin = require('firebase-admin');
const serviceAccount = require(require('node:path').resolve(saPath));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();
const auth = admin.auth();
const OUT = './migration-data';
mkdirSync(OUT, { recursive: true });

// Collections the live app actually uses (see world-db.md + screen usage).
const COLLECTIONS = [
  'users',
  'friendships',
  'challenges',
  'missedChallenges',
  'games',
  'gameParticipants',
  'gameCountries',
  'badges',
  'userBadges',
  'notifications',
];

async function exportCollection(name) {
  const snap = await db.collection(name).get();
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  writeFileSync(`${OUT}/${name}.json`, JSON.stringify(docs, null, 2));
  console.log(`  ${name}: ${docs.length} docs`);
  return docs.length;
}

async function exportAuthUsers() {
  const users = [];
  let pageToken;
  do {
    const res = await auth.listUsers(1000, pageToken);
    for (const u of res.users) {
      users.push({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        emailVerified: u.emailVerified,
        providerData: u.providerData?.map((p) => p.providerId),
        createdAt: u.metadata?.creationTime,
      });
    }
    pageToken = res.pageToken;
  } while (pageToken);
  writeFileSync(`${OUT}/auth-users.json`, JSON.stringify(users, null, 2));
  console.log(`  auth-users: ${users.length} accounts (passwords are NOT exportable)`);
}

async function main() {
  console.log('Exporting Firestore collections ...');
  for (const c of COLLECTIONS) {
    try {
      await exportCollection(c);
    } catch (e) {
      console.warn(`  ${c}: skipped (${e.message})`);
    }
  }
  console.log('Exporting Firebase Auth users ...');
  await exportAuthUsers();
  console.log(`\nDone. Files written to ${OUT}/`);
}

main().catch((e) => {
  console.error('Export failed:', e);
  process.exit(1);
});
