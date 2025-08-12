// Send a structured status update to coordinator across multiple streams
// Usage:
//   node scripts/redis-send-status-update.cjs [STREAMS_CSV]
// Default STREAMS_CSV: "agents:global,agents:pair:team03"

const { createClient } = require('redis');
const { randomUUID } = require('crypto');

(async () => {
  const STREAMS_CSV = process.argv[2] || process.env.STATUS_STREAMS || 'agents:global,agents:pair:team03';
  const STREAMS = STREAMS_CSV.split(',').map(s => s.trim()).filter(Boolean);

  const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  const client = createClient({ url });
  client.on('error', (e) => console.error('Redis error:', e.message));
  await client.connect();

  const now = new Date().toISOString();
  const correlation = randomUUID();

  const missions = [
    'tm-18 GPU-only enforcement (validation CPU reject sur RAG/ingestion)',
    'tm-8 Adapters (ENV mapping + mocks Whisper/Storage)',
    'tm-6 generate-audio (callbacks success/failed + audio_url)',
    'tm-2 process-document (parité OpenAPI + callbacks; E2E)',
    'tm-9 chunking + embeddings (dims 768, overlap, loc.lines)',
    'tm-14 Health/Ready (ENVs, modèles présents, GPU probe)',
    'tm-10 Logging & errors (redaction, sampling, latences)'
  ].join('; ');

  const travaux = [
    'Heartbeats multi-stream opérationnels (agents:global, agents:pair:team03)',
    'Résilience: 17/17 tests PASS',
    'Adapter résilience Ollama testé (retry/circuit breaker)',
    'Contrat GPU_REQUIRED testé (503 si GPU absent)',
    'Tests idempotence élargis (add sources / generate-audio / concurrency)',
    'Docs d’audit/claim créés et mis à jour (cf. audit/ et claims/)',
    'Task‑Master synchronisé (statuts mis à jour)',
    'Scripts Redis d’émission (heartbeat, verdict, status update) ajoutés'
  ].join('; ');

  const details = `Missions: ${missions} | Travaux récents: ${travaux}`;

  const fields = [
    'from_agent','auditor_team03',
    'team','team03',
    'role','audit',
    'to','coordinator',
    'topic','STATUS_UPDATE',
    'event','AUDIT_PROGRESS',
    'status','INFO',
    'severity','INFO',
    'timestamp', now,
    'correlation_id', correlation,
    'task_id','tm-03',
    'tm_ids','["tm-2","tm-6","tm-8","tm-9","tm-10","tm-14","tm-18"]',
    'links','["/audit","/docs","/orchestrator/test"]',
    'details', details
  ];

  for (const stream of STREAMS) {
    const id = await client.sendCommand(['XADD', stream, '*', ...fields]);
    console.log('STATUS_SENT', stream, id);
  }

  await client.quit();
})().catch(async (e) => {
  console.error('Failure sending status update:', e);
  process.exit(1);
});
