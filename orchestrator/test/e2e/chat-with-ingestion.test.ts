import { buildApp } from '../../src/app.js';
import Fastify from 'fastify';
import { request as undiciRequest } from 'undici';

// E2E: simulate a simple flow where an Edge ingests a doc, then chat retrieves citations

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
  OLLAMA_LLM_MODEL: 'qwen3:8b-q4_K_M'
} as any;

// State for mocked RPC
let lastDocs: any[] = [];

const fakeOllama = {
  listModels: async () => ({ models: [] }),
  checkGpu: async () => true,
  chat: async (_model: string, _messages: any[]) => ({ message: { content: 'Answer [1]' } })
};

const fakeSupabase = {
  matchDocuments: async (_q: string, _n?: string) => (lastDocs.length ? lastDocs : [])
};

const app = buildApp({ env, supabase: fakeSupabase as any, ollama: fakeOllama as any });

// Edge mock with two functions: process-document and send-chat-message
const edge = Fastify({ logger: false });
edge.post('/functions/v1/process-document', async (req, reply) => {
  const payload: any = req.body ?? {};
  // forward to orchestrator
  const res = await app.inject({
    method: 'POST',
    url: '/webhook/process-document',
    headers: { Authorization: env.NOTEBOOK_GENERATION_AUTH },
    payload: { notebook_id: payload.notebook_id, source_id: payload.source_id, text: payload.text }
  });
  // On success, update the mocked documents to include loc.lines for retrieval
  if (res.statusCode === 202) {
    lastDocs = [{ id: payload.source_id, text: payload.text?.slice(0, 50) ?? 'text', metadata: { loc: { lines: { from: 5, to: 12 } } } }];
  }
  reply.code(res.statusCode).headers(res.headers()).send(res.body);
});
edge.post('/functions/v1/send-chat-message', async (req, reply) => {
  const payload: any = req.body ?? {};
  const res = await app.inject({
    method: 'POST',
    url: '/webhook/chat',
    headers: { Authorization: env.NOTEBOOK_GENERATION_AUTH },
    payload: { session_id: payload.session_id, message: payload.message, user_id: payload.user_id, timestamp: payload.timestamp }
  });
  reply.code(res.statusCode).headers(res.headers()).send(res.body);
});

await edge.listen({ port: 0, host: '127.0.0.1' });
const address = edge.server.address();
const port = typeof address === 'object' && address ? address.port : 0;

const notebook_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const source_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

// 1) Ingestion via Edge
let r1 = await undiciRequest(`http://127.0.0.1:${port}/functions/v1/process-document`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ notebook_id, source_id, text: 'content with lines' })
});
if (r1.statusCode !== 202) {
  console.error('E2E ingestion should be 202, got', r1.statusCode, await r1.body.text());
  process.exit(1);
}

// 2) Chat via Edge
const payload = { session_id: notebook_id, message: 'question', user_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', timestamp: new Date().toISOString() };
let r2 = await undiciRequest(`http://127.0.0.1:${port}/functions/v1/send-chat-message`, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload)
});
if (r2.statusCode !== 200) {
  console.error('E2E chat should be 200, got', r2.statusCode, await r2.body.text());
  process.exit(1);
}
const body = await r2.body.json();
const c = body?.data?.output?.[0]?.citations?.[0];
if (!c || c.source_id !== source_id || c.lines?.from !== 5 || c.lines?.to !== 12) {
  console.error('Expected citation reflecting loc.lines {5,12} and source_id', c);
  process.exit(1);
}

await edge.close();
console.log('PASS chat-with-ingestion-e2e');
