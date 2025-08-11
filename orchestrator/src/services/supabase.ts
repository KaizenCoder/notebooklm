import { Env } from '../env.js';
import { request as undiciRequest } from 'undici';

export type MatchDocument = {
  id?: string;
  text?: string;
  metadata?: Record<string, unknown>;
};

export function createSupabase(env: Env, httpRequest: typeof undiciRequest = undiciRequest) {
  const baseUrl = env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const TIMEOUT_MS = 4000;

  async function rpc<T = unknown>(fn: string, body: Record<string, unknown>): Promise<T> {
    if (!baseUrl || !serviceKey) throw new Error('Supabase env not configured');
  const res = await httpRequest(`${baseUrl}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headersTimeout: TIMEOUT_MS,
      bodyTimeout: TIMEOUT_MS,
      headers: {
        'content-type': 'application/json',
        'apikey': serviceKey,
        'authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify(body)
    });
    if (res.statusCode >= 400) {
      const text = await res.body.text();
      throw new Error(`Supabase RPC ${fn} failed: ${res.statusCode} ${text}`);
    }
    return res.body.json() as Promise<T>;
  }

  return {
    async matchDocuments(query: string, notebookId?: string): Promise<MatchDocument[]> {
      // Body shape should mirror the original RPC contract; keep minimal here
      const payload: Record<string, unknown> = { query };
      if (notebookId) payload['notebook_id'] = notebookId;
      return rpc<MatchDocument[]>('match_documents', payload);
    }
  };
}

export type SupabaseClient = ReturnType<typeof createSupabase>;
