import pg from 'pg';
import { URL } from 'node:url';

function quoteIdent(name: string): string {
  return '"' + name.replace(/"/g, '""') + '"';
}

async function main() {
  const dsn = process.env.POSTGRES_DSN || 'postgres://postgres:postgres@localhost:5432/notebooklm';
  const u = new URL(dsn);
  const dbName = (u.pathname || '').replace(/^\//, '') || 'notebooklm';
  const admin = new URL(dsn);
  admin.pathname = '/postgres';

  const adminPool = new pg.Pool({ connectionString: admin.toString() });
  try {
    const { rows } = await adminPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (rows.length === 0) {
      await adminPool.query(`CREATE DATABASE ${quoteIdent(dbName)}`);
      // wait a bit for create
      await new Promise((r) => setTimeout(r, 500));
    }
  } finally {
    await adminPool.end();
  }

  const pool = new pg.Pool({ connectionString: dsn });
  try {
    // Optional: try create extension vector (ignore errors)
    try { await pool.query('CREATE EXTENSION IF NOT EXISTS vector'); } catch {}

    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id bigserial primary key,
        notebook_id text null,
        role text not null,
        content text not null,
        created_at timestamptz default now()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS n8n_chat_histories (
        id bigserial primary key,
        notebook_id text null,
        role text not null,
        content text not null,
        user_id text null,
        timestamp timestamptz default now()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notebooks (
        id text primary key,
        audio_overview_generation_status text null,
        audio_overview_url text null,
        audio_url_expires_at timestamptz null
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sources (
        id text primary key,
        status text null
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id bigserial primary key,
        text text not null,
        embedding jsonb not null,
        metadata jsonb not null
      );
    `);

    await pool.query(`INSERT INTO notebooks (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`, ['nb_demo']);
    await pool.query(`INSERT INTO sources (id, status) VALUES ($1,$2) ON CONFLICT (id) DO NOTHING`, ['s_demo', 'new']);
    await pool.query(`INSERT INTO sources (id, status) VALUES ($1,$2) ON CONFLICT (id) DO NOTHING`, ['s_demo_2', 'new']);
  } finally {
    await pool.end();
  }
  console.log('DB setup complete');
}

main().catch((e) => { console.error(e); process.exit(1); });
