import { buildApp } from '../../src/app.js';
// Minimal fake deps to avoid external calls
const env = {
    PORT: '8000',
    NOTEBOOK_GENERATION_AUTH: 'secret',
    OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
    OLLAMA_EMBED_MODEL: 'nomic-embed-text',
    OLLAMA_LLM_MODEL: 'qwen3:8b-q4_K_M'
};
const fakeDb = { ping: async () => true };
const fakeOllama = { listModels: async () => ({ models: [{ name: 'nomic-embed-text' }, { name: 'qwen3:8b-q4_K_M' }] }) };
const app = buildApp({ env, db: fakeDb, ollama: fakeOllama });
const res = await app.inject({ method: 'GET', url: '/ready' });
if (res.statusCode !== 200) {
    console.error('Ready should be 200, got', res.statusCode, res.body);
    process.exit(1);
}
console.log('PASS ready');
