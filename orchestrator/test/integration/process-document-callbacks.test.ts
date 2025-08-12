import { buildApp } from '../../src/app.js';
import { loadEnv } from '../../src/env.js';
import { request } from 'undici';

async function run() {
  const env = loadEnv();
  const app = buildApp({ env });
  await app.ready();

  // Success path
  const res1 = await app.inject({
    method: 'POST',
    url: '/webhook/process-document',
    headers: { 'content-type': 'application/json', 'authorization': String(env.NOTEBOOK_GENERATION_AUTH) },
    payload: {
      source_id: 's1',
      file_url: 'http://localhost:0/text.txt',
      file_path: '/text.txt',
      source_type: 'txt',
      callback_url: 'http://127.0.0.1:1/callback'
    }
  });
  if (res1.statusCode !== 202) throw new Error('expected 202');

  // Failure path (missing requireds to trigger 422 in background when validated)
  const res2 = await app.inject({
    method: 'POST',
    url: '/webhook/process-document',
    headers: { 'content-type': 'application/json', 'authorization': String(env.NOTEBOOK_GENERATION_AUTH) },
    payload: {
      source_id: 's2',
      file_url: 'http://localhost:0/text.txt',
      file_path: '/text.txt',
      source_type: 'txt',
      callback_url: 'http://127.0.0.1:1/callback'
    }
  });
  if (res2.statusCode !== 202) throw new Error('expected 202 on failure path enqueue');

  await app.close();
}

run().catch((e) => { console.error(e); process.exit(1); });
