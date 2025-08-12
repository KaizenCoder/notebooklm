/**
 * Whisper ASR (Automatic Speech Recognition) Adapter
 * Implémentation minimale orientée production (sans valeurs simulées)
 */
export class WhisperAdapter {
    baseUrl;
    apiKey;
    timeoutMs;
    constructor(baseUrl = 'http://localhost:9000', apiKey, timeoutMs = 15000) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.timeoutMs = timeoutMs;
    }
    async transcribe(audioBuffer, options = {}) {
        const formData = new FormData();
        if (typeof audioBuffer === 'string') {
            const fs = await import('fs/promises');
            const fileBuffer = await fs.readFile(audioBuffer);
            formData.append('file', new Blob([new Uint8Array(fileBuffer)]), 'audio.wav');
        }
        else {
            formData.append('file', new Blob([new Uint8Array(audioBuffer)]), 'audio.wav');
        }
        if (options.model)
            formData.append('model', options.model);
        if (options.language)
            formData.append('language', options.language);
        if (typeof options.temperature === 'number')
            formData.append('temperature', String(options.temperature));
        if (options.response_format)
            formData.append('response_format', options.response_format);
        const controller = new AbortController();
        const to = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const response = await fetch(`${this.baseUrl}/v1/audio/transcriptions`, {
                method: 'POST',
                headers: {
                    ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
                },
                body: formData,
                signal: controller.signal,
            });
            clearTimeout(to);
            if (!response.ok) {
                throw new Error(`Whisper API error: ${response.status} ${response.statusText}`);
            }
            const result = await response.json();
            if (typeof result?.text !== 'string' || result.text.length === 0) {
                throw new Error('Whisper API invalid response: missing text');
            }
            const segments = Array.isArray(result.segments) ? result.segments : [];
            const language = typeof result.language === 'string' ? result.language : (options.language ?? 'en');
            const duration = typeof result.duration === 'number' ? result.duration : undefined;
            return { text: result.text, segments, language, duration };
        }
        catch (err) {
            clearTimeout(to);
            if (err?.name === 'AbortError') {
                throw new Error(`Whisper API timeout after ${this.timeoutMs}ms`);
            }
            throw err;
        }
    }
    async getModels() {
        const response = await fetch(`${this.baseUrl}/v1/models`, {
            headers: {
                ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
            }
        });
        if (!response.ok) {
            throw new Error(`Whisper models error: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        return Array.isArray(result.data) ? result.data : [];
    }
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: {
                    ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
                }
            });
            return {
                status: response.ok ? 'healthy' : 'unhealthy',
                details: response.ok ? undefined : `HTTP ${response.status}`
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                details: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
export function createWhisperAdapter(baseUrl, apiKey) {
    return new WhisperAdapter(baseUrl, apiKey);
}
