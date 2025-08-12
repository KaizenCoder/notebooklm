import { buildApp } from '../../src/app.js';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test'
} as any;

const captured: any[] = [];
const fakeLogger = { info: (o:any, m?:string) => { captured.push({ o, m }); }, error: (_o:any,_m?:string)=>{} } as any;

const app = buildApp({ env } as any);
(app as any).log = fakeLogger;

const res = await app.inject({ method: 'POST', url: '/webhook/chat', headers: { Authorization: 'Bearer test' }, payload: { message: 'hi' } });
if (res.statusCode !== 200) { console.error('expected 200'); process.exit(1); }

const redactionEvents = captured.filter((e) => e?.o && e?.m === 'request complete');
if (!redactionEvents.length) { console.error('no request complete logs captured'); process.exit(1); }

for (const ev of redactionEvents) {
  const headers = ev.o?.headers ?? {};
  if ('authorization' in headers && headers.authorization !== '[REDACTED]') {
    console.error('authorization not redacted');
    process.exit(1);
  }
  if ('Authorization' in headers && headers.Authorization !== '[REDACTED]') {
    console.error('Authorization not redacted');
    process.exit(1);
  }
}

console.log('PASS logging-redaction');
