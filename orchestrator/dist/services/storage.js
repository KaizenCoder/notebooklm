import { request as undiciRequest } from 'undici';
export function createStorage(env) {
    const base = env.STORAGE_BASE_URL ?? '';
    const TIMEOUT_MS = 5000;
    return {
        async fetchText(url) {
            const res = await undiciRequest(url, { method: 'GET', headersTimeout: TIMEOUT_MS, bodyTimeout: TIMEOUT_MS });
            if (res.statusCode >= 400)
                throw new Error(`Storage GET failed: ${res.statusCode}`);
            return res.body.text();
        },
        async upload(bin, path) {
            if (!base)
                throw new Error('STORAGE_BASE_URL not configured');
            const res = await undiciRequest(`${base}/${path}`, {
                method: 'PUT',
                headers: { 'content-type': 'application/octet-stream' },
                headersTimeout: TIMEOUT_MS,
                bodyTimeout: TIMEOUT_MS,
                body: bin
            });
            if (res.statusCode >= 400)
                throw new Error(`Storage PUT failed: ${res.statusCode}`);
            // Assuming the storage service returns the URL in a Location header or similar
            // For now, we'll construct it based on the base URL and path
            return `${base}/${path}`;
        }
    };
}
