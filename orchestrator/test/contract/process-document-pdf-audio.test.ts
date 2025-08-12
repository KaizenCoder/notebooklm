import { buildApp } from '../../src/app.js';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
  OLLAMA_EMBED_MODEL: 'nomic-embed-text'
} as any;

let upserts: any[] = [];
const fakeDb = { ping: async () => true, upsertDocuments: async (docs: any[]) => { upserts.push(...docs); }, updateSourceStatus: async () => {} };
const fakeOllama = { embeddings: async (_m: string, prompt: string) => Array.from({ length: 8 }, (_, i) => i + prompt.length) };
const fakeJobs = { add: (_: string, fn: () => any) => { Promise.resolve().then(() => fn()); }, size: () => 0 };
const fakePdf = { extractText: async (_url: string) => 'PDF line A\nPDF line B' };
const fakeWhisper = { transcribe: async (_url: string) => 'ASR line A\nASR line B' };

const { createDocumentProcessor } = await import('../../src/services/document.js');
const fakeDocProc = createDocumentProcessor(env, { ollama: fakeOllama as any, db: fakeDb as any, pdf: fakePdf as any, whisper: fakeWhisper as any });
const app = buildApp({ env, db: fakeDb as any, ollama: fakeOllama as any, jobs: fakeJobs as any, docProc: fakeDocProc });

// PDF
{
  upserts = [];
  const res = await app.inject({ method: 'POST', url: '/webhook/process-document', headers: { Authorization: 'Bearer test' }, payload: { source_id: 's_pdf', source_type: 'pdf', file_url: 'http://local/doc.pdf', file_path: 'p', callback_url: 'http://local/cb' } });
  if (res.statusCode !== 202) { console.error('process-document (pdf) should be 202, got', res.statusCode, res.body); process.exit(1); }
  await new Promise((r) => setTimeout(r, 0));
  if (!upserts.length) { console.error('expected upserts for pdf'); process.exit(1); }
}

// Audio
{
  upserts = [];
  const res = await app.inject({ method: 'POST', url: '/webhook/process-document', headers: { Authorization: 'Bearer test' }, payload: { source_id: 's_audio', source_type: 'audio', file_url: 'http://local/audio.mp3', file_path: 'p', callback_url: 'http://local/cb' } });
  if (res.statusCode !== 202) { console.error('process-document (audio) should be 202, got', res.statusCode, res.body); process.exit(1); }
  await new Promise((r) => setTimeout(r, 0));
  if (!upserts.length) { console.error('expected upserts for audio'); process.exit(1); }
}

console.log('PASS process-document-pdf-audio');
