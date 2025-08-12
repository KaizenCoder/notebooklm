import { buildApp } from '../../src/app.js';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
  OLLAMA_EMBED_MODEL: 'nomic-embed-text'
} as any;

let upserts: any[] = [];
let statuses: any[] = [];
const fakeDb = {
  ping: async () => true,
  upsertDocuments: async (docs: any[]) => { upserts.push(...docs); },
  updateSourceStatus: async (id: string, status: string) => { statuses.push([id, status]); }
};

const fakePdf = { extractText: async (url: string) => `PDF text from ${url}` };
const fakeOllama = { embeddings: async (_m: string, p: string) => Array.from({ length: 8 }, (_, i) => i + p.length) };
const fakeJobs = { add: (_: string, fn: () => any) => { Promise.resolve().then(() => fn()); }, size: () => 0 };

const app = buildApp({ env, db: fakeDb as any, pdf: fakePdf as any, ollama: fakeOllama as any, jobs: fakeJobs as any, supabase: {} as any });

const res = await app.inject({
  method: 'POST', url: '/webhook/process-document', headers: { Authorization: 'Bearer test' },
  payload: { source_id: 's_pdf', file_url: 'local:///bucket/s.pdf', file_path: '/bucket/s.pdf', source_type: 'pdf', callback_url: 'http://localhost/cb', notebook_id: 'nb_pdf' }
});

if (res.statusCode !== 202) { console.error('process-document pdf should be 202, got', res.statusCode, res.body); process.exit(1); }
await new Promise((r) => setTimeout(r, 0));

if (!upserts.length) { console.error('Expected upsertDocuments for pdf'); process.exit(1); }
if (!statuses.length || statuses[0][1] !== 'indexing' || statuses[statuses.length - 1][1] !== 'ready') { console.error('Expected status indexing->ready for pdf', statuses); process.exit(1); }
for (const d of upserts) {
  if (d.metadata?.notebook_id !== 'nb_pdf' || d.metadata?.source_id !== 's_pdf') { console.error('Bad metadata for pdf'); process.exit(1); }
  if (!Array.isArray(d.embedding) || d.embedding.length !== 8) { console.error('Embedding dims mismatch for pdf'); process.exit(1); }
}

console.log('PASS integration: process-document pdf');
