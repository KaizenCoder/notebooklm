import pg from 'pg';
const dsn = process.env.POSTGRES_DSN || 'postgres://postgres:postgres@localhost:5432/notebooklm';
const pool = new pg.Pool({ connectionString: dsn });
try {
  const { rows } = await pool.query('select id, left(text, 120) as text_excerpt, jsonb_array_length(embedding) as emb_len, metadata from documents order by id desc limit 1');
  if (rows.length === 0) {
    console.log(JSON.stringify({ hasDocument: false }, null, 2));
  } else {
    const r = rows[0];
    console.log(JSON.stringify({ hasDocument: true, id: r.id, text_excerpt: r.text_excerpt, emb_len: Number(r.emb_len), metadata: r.metadata }, null, 2));
  }
} finally {
  await pool.end();
}