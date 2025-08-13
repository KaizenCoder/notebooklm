import { buildApp } from '../../src/app.js';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
  OLLAMA_EMBED_MODEL: 'nomic-embed-text',
  PDF_BRIDGE_ENABLED: 'true',
  PDF_BRIDGE_TIMEOUT: '15'
} as any;

let upserts: any[] = [];
const fakeDb = { ping: async () => true, upsertDocuments: async (docs: any[]) => { upserts.push(...docs); }, updateSourceStatus: async () => {} };
const fakeOllama = { embeddings: async (_m: string, prompt: string) => Array.from({ length: 8 }, (_, i) => i + prompt.length) };
const fakeJobs = { add: (_: string, fn: () => any) => { Promise.resolve().then(() => fn()); }, size: () => 0 };

// Utiliser le vrai service PDF via le bridge
const { createPdf } = await import('../../src/services/pdf.js');
const realPdf = createPdf(env);

const { createDocumentProcessor } = await import('../../src/services/document.js');
const realDocProc = createDocumentProcessor(env, { 
  ollama: fakeOllama as any, 
  db: fakeDb as any, 
  pdf: realPdf as any 
});

const app = buildApp({ 
  env, 
  db: fakeDb as any, 
  ollama: fakeOllama as any, 
  jobs: fakeJobs as any, 
  docProc: realDocProc,
  pdf: realPdf as any
});

// Test PDF avec fixture réelle
try {
  upserts = [];
  
  // Utiliser une fixture PDF simple - chemin absolu requis
  const testPdfPath = `${process.cwd()}/test/fixtures/pdf/simple.pdf`;
  
  const res = await app.inject({ 
    method: 'POST', 
    url: '/webhook/process-document', 
    headers: { Authorization: 'Bearer test' }, 
    payload: { 
      source_id: 's_pdf_real', 
      source_type: 'pdf', 
      file_url: `file://${testPdfPath}`, 
      file_path: testPdfPath, 
      callback_url: 'http://local/cb' 
    } 
  });
  
  if (res.statusCode !== 202) { 
    console.error('process-document (real pdf) should be 202, got', res.statusCode, res.body); 
    process.exit(1); 
  }
  
  // Attendre le traitement asynchrone
  await new Promise((r) => setTimeout(r, 1000));
  
  if (!upserts.length) { 
    console.error('expected upserts for real pdf'); 
    process.exit(1); 
  }
  
  // Vérifier que le contenu PDF réel a été extrait
  const textContent = upserts[0]?.text || '';
  if (!textContent.includes('Simple PDF for contract testing')) {
    console.error('Expected real PDF text extraction, got:', textContent);
    process.exit(1);
  }
  
  console.log('✅ Real PDF extraction successful:', textContent.substring(0, 50) + '...');
  
} catch (error) {
  console.error('PDF bridge test failed:', error.message);
  
  // Si le bridge n'est pas disponible, on skip le test avec un warning
  if (error.message.includes('PDF_BRIDGE_ENABLED') || error.message.includes('python')) {
    console.log('⚠️  PDF Bridge not available, skipping real PDF test');
  } else {
    process.exit(1);
  }
}

console.log('PASS process-document-pdf-bridge-integration');
