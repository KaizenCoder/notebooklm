import { buildApp } from '../../src/app.ts';
import Fastify from 'fastify';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434'
} as any;

const fakeOllama = {
  listModels: async () => ({ models: [] }),
  checkGpu: async () => true,
  chat: async () => ({ message: { content: 'ok' } }),
  embeddings: async () => ({ embedding: new Array(768).fill(0) })
};

const fakeSupabase = { matchDocuments: async () => ([] as any[]) };

const app = buildApp({ env, supabase: fakeSupabase as any, ollama: fakeOllama as any });

// Callback receiver
const cb = Fastify({ logger: false });
let cbPayload: any = null;
let resolveCb: ((v: any) => void) | null = null;
const cbPromise = new Promise((resolve) => { resolveCb = resolve as any; });

cb.post('/functions/v1/process-document-callback', async (req, reply) => {
  cbPayload = req.body;
  reply.code(200).send({ ok: true });
  if (resolveCb) resolveCb(cbPayload);
});

await cb.listen({ port: 0, host: '127.0.0.1' });
const addr = cb.server.address();
const cbPort = typeof addr === 'object' && addr ? addr.port : 0;

const payload = {
  source_id: '11111111-1111-1111-1111-111111111111',
  file_url: 'http://127.0.0.1:' + cbPort + '/dummy.pdf',
  file_path: 'notebooks/1111/sources/doc.pdf',
  source_type: 'pdf',
  callback_url: `http://127.0.0.1:${cbPort}/functions/v1/process-document-callback`,
  notebook_id: '22222222-2222-2222-2222-222222222222'
};

const res = await app.inject({ method: 'POST', url: '/webhook/process-document', headers: { Authorization: env.NOTEBOOK_GENERATION_AUTH }, payload });
if (res.statusCode !== 202) {
  console.error('Expected 202 from process-document strict, got', res.statusCode, res.body);
  process.exit(1);
}

// Wait for callback (max ~4s)
const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('callback timeout')), 4000));
const received = await Promise.race([cbPromise, timeout]).catch((e) => { console.error(String(e)); process.exit(1); });

if (!received || received.source_id !== payload.source_id || received.status !== 'completed') {
  console.error('Unexpected callback payload', received);
  process.exit(1);
}

await cb.close();
console.log('PASS process-document-openapi-callback-e2e');
