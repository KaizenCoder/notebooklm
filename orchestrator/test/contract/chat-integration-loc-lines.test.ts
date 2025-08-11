import { buildApp } from '../../src/app.js';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
  OLLAMA_LLM_MODEL: 'qwen3:8b-q4_K_M'
} as any;

const fakeOllama = {
  listModels: async () => ({ models: [] }),
  checkGpu: async () => true,
  chat: async (_model: string, _messages: any[]) => ({ message: { content: 'Answer with citations [1]' } })
};

const fakeSupabase = {
  matchDocuments: async (_q: string, _n?: string) => ([{ id: 's1', text: 'chunk text', metadata: { loc: { lines: { from: 10, to: 18 } } } }])
};

let rows: any[] = [];
const fakeDb = {
  ping: async () => true,
  insertChatHistory: async (notebookId: string|null, role: 'user'|'assistant', content: string, userId?: string|null, timestampIso?: string|null) => {
    rows.push({ notebookId, role, content, userId, timestampIso });
    return { id: `${rows.length}` };
  }
};

const app = buildApp({ env, db: fakeDb as any, supabase: fakeSupabase as any, ollama: fakeOllama as any });

const payload = {
  session_id: '11111111-1111-1111-1111-111111111111',
  message: 'Bonjour',
  user_id: '22222222-2222-2222-2222-222222222222',
  timestamp: new Date().toISOString()
};

const res = await app.inject({ method: 'POST', url: '/webhook/chat', headers: { Authorization: 'Bearer test' }, payload });

if (res.statusCode !== 200) {
  console.error('chat loc-lines should be 200, got', res.statusCode, res.body);
  process.exit(1);
}

const body = res.json();
const out = body?.data?.output?.[0];
if (!out || !Array.isArray(out.citations) || out.citations.length === 0) {
  console.error('expected citations present', body);
  process.exit(1);
}
const c = out.citations[0];
if (c.source_id !== 's1' || c.lines?.from !== 10 || c.lines?.to !== 18) {
  console.error('expected citation to reflect loc.lines {10,18}', c);
  process.exit(1);
}

if (rows.length < 2 || rows[0].role !== 'user' || rows[1].role !== 'assistant') {
  console.error('expected 2 chat history rows (user then assistant), got', rows);
  process.exit(1);
}
if (rows[0].userId !== payload.user_id || typeof rows[0].timestampIso !== 'string') {
  console.error('expected user row to carry user_id and timestamp', rows[0]);
  process.exit(1);
}

console.log('PASS chat-integration-loc-lines');
