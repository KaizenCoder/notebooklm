import { Env } from '../env.js';
import { request as undiciRequest } from 'undici';

export function createStorage(_env: Env) {
  const TIMEOUT_MS = 5000;

  return {
    async fetchText(url: string): Promise<string> {
      const res = await undiciRequest(url, { method: 'GET', headersTimeout: TIMEOUT_MS, bodyTimeout: TIMEOUT_MS });
      if (res.statusCode >= 400) throw new Error(`Storage GET failed: ${res.statusCode}`);
      return res.body.text();
    },
    async upload(bin: Uint8Array, path: string): Promise<string> {
      // Mock upload -> return local URL
      return `http://local/${path}`;
    }
  };
}

export type StorageClient = ReturnType<typeof createStorage>;
