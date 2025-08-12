import { buildApp } from '../../src/app.js';
const env = {
    PORT: '8000',
    NOTEBOOK_GENERATION_AUTH: 'secret',
    OLLAMA_BASE_URL: 'http://127.0.0.1:11434'
};
const app = buildApp({ env });
const res = await app.inject({ method: 'GET', url: '/health' });
if (res.statusCode !== 200) {
    console.error('Health should be 200, got', res.statusCode, res.body);
    process.exit(1);
}
console.log('PASS health');
