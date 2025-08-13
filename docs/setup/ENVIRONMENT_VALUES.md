# Environment Values Summary (Local Clone)

This document centralizes backend env vars, Supabase secrets, Redis streams, models/GPU, and recommended local values to speed up setup and parity checks.

## Backend Orchestrator (Env)
- PORT: HTTP port for orchestrator
  - Default: 8000
  - Example: 8000
- NOTEBOOK_GENERATION_AUTH: shared Authorization header for all webhooks
  - Required: yes
  - Example (local): Bearer test
- POSTGRES_DSN: PostgreSQL DSN (pgvector enabled)
  - Example (local): postgres://postgres:postgres@127.0.0.1:54322/postgres
- OLLAMA_BASE_URL: base URL for Ollama
  - Default: http://ollama:11434
  - Example (local): http://127.0.0.1:11434
- OLLAMA_LLM_MODEL: chat model name
  - Example: qwen2.5
- OLLAMA_EMBED_MODEL: embeddings model name (dims must match original, e.g., 768)
  - Example: nomic-embed-text
- GPU_ONLY: enforce GPU usage (no CPU fallback)
  - Example: 1
- IDEMPOTENCY_TTL_MS: cache window for idempotent operations (ms)
  - Example: 300000
- WHISPER_ASR_URL: Whisper ASR endpoint (optional)
  - Example: http://127.0.0.1:9001
- COQUI_TTS_URL: Coqui TTS endpoint (optional)
  - Example: http://127.0.0.1:9002
- STORAGE_BASE_URL: Storage service base URL (optional)
- NO_MOCKS: set to 1 to disable test mocks (optional)
- REDIS_URL: Redis connection URL (Streams)
  - Example: redis://127.0.0.1:6379
- REDIS_STREAM_HEARTBEAT: legacy default (deprecated)
  - Default: coordination_heartbeat
- REDIS_STREAM_BLOCKERS: legacy default (deprecated)
  - Default: coordination_blockers
- REDIS_STREAM_AUDIT_REQ: legacy default (deprecated)
  - Default: audit_requests
- REDIS_STREAM_AUDIT_VERDICT: legacy default (deprecated)
  - Default: auditeur_compliance
- COMMS_ORCHESTRATOR_EMIT: enable orchestrator bus emits (optional)
- STREAM_GLOBAL: global agents stream
  - Default: agents:global
- STREAM_ORCH_INBOX: orchestrator inbox stream
  - Default: agents:orchestrator
- STREAM_PAIR_PREFIX: pair/team prefix
  - Default: agents:pair:
- COMMS_MODE: multi-stream vs. legacy
  - Default: multi-stream
- COMMS_COMPAT_LEGACY: set to 1 to emit legacy streams in parallel (optional)
- PDF_BRIDGE_ENABLED: enable Python PDF bridge
  - Default: true
- PDF_BRIDGE_TIMEOUT: extraction timeout (seconds)
  - Default: 30
- PDF_BRIDGE_MAX_PAGES: max pages to extract
  - Default: 1000
- PDF_BRIDGE_PYTHON_PATH: custom python path (optional)

## Supabase (Local-Only) — Secrets → Orchestrator Endpoints
- NOTEBOOK_CHAT_URL: http://127.0.0.1:8000/webhook/chat
- DOCUMENT_PROCESSING_WEBHOOK_URL: http://127.0.0.1:8000/webhook/process-document
- ADDITIONAL_SOURCES_WEBHOOK_URL: http://127.0.0.1:8000/webhook/process-additional-sources
- NOTEBOOK_GENERATION_URL: http://127.0.0.1:8000/webhook/generate-notebook-content
- AUDIO_GENERATION_WEBHOOK_URL: http://127.0.0.1:8000/webhook/generate-audio
- NOTEBOOK_GENERATION_AUTH: Bearer test

Supabase environment (server-side only):
- SUPABASE_URL: http://127.0.0.1:54321
- SUPABASE_SERVICE_ROLE_KEY: <local service key>

Callbacks (from Orchestrator → Supabase Edge):
- process-document callback: <SUPABASE_URL>/functions/v1/process-document-callback
- audio-generation callback: <SUPABASE_URL>/functions/v1/audio-generation-callback

## Redis Streams (Inter‑Agent Comms)
- Team (example): team03
- Agents (example): orchestrator, impl_team03, auditor_team03
- Streams:
  - agents:global
  - agents:orchestrator
  - agents:pair:team03

Events & cadence:
- Heartbeats: AGENT_ONLINE (boot), *_ALIVE (~600s ±30s), AGENT_OFFLINE (shutdown)
- Workflow: STATUS_UPDATE (before claim), AUDIT_REQUEST/AUDIT_VERDICT

## Models & GPU
- LLM model: qwen2.5 (or installed equivalent)
- Embeddings model: nomic-embed-text (dims must match original)
- Models install path (Windows example): D:\\modeles_llm\\
- GPU enforcement: set GPU_ONLY=1; /ready must fail (503) if GPU not OK

## Ports & Base URLs
- Orchestrator: http://127.0.0.1:8000
- Ollama: http://127.0.0.1:11434
- Redis: redis://127.0.0.1:6379
- Supabase: http://127.0.0.1:54321
- Postgres: 127.0.0.1:54322 (per DSN example)

## Quick Sanity Checks
- GET /health → { status: 'ok' }
- GET /ready → 200 when DB, models, and GPU (if enforced) are OK
- Webhooks reject if Authorization missing/invalid
- Logs redact Authorization; include x-correlation-id
- Heartbeats visible on agents:pair:<team> and agents:global

## Notes
- Frontend must never send Authorization; only Edge Functions add it.
- Keep DB schema and RPC identical to the original for strict parity.
