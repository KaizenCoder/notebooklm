import { buildApp } from '../../src/app.js';
import Fastify from 'fastify';
import { request as undiciRequest } from 'undici';

// E2E smoke: simulate Edge Function process-document forwarding to orchestrator

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434'
} as any;

const app = buildApp({ env });

// Edge function mock
const edge = Fastify({ logger: false });
edge.post('/functions/v1/process-document', async (req, reply) => {
  const payload: any = req.body ?? {};
  const res = await app.inject({
    method: 'POST',
    url: '/webhook/process-document',
    headers: { Authorization: env.NOTEBOOK_GENERATION_AUTH },
    payload
  });
  reply.code(res.statusCode).headers(res.headers).send(res.body);
});

await edge.listen({ port: 0, host: '127.0.0.1' });
const address = edge.server.address();
const port = typeof address === 'object' && address ? address.port : 0;

// Use legacy-friendly minimal payload to get accepted 202
const payload = { path: '/tmp/file.pdf' };

const res = await undiciRequest(`http://127.0.0.1:${port}/functions/v1/process-document`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(payload)
});

if (res.statusCode !== 202) {
  console.error('E2E process-document should be 202, got', res.statusCode, await res.body.text());
  process.exit(1);
}

const body = await res.body.json();
if (!body?.success || typeof body?.message !== 'string') {
  console.error('E2E body shape invalid', body);
  process.exit(1);
}

await edge.close();
console.log('PASS process-document-edge-e2e');
