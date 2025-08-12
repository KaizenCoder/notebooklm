import { buildApp } from '../../src/app.js';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  LOG_SAMPLE_PCT: '0'
} as any;

const captured: any[] = [];
const fakeLogger = { info: (o:any, m?:string) => { captured.push({ o, m }); }, error: (_o:any,_m?:string)=>{} } as any;

const app = buildApp({ env } as any);
(app as any).log = fakeLogger;

const res = await app.inject({ method: 'GET', url: '/health' });
if (res.statusCode !== 200) { console.error('expected 200'); process.exit(1); }

// LOG_SAMPLE_PCT=0 => pas de log "request complete" pour 2xx
const hasRequestComplete = captured.some((e) => e?.m === 'request complete');
if (hasRequestComplete) { console.error('sampling failed: request complete was logged with 0%'); process.exit(1); }

console.log('PASS logging-sampling');
