import { Env } from '../env.js';
import { request } from 'undici';

export function createOllama(env: Env) {
  const base = env.OLLAMA_BASE_URL ?? 'http://ollama:11434';
  const TIMEOUT_MS = 3000;
  const RETRIES = 2;

  async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastErr: unknown;
    for (let i = 0; i <= RETRIES; i++) {
      try { return await fn(); } catch (e) { lastErr = e; }
    }
    throw lastErr;
  }

  return {
    async listModels() {
      const res = await request(`${base}/api/tags`, { method: 'GET', headersTimeout: TIMEOUT_MS, bodyTimeout: TIMEOUT_MS });
      if (res.statusCode >= 400) throw new Error(`Ollama tags failed: ${res.statusCode}`);
      return res.body.json();
    },
    async chat(model: string, messages: Array<{ role: string; content: string }>): Promise<{ message: { content: string } }> {
      return withRetry(async () => {
        const res = await request(`${base}/api/chat`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          headersTimeout: TIMEOUT_MS,
          bodyTimeout: TIMEOUT_MS,
          body: JSON.stringify({ model, messages })
        });
        if (res.statusCode >= 400) throw new Error(`Ollama chat failed: ${res.statusCode}`);
        return res.body.json() as any;
      });
    },
    async embeddings(model: string, prompt: string): Promise<number[]> {
      return withRetry(async () => {
        const res = await request(`${base}/api/embeddings`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          headersTimeout: TIMEOUT_MS,
          bodyTimeout: TIMEOUT_MS,
          body: JSON.stringify({ model, prompt })
        });
        if (res.statusCode >= 400) throw new Error(`Ollama embeddings failed: ${res.statusCode}`);
        const data: any = await res.body.json();
        return Array.isArray(data.embedding) ? data.embedding : [];
      });
    },
    async checkGpu(embedModel: string): Promise<boolean> {
      return withRetry(async () => {
        const res = await request(`${base}/api/embeddings`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          headersTimeout: TIMEOUT_MS,
          bodyTimeout: TIMEOUT_MS,
          body: JSON.stringify({ model: embedModel, prompt: 'ok' })
        });
        if (res.statusCode >= 400) return false;
        const data: any = await res.body.json();
        return Array.isArray(data.embedding) && data.embedding.length > 0;
      });
    }
  };
}
