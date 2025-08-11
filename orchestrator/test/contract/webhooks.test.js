import { buildApp } from '../../src/app.js';
async function run() {
    const env = {
        PORT: '0',
        NOTEBOOK_GENERATION_AUTH: 'Bearer test',
        OLLAMA_BASE_URL: 'http://127.0.0.1:11434'
    };
    const app = buildApp({ env });
    // chat
    {
        const res = await app.inject({
            method: 'POST',
            url: '/webhook/chat',
            headers: { Authorization: 'Bearer test' },
            payload: { messages: [{ role: 'user', content: 'Hello' }] },
        });
        if (res.statusCode !== 200) {
            console.error('chat should be 200, got', res.statusCode, res.body);
            process.exit(1);
        }
        const body = res.json();
        if (!body.success || !body.data || !Array.isArray(body.data.output)) {
            console.error('chat response shape invalid', body);
            process.exit(1);
        }
    }
    // generate-notebook-content
    {
        const res = await app.inject({
            method: 'POST',
            url: '/webhook/generate-notebook-content',
            headers: { Authorization: 'Bearer test' },
            payload: { documentId: 'doc_1' },
        });
        if (res.statusCode !== 202) {
            console.error('generate-notebook-content should be 202, got', res.statusCode, res.body);
            process.exit(1);
        }
        const body = res.json();
        if (!body.success || typeof body.message !== 'string') {
            console.error('generate-notebook-content response shape invalid', body);
            process.exit(1);
        }
    }
    // process-document
    {
        const res = await app.inject({
            method: 'POST',
            url: '/webhook/process-document',
            headers: { Authorization: 'Bearer test' },
            payload: { path: '/tmp/file.pdf' },
        });
        if (res.statusCode !== 202) {
            console.error('process-document should be 202, got', res.statusCode, res.body);
            process.exit(1);
        }
        const body = res.json();
        if (!body.success || typeof body.message !== 'string') {
            console.error('process-document response shape invalid', body);
            process.exit(1);
        }
    }
    // generate-audio
    {
        const res = await app.inject({
            method: 'POST',
            url: '/webhook/generate-audio',
            headers: { Authorization: 'Bearer test' },
            payload: { notebookId: 'nb_1' },
        });
        if (res.statusCode !== 202) {
            console.error('generate-audio should be 202, got', res.statusCode, res.body);
            process.exit(1);
        }
        const body = res.json();
        if (!body.success || typeof body.message !== 'string') {
            console.error('generate-audio response shape invalid', body);
            process.exit(1);
        }
    }
    console.log('PASS webhooks');
}
await run();
