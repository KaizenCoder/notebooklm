import pg from 'pg';
export function createDb(env) {
    const noMocks = env; // access NO_MOCKS dynamically
    if ((noMocks?.NO_MOCKS === '1') && !env.POSTGRES_DSN) {
        throw new Error('NO_MOCKS=1: POSTGRES_DSN requis (interdit les mocks DB)');
    }
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
                return { id: 'local', notebook_id: notebookId, role, content };
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
        async insertChatHistory(notebookId, role, content, userId, timestampIso) {
            const row = {
                notebook_id: notebookId,
                role,
                content,
                user_id: userId ?? null,
                timestamp: timestampIso ?? new Date().toISOString()
            };
            if (!pool)
                return { id: 'local', ...row };
            const client = await pool.connect();
            try {
                const sql = 'insert into n8n_chat_histories (notebook_id, role, content, user_id, timestamp) values ($1,$2,$3,$4,$5) returning id';
                const res = await client.query(sql, [notebookId, role, content, userId ?? null, timestampIso ?? new Date().toISOString()]);
                return { id: res.rows[0]?.id, ...row };
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
        async updateNotebookStatus(notebookId, status) {
            if (!pool)
                return { id: notebookId, status };
            const client = await pool.connect();
            try {
                const sql = 'update notebooks set audio_overview_generation_status = $2 where id = $1';
                await client.query(sql, [notebookId, status]);
                return { id: notebookId, status };
            }
            finally {
                client.release();
            }
        },
        async setNotebookAudio(notebookId, audioUrl) {
            if (!pool)
                return { id: notebookId, audio_overview_url: audioUrl };
            const client = await pool.connect();
            try {
                const sql = 'update notebooks set audio_overview_url = $2, audio_url_expires_at = now() + interval \'24 hours\' where id = $1';
                await client.query(sql, [notebookId, audioUrl]);
                return { id: notebookId, audio_overview_url: audioUrl };
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
                const BATCH = 100;
                for (let i = 0; i < docs.length; i += BATCH) {
                    const chunk = docs.slice(i, i + BATCH);
                    if (chunk.length === 0)
                        continue;
                    const values = [];
                    const params = [];
                    chunk.forEach((d, idx) => {
                        const base = idx * 3;
                        values.push(`($${base + 1}, $${base + 2}::jsonb, $${base + 3}::jsonb)`);
                        params.push(d.text, JSON.stringify(d.embedding ?? []), JSON.stringify(d.metadata ?? {}));
                    });
                    const sql = `insert into documents (text, embedding, metadata) values ${values.join(', ')}`;
                    await client.query(sql, params);
                }
                return { count: docs.length };
            }
            finally {
                client.release();
            }
        }
    };
}
