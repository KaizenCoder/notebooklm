import pg from 'pg';
const dsn = process.env.POSTGRES_DSN || 'postgres://postgres:postgres@localhost:5432/notebooklm';
const pool = new pg.Pool({ connectionString: dsn });
const notebook = process.argv[2] || 'nb_demo';
try {
  const { rows } = await pool.query('select id, notebook_id, role, left(content, 200) as content_excerpt, created_at from messages where notebook_id = $1 order by id desc limit 2', [notebook]);
  console.log(JSON.stringify({ notebook, last2: rows }, null, 2));
} finally {
  await pool.end();
}