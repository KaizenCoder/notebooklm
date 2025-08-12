import { Env } from '../env.js';
import { request as undiciRequest } from 'undici';

export function createWhisper(env: Env) {
  const base = env.WHISPER_ASR_URL ?? '';
  const TIMEOUT_MS = 8000;
  return {
    async transcribe(url: string, correlationId?: string): Promise<string> {
      if (!base) throw new Error('WHISPER_ASR_URL not configured');
      const res = await undiciRequest(`${base}/transcribe`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(correlationId ? { 'x-correlation-id': correlationId } : {}) },
        headersTimeout: TIMEOUT_MS,
        bodyTimeout: TIMEOUT_MS,
        body: JSON.stringify({ url })
      });
      if (res.statusCode >= 400) throw new Error(`Whisper transcribe failed: ${res.statusCode}`);
      const data: any = await res.body.json();
      return String(data?.text ?? '');
    }
  };
}

export type WhisperClient = ReturnType<typeof createWhisper>;
