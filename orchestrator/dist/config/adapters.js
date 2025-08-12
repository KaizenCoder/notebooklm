/**
 * Production configuration for adapters
 * Environment-based configuration for deployment
 */
const DEVELOPMENT_CONFIG = {
    whisper: {
        baseUrl: 'http://localhost:8001',
        timeout: 30000,
        maxRetries: 3
    },
    coqui: {
        baseUrl: 'http://localhost:8002',
        timeout: 30000,
        maxRetries: 3
    },
    storage: {
        basePath: './storage',
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: ['application/pdf', 'audio/wav', 'audio/mpeg', 'text/plain'],
        enableValidation: false
    }
};
const PRODUCTION_CONFIG = {
    whisper: {
        baseUrl: process.env.WHISPER_API_URL || 'https://api.openai.com/v1',
        apiKey: process.env.WHISPER_API_KEY,
        timeout: 60000,
        maxRetries: 3
    },
    coqui: {
        baseUrl: process.env.COQUI_API_URL || 'https://app.coqui.ai/api/v2',
        apiKey: process.env.COQUI_API_KEY,
        timeout: 60000,
        maxRetries: 3
    },
    storage: {
        basePath: process.env.STORAGE_PATH || '/app/storage',
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '50000000'), // 50MB
        allowedMimeTypes: [
            'application/pdf',
            'text/plain',
            'text/markdown',
            'audio/wav',
            'audio/mpeg',
            'audio/mp4',
            'application/json'
        ],
        enableValidation: true
    }
};
export function getAdapterConfig() {
    const isProduction = process.env.NODE_ENV === 'production';
    return isProduction ? PRODUCTION_CONFIG : DEVELOPMENT_CONFIG;
}
// Export individual configs for easier access
export const adapterConfig = getAdapterConfig();
