import { request as undiciRequest } from 'undici';
export function createAudio(env) {
    const base = env.COQUI_TTS_URL ?? '';
    const TIMEOUT_MS = 8000;
    return {
        async synthesize(text) {
            if (!base)
                throw new Error('COQUI_TTS_URL not configured');
            const res = await undiciRequest(`${base}/synthesize`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                headersTimeout: TIMEOUT_MS,
                bodyTimeout: TIMEOUT_MS,
                body: JSON.stringify({ text })
            });
            if (res.statusCode >= 400)
                throw new Error(`Coqui TTS synthesize failed: ${res.statusCode}`);
            const arrayBuffer = await res.body.arrayBuffer();
            return new Uint8Array(arrayBuffer);
        }
    };
}
