import { buildApp } from '../../src/app.js';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434'
} as any;

// Capture logs by monkey-patching app.log.info
const captured: any[] = [];
const fakeLogger = {
  info: (obj: any, msg?: string) => { captured.push({ obj, msg }); },
  error: (_o: any, _m?: string) => { /* ignore */ }
} as any;

const app = buildApp({ env } as any);
(app as any).log = fakeLogger;

// Make a webhook call with Authorization header and ensure logs redact it
const res = await app.inject({ method: 'POST', url: '/webhook/chat', headers: { Authorization: 'Bearer test' }, payload: { messages: [{ role: 'user', content: 'hi' }] } });
if (res.statusCode !== 200) { console.error('expected 200 chat'); process.exit(1); }

const redactedLog = captured.find(e => e?.obj?.headers);
if (!redactedLog) { console.error('expected a structured log with headers'); process.exit(1); }
const headers = redactedLog.obj.headers;
if (headers?.authorization !== '[REDACTED]' && headers?.Authorization !== '[REDACTED]') {
  console.error('expected authorization header to be redacted', headers);
  process.exit(1);
}

console.log('PASS logging-redaction');
