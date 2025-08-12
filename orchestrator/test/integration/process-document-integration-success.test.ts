import { buildApp } from '../../src/app.ts';
import Fastify from 'fastify';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434'
} as any;

// db mock
let updateSourceStatusCalls: Array<{ id: string, status: string }> = [];
const db = {
  ping: async () => true,
  insertMessage: async () => {},
  updateSourceStatus: async (id: string, status: string) => { updateSourceStatusCalls.push({ id, status }); }
} as any;

// docProc mock (success both immediate + job)
const docProc = {
  processDocument: async (_args: any) => { /* ok */ }
} as any;

const supabase = { matchDocuments: async () => ([] as any[]) } as any;
const ollama = { listModels: async () => ({ models: [] }), checkGpu: async () => true } as any;

const app = buildApp({ env, db, supabase, ollama, docProc });

// Callback receiver
const cb = Fastify({ logger: false });
let received: any = null;
let resolveCb: ((v: any) => void) | null = null;
const cbPromise = new Promise((resolve) => { resolveCb = resolve as any; });

cb.post('/functions/v1/process-document-callback', async (req, reply) => {
  received = req.body;
  reply.code(200).send({ ok: true });
  if (resolveCb) resolveCb(received);
});

await cb.listen({ port: 0, host: '127.0.0.1' });
const addr = cb.server.address();
const cbPort = typeof addr === 'object' && addr ? addr.port : 0;

const payload = {
  source_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  file_url: 'http://127.0.0.1:' + cbPort + '/doc.pdf',
  file_path: 'notebooks/aaaa/sources/doc.pdf',
  source_type: 'pdf',
  callback_url: `http://127.0.0.1:${cbPort}/functions/v1/process-document-callback`,
  notebook_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
};

const res = await app.inject({ method: 'POST', url: '/webhook/process-document', headers: { authorization: env.NOTEBOOK_GENERATION_AUTH }, payload });
if (res.statusCode !== 202) { console.error('expected 202, got', res.statusCode, res.body); process.exit(1); }

// wait callback
const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('callback timeout')), 4000));
await Promise.race([cbPromise, timeout]).catch((e) => { console.error(String(e)); process.exit(1); });

if (!received || received.status !== 'completed' || received.source_id !== payload.source_id) {
  console.error('unexpected callback', received);
  process.exit(1);
}

if (updateSourceStatusCalls.length !== 0) {
  console.error('updateSourceStatus should not be called on success', updateSourceStatusCalls);
  process.exit(1);
}

await cb.close();
console.log('PASS process-document-integration-success');
