import pg from 'pg';
export function createDb(env) {
    const pool = env.POSTGRES_DSN ? new pg.Pool({ connectionString: env.POSTGRES_DSN }) : null;
    return {
        async ping() {
            if (!pool)
                return true;
            const client = await pool.connect();
            try {
                await client.query('select 1');
                return true;
            }
            finally {
                client.release();
            }
        },
        async insertMessage(notebookId, role, content) {
            if (!pool)
                return { id: 'mock', notebook_id: notebookId, role, content };
            const client = await pool.connect();
            try {
                const sql = 'insert into messages (notebook_id, role, content) values ($1,$2,$3) returning id';
                const res = await client.query(sql, [notebookId, role, content]);
                return { id: res.rows[0]?.id, notebook_id: notebookId, role, content };
            }
            finally {
                client.release();
            }
        },
        async updateSourceStatus(sourceId, status) {
            if (!pool)
                return { id: sourceId, status };
            const client = await pool.connect();
            try {
                const sql = 'update sources set status = $2 where id = $1';
                await client.query(sql, [sourceId, status]);
                return { id: sourceId, status };
            }
            finally {
                client.release();
            }
        },
        async upsertDocuments(docs) {
            if (!pool)
                return { count: docs.length };
            const client = await pool.connect();
            try {
                // Placeholder: assumes a table `documents(text, embedding, metadata)` with pgvector (embedding) and jsonb (metadata)
                const sql = 'insert into documents (text, embedding, metadata) values ($1, $2, $3)';
                for (const d of docs) {
                    await client.query(sql, [d.text, d.embedding, d.metadata ?? {}]);
                }
                return { count: docs.length };
            }
            finally {
                client.release();
            }
        }
    };
}
