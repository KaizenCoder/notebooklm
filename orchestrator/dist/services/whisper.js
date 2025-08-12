import { request as undiciRequest } from 'undici';
export function createWhisper(env) {
    const base = env.WHISPER_ASR_URL ?? '';
    const TIMEOUT_MS = 8000;
    return {
        async transcribe(url) {
            if (!base)
                throw new Error('WHISPER_ASR_URL not configured');
            const res = await undiciRequest(`${base}/transcribe`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                headersTimeout: TIMEOUT_MS,
                bodyTimeout: TIMEOUT_MS,
                body: JSON.stringify({ url })
            });
            if (res.statusCode >= 400)
                throw new Error(`Whisper transcribe failed: ${res.statusCode}`);
            const data = await res.body.json();
            return String(data?.text ?? '');
        }
    };
}
