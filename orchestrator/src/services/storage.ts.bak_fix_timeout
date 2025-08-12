import { Env } from '../env.js';
import { request as undiciRequest } from 'undici';

export function createStorage(env: Env) {
  const base = env.STORAGE_BASE_URL ?? '';

  return {
    async fetchText(url: string, correlationId?: string): Promise<string> {
      const res = await undiciRequest(url, {
        method: 'GET',
        headers: correlationId ? { 'x-correlation-id': correlationId } : undefined
      });
      if (res.statusCode >= 400) throw new Error(`Storage GET failed: ${res.statusCode}`);
      return res.body.text();
    },
    async upload(bin: Uint8Array, path: string, correlationId?: string): Promise<string> {
      if (!base) throw new Error('STORAGE_BASE_URL not configured');
      const res = await undiciRequest(`${base}/${path}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/octet-stream', ...(correlationId ? { 'x-correlation-id': correlationId } : {}) },
        body: bin
      });
      if (res.statusCode >= 400) throw new Error(`Storage PUT failed: ${res.statusCode}`);
      return `${base}/${path}`;
    },
    async uploadText(text: string, path: string, correlationId?: string): Promise<string> {
      const encoder = new TextEncoder();
      const bin = encoder.encode(text);
      return this.upload(bin, path, correlationId);
    }
  };
}

export type StorageClient = ReturnType<typeof createStorage>;
