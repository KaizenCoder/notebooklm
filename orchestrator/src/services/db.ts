import { Env } from '../env.js';
import pg from 'pg';

export function createDb(env: Env) {
  const pool = env.POSTGRES_DSN ? new pg.Pool({ connectionString: env.POSTGRES_DSN }) : null;
  return {
    async ping() {
      if (!pool) return true;
      const client = await pool.connect();
      try {
        await client.query('select 1');
        return true;
      } finally {
        client.release();
      }
    },
    async insertMessage(notebookId: string | null, role: string, content: string) {
      if (!pool) return { id: 'mock', notebook_id: notebookId, role, content };
      const client = await pool.connect();
      try {
        const sql = 'insert into messages (notebook_id, role, content) values ($1,$2,$3) returning id';
        const res = await client.query(sql, [notebookId, role, content]);
        return { id: res.rows[0]?.id, notebook_id: notebookId, role, content };
      } finally {
        client.release();
      }
    },
    async insertChatHistory(notebookId: string | null, role: 'user'|'assistant', content: string, userId?: string|null, timestampIso?: string|null) {
      const row = {
        notebook_id: notebookId,
        role,
        content,
        user_id: userId ?? null,
        timestamp: timestampIso ?? new Date().toISOString()
      };
      if (!pool) return { id: 'mock', ...row };
      const client = await pool.connect();
      try {
        const sql = 'insert into n8n_chat_histories (notebook_id, role, content, user_id, timestamp) values ($1,$2,$3,$4,$5) returning id';
        const res = await client.query(sql, [notebookId, role, content, userId ?? null, timestampIso ?? new Date().toISOString()]);
        return { id: res.rows[0]?.id, ...row };
      } finally {
        client.release();
      }
    },
    async updateSourceStatus(sourceId: string | null, status: string) {
      if (!pool) return { id: sourceId, status };
      const client = await pool.connect();
      try {
        const sql = 'update sources set status = $2 where id = $1';
        await client.query(sql, [sourceId, status]);
        return { id: sourceId, status };
      } finally {
        client.release();
      }
    },
    async updateNotebookStatus(notebookId: string | null, status: string) {
      if (!pool) return { id: notebookId, status } as any;
      const client = await pool.connect();
      try {
        const sql = 'update notebooks set audio_overview_generation_status = $2 where id = $1';
        await client.query(sql, [notebookId, status]);
        return { id: notebookId, status } as any;
      } finally {
        client.release();
      }
    },
    async setNotebookAudio(notebookId: string, audioUrl: string) {
      if (!pool) return { id: notebookId, audio_overview_url: audioUrl } as any;
      const client = await pool.connect();
      try {
        const sql = 'update notebooks set audio_overview_url = $2, audio_url_expires_at = now() + interval \'24 hours\' where id = $1';
        await client.query(sql, [notebookId, audioUrl]);
        return { id: notebookId, audio_overview_url: audioUrl } as any;
      } finally {
        client.release();
      }
    },
    async upsertDocuments(docs: Array<{ text: string; embedding: number[]; metadata?: Record<string, unknown> }>) {
      if (!pool) return { count: docs.length };
      const client = await pool.connect();
      try {
        const sql = 'insert into documents (text, embedding, metadata) values ($1, $2, $3)';
        for (const d of docs) {
          await client.query(sql, [d.text, d.embedding, d.metadata ?? {}]);
        }
        return { count: docs.length };
      } finally {
        client.release();
      }
    }
  };
}
