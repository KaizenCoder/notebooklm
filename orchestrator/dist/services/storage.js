import { request as undiciRequest } from 'undici';
export function createStorage(env) {
    const base = env.STORAGE_BASE_URL ?? '';
    return {
        async fetchText(url, correlationId) {
            const res = await undiciRequest(url, {
                method: 'GET',
                headers: correlationId ? { 'x-correlation-id': correlationId } : undefined
            });
            if (res.statusCode >= 400)
                throw new Error(`Storage GET failed: ${res.statusCode}`);
            return res.body.text();
        },
        async upload(bin, path, correlationId) {
            if (!base)
                throw new Error('STORAGE_BASE_URL not configured');
            const res = await undiciRequest(`${base}/${path}`, {
                method: 'PUT',
                headers: { 'content-type': 'application/octet-stream', ...(correlationId ? { 'x-correlation-id': correlationId } : {}) },
                body: bin
            });
            if (res.statusCode >= 400)
                throw new Error(`Storage PUT failed: ${res.statusCode}`);
            return `${base}/${path}`;
        },
        async uploadText(text, path, correlationId) {
            const encoder = new TextEncoder();
            const bin = encoder.encode(text);
            return this.upload(bin, path, correlationId);
        }
    };
}
