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
  chat: async (_model: string, _messages: any[]) => ({ message: { content: 'Hello there' } })
};

const fakeSupabase = {
  matchDocuments: async (_q: string, _n?: string) => ([{ id: 'c1', text: 'cite' }])
};

const app = buildApp({ env, ollama: fakeOllama as any, supabase: fakeSupabase as any });

const res = await app.inject({
  method: 'POST',
  url: '/webhook/chat',
  headers: { Authorization: 'Bearer test' },
  payload: { messages: [{ role: 'user', content: 'Hi' }], notebookId: 'nb1' },
});

if (res.statusCode !== 200) {
  console.error('chat integration should be 200, got', res.statusCode, res.body);
  process.exit(1);
}

const body = res.json();
if (!body.success || !body.data || !Array.isArray(body.data.output) || body.data.output.length === 0) {
  console.error('chat integration shape invalid', body);
  process.exit(1);
}

console.log('PASS chat-integration');
