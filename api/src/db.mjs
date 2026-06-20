import 'dotenv/config';
import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error('TURSO_DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
}

// Single shared libSQL client. The Turso token lives ONLY on the server.
export const db = createClient({ url, authToken });
