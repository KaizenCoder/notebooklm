import { buildApp } from '../../src/app.js';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
  OLLAMA_LLM_MODEL: 'qwen3:8b-q4_K_M'
} as any;

let inserts: any[] = [];
const fakeDb = {
  ping: async () => true,
  insertMessage: async (notebookId: string|null, role: string, content: string) => { inserts.push({ notebookId, role, content }); return { id: '1' }; }
};

const fakeOllama = {
  listModels: async () => ({ models: [] }),
  checkGpu: async () => true,
  chat: async (_model: string, _messages: any[]) => ({ message: { content: 'A1' } })
};

const fakeSupabase = { matchDocuments: async () => ([] as any[]) };

const app = buildApp({ env, db: fakeDb as any, ollama: fakeOllama as any, supabase: fakeSupabase as any });

const res = await app.inject({
  method: 'POST',
  url: '/webhook/chat',
  headers: { Authorization: 'Bearer test' },
  payload: { messages: [{ role: 'user', content: 'U1' }], notebookId: 'nb1' },
});

if (res.statusCode !== 200) {
  console.error('chat persist should be 200, got', res.statusCode, res.body);
  process.exit(1);
}

if (inserts.length < 2) {
  console.error('expected two inserts (user + assistant), got', inserts);
  process.exit(1);
}

console.log('PASS chat-persist');
