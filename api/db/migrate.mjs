import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../src/db.mjs';

const here = dirname(fileURLToPath(import.meta.url));

// Split a .sql file into individual statements. Strips `-- line comments` first
// (our schema has no string literals containing `--` or `;`), so inline comments
// with semicolons don't corrupt the split.
function statements(file) {
  const stripped = readFileSync(join(here, file), 'utf8')
    .split('\n')
    .map((line) => {
      const i = line.indexOf('--');
      return i === -1 ? line : line.slice(0, i);
    })
    .join('\n');
  return stripped
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length);
}

async function run() {
  console.log('Applying schema.sql ...');
  for (const sql of statements('schema.sql')) {
    await db.execute(sql);
  }
  console.log('Seeding badges ...');
  for (const sql of statements('seed.sql')) {
    await db.execute(sql);
  }
  const { rows } = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );
  console.log('Done. Tables:', rows.map((r) => r.name).join(', '));
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
