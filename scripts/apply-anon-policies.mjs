/**
 * Apply anon read RLS policies via direct Postgres connection.
 * Run once: npm run setup:db --workspace=scripts
 */
import fs from 'node:fs';
import path from 'node:path';
import { config } from 'dotenv';
import pg from 'pg';

const siteViewerRoot = path.resolve(import.meta.dirname, '..');
config({ path: path.join(siteViewerRoot, '.env') });

const password = process.env.SUPABASE_DB_PASSWORD;
const projectRef = new URL(process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL).hostname
  .split('.')[0];

if (!password || !projectRef) {
  console.error('Missing SUPABASE_DB_PASSWORD or SUPABASE_URL in site-viewer/.env');
  process.exit(1);
}

const sqlPath = path.join(
  siteViewerRoot,
  'supabase/migrations/002_anon_read_policies.sql',
);
const sql = fs.readFileSync(sqlPath, 'utf8');

const hosts = [
  `db.${projectRef}.supabase.co`,
  `aws-0-ap-southeast-2.pooler.supabase.com`,
  `aws-0-ap-southeast-1.pooler.supabase.com`,
];

async function tryConnect(host, port, user) {
  const client = new pg.Client({
    host,
    port,
    user,
    password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });
  await client.connect();
  return client;
}

async function main() {
  const attempts = [
    { host: hosts[0], port: 5432, user: 'postgres' },
    { host: hosts[1], port: 6543, user: `postgres.${projectRef}` },
    { host: hosts[1], port: 5432, user: `postgres.${projectRef}` },
    { host: hosts[2], port: 6543, user: `postgres.${projectRef}` },
  ];

  let client;
  for (const attempt of attempts) {
    try {
      console.log(`Connecting ${attempt.user}@${attempt.host}:${attempt.port}…`);
      client = await tryConnect(attempt.host, attempt.port, attempt.user);
      console.log('Connected.');
      break;
    } catch (err) {
      console.warn(`  failed: ${err.message}`);
    }
  }

  if (!client) {
    console.error('Could not connect to Postgres. Run 002_anon_read_policies.sql manually in Supabase SQL Editor.');
    process.exit(1);
  }

  try {
    await client.query(sql);
    console.log('✓ Anon read policies applied.');
  } catch (err) {
    if (err.message?.includes('already exists')) {
      console.log('Policies already exist — OK.');
    } else {
      throw err;
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
