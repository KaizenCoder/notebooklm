import { buildApp } from '../../src/app.js';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
  OLLAMA_LLM_MODEL: 'llama3'
} as any;

// Capture logs to assert presence of llm_generate_ms
const captured: any[] = [];
const fakeLogger = {
  info: (obj: any, msg?: string) => { captured.push({ obj, msg }); },
  error: (_o: any, _m?: string) => { /* ignore */ }
} as any;

// Fake minimal deps provided at build time
const fakeSupabase = { matchDocuments: async () => [] } as any;
const fakeOllama = { chat: async (_m: string, _msgs: any[]) => { await new Promise(r=>setTimeout(r, 5)); return { message: { content: 'ok' } }; } } as any;
const app = buildApp({ env, supabase: fakeSupabase, ollama: fakeOllama } as any);
(app as any).log = fakeLogger;

const res = await app.inject({ method: 'POST', url: '/webhook/chat', headers: { Authorization: 'Bearer test' }, payload: { messages: [{ role: 'user', content: 'hi' }] } });
if (res.statusCode !== 200) { console.error('expected 200 chat'); process.exit(1); }

const ev = captured.find(e => e?.obj?.event_code === 'RAG_COMPLETE');
if (!ev) { console.error('expected RAG_COMPLETE event log'); process.exit(1); }
if (typeof ev.obj.llm_generate_ms !== 'number' || ev.obj.llm_generate_ms < 0) {
  console.error('expected llm_generate_ms numeric in RAG_COMPLETE', ev.obj);
  process.exit(1);
}

console.log('PASS chat-llm-metrics');
