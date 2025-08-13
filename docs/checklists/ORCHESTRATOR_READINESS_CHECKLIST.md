# Orchestrator Readiness Checklist (Local)

Use this before integrating the frontend.

**Environment**
- `.env` cloned from `.env.example` and filled.
- `PORT=8000`, `NOTEBOOK_GENERATION_AUTH` set.
- `POSTGRES_DSN`, `OLLAMA_BASE_URL`, optional `REDIS_URL` present.

**Health & Ready**
- `GET /health` → `{ status: 'ok' }`.
- `GET /ready` → 200 only when:
  - DB ping OK.
  - Ollama reachable; required models present.
  - GPU probe OK if `GPU_ONLY=1`.
  - Optional adapters (Whisper/Coqui) respond or are disabled.

**GPU & Models**
- `GPU_ONLY=1` if enforced; no CPU fallback.
- `OLLAMA_LLM_MODEL` and `OLLAMA_EMBED_MODEL` set; tags listed; dims match (e.g., 768).

**DB & Storage**
- Schema mirrors original (tables: `notebooks`, `sources`, `n8n_chat_histories`).
- RPC `match_documents` available; storage/buckets aligned.

**Security**
- Webhooks reject missing/invalid `Authorization`.
- Logs redact Authorization headers.

**Idempotence**
- `Idempotency-Key` supported on ingestion endpoints; repeat returns cached response.

**Observability**
- Logs JSON include `correlation_id` for all requests.
- Step logs present (RAG, EXTRACT/EMBED/UPSERT, TTS/UPLOAD/CALLBACK) with latencies.

**Redis Communications (if REDIS_URL set)**
- AGENT_ONLINE sent on boot; ORCHESTRATOR_ALIVE every ~600s ±30s; AGENT_OFFLINE on shutdown.
- STATUS_UPDATE before any claim; AUDIT_REQUEST/VERDICT used for audits.

**Smoke Webhooks**
- `/webhook/chat`: returns 200; persists messages.
- `/webhook/process-document`: returns 202; background job + callback work.
- `/webhook/process-additional-sources`: copied-text/websites succeed.
- `/webhook/generate-notebook-content`: returns 202; DB updated.
- `/webhook/generate-audio`: generation flow + callback handled.

