# Orchestrator Implementation Plan — Test‑First (Parity‑Strict)

Scope
- Replace n8n with a local API that exposes the exact webhooks consumed by existing Supabase Edge Functions.
- No new features, params, or flows. Contracts follow `WEBHOOKS_MAPPING.md` and `ANNEXES_PAYLOADS.md`.
- Continuous reference to model repos under `docs/clone/` is mandatory; every handler and payload must be verified against the original files.
- Stack: align with the original repo — Node.js/TypeScript (e.g., Fastify/Express) for the orchestrator service.
- Governance: Implementer/Auditor pairing enforced; SPEC→IMPL→TEST→AUDIT per endpoint using Task Master. No work starts without an associated task ID.

Deliverables
- Backend service (orchestrator, Node.js/TypeScript) with routes:
  - POST `/webhook/chat`
  - POST `/webhook/process-document`
  - POST `/webhook/process-additional-sources`
  - POST `/webhook/generate-notebook-content` (returns 202)
  - POST `/webhook/generate-audio`
- Database requirement: strictly local PostgreSQL (with pgvector). If Supabase is used, it must be the local deployment pointing to this local PostgreSQL.
- Environment parity: uses the same env names as original (`*_WEBHOOK_URL` target the orchestrator); orchestrator reads `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` when present (local-only), or native PostgreSQL DSN, and local service URLs (Ollama/Whisper/Coqui).
- No frontend code changes. Edge Functions remain unchanged; only `*_WEBHOOK_URL` point to the orchestrator.
 - Weekly parity reviews: execute contract tests against the original expectations; log outcomes in `docs/PARITY_REVIEW_CHECKLIST.md` and `docs/DECISIONS.md` with Task IDs.

Test‑First Strategy
- Workflow discipline: write SPEC (contract) tasks first; then implement handlers; then add integration tests; finish with audit tasks ensuring parity on HTTP shape and DB side‑effects.
- Source of truth: Edge Functions’ behavior and payloads in `WEBHOOKS_MAPPING.md` + `ANNEXES_PAYLOADS.md`.
 - Cross‑check with original files in `docs/clone/...` (link paths in test descriptions), to ensure parity.
- Levels:
  1) Contract tests (HTTP): verify each endpoint accepts the documented payload and responds with the expected HTTP code/shape.
  2) Integration tests (mocked deps): mock Supabase client, Ollama, Whisper, Coqui, and Storage interactions; verify side‑effects (calls + payloads) and DB writes.
  3) E2E smoke (optional): run Supabase Edge Functions locally + orchestrator; invoke via `supabase.functions.invoke(...)` and assert success paths.
- Test data: reuse IDs and shapes from `ANNEXES_PAYLOADS.md`.

Backend Tasks (by endpoint)
1) POST /webhook/chat
- Behavior: read `{ session_id, message, user_id, timestamp }`; fetch context via RPC `match_documents` filtered by `notebook_id=session_id`; call Ollama chat; parse citations; insert two rows into `n8n_chat_histories` (user then assistant); return 200 with `{ success, data }`.
- Tests:
  - Accepts payload; returns 200 with required keys.
  - Calls Supabase RPC with correct filter JSON; calls Ollama once.
  - Inserts two messages into `n8n_chat_histories` with correct JSON shape.
  - Error path: missing Authorization header → 401.

2) POST /webhook/process-document
- Behavior: accept `{ source_id, file_url, file_path, source_type, callback_url }`; download/read content (or read from Storage using `file_url`); extract text (PDF/text/web/audio via Whisper for audio if applicable); generate title/summary (Ollama) as in original; chunk + embed (Ollama `nomic-embed-text`); upsert `documents` (embedding 768, metadata with `notebook_id`, `source_id`, `loc.lines.from/to`); update `sources.processing_status`; POST callback to `callback_url` with `{ source_id, content?, summary?, title?, status }`; return 200 JSON.
- Tests:
  - Accepts payload; returns 200 success.
  - Produces embeddings with dimension 768; upserts rows with expected metadata keys.
  - Sends callback to provided URL with required fields.
  - Downstream failure → update `sources.processing_status='failed'`; return 500 consistent with Edge handling.

3) POST /webhook/process-additional-sources
- Behavior: two modes
  - `multiple-websites`: `{ type, notebookId, urls[], sourceIds[], timestamp }`; fetch/process html→text; store `.txt` in bucket; update corresponding `sources` (title/summary); index as in process-document.
  - `copied-text`: `{ type, notebookId, title, content, sourceId, timestamp }`; store text; update `sources`; index.
- Return 200 with `{ success }`.
- Tests:
  - Accept both payload variants; call indexer path; return 200.
  - Writes to Storage and updates `sources` as expected.

4) POST /webhook/generate-notebook-content
- Behavior: `{ sourceType, notebookId, filePath? | content? }`; set `notebooks.generation_status='generating'`; fire background job; respond 202; background job performs the original generation flow and finalizes statuses/fields exactly as original.
- Tests:
  - Returns 202 immediately; sets status to generating.
  - Background path updates expected notebook fields (integration test with mocked worker invocation).

5) POST /webhook/generate-audio
- Behavior: `{ notebook_id, callback_url }`; set `audio_overview_generation_status='generating'`; run TTS (Coqui), upload to `audio` bucket; set `audio_overview_url` + `audio_url_expires_at`; POST callback with `{ notebook_id, audio_url, status: 'success'|'failed' }`; return 200 JSON.
- Tests:
  - Returns 200 and sets generating status.
  - Uploads audio and updates notebook fields; sends callback.

Cross‑Cutting
- Auth: require header `Authorization: ${NOTEBOOK_GENERATION_AUTH}` on all routes (401 if missing/invalid).
- Data layer: all reads/writes go to local PostgreSQL (pgvector). When using Supabase SDK/URL, it must point to the local deployment only.
- Config: read envs used by Edge Functions and Supabase locally; no renaming.
- Logging: basic per‑step logs (info/error) consistent with original components; no custom schema.
 - Governance: SPEC→IMPL→TEST→AUDIT captured in Task Master for each route; weekly parity review gate before marking epics done.

Test Plan (execution order)
1) Contract tests (all endpoints) with canned payloads from `ANNEXES_PAYLOADS.md`.
2) Integration tests per endpoint with mocked external services:
   - Supabase client mock: tables (`sources`, `documents`, `n8n_chat_histories`, `notebooks`), RPC `match_documents`.
   - Ollama mock: chat + embeddings; enforce embedding size 768.
   - Whisper/Coqui mocks: return deterministic text/audio URLs.
   - HTTP callback capture server for verifying callback payloads.
3) E2E smoke (optional): spin up local Supabase Edge Functions and point `*_WEBHOOK_URL` to the orchestrator; invoke `supabase.functions.invoke(...)` flows for chat and process-document; observe Realtime updates and table mutations.

Separation FE/BE
- Frontend: no code changes; ensure `.env` maps `*_WEBHOOK_URL` to orchestrator. Use existing hooks (`useChatMessages`, `useDocumentProcessing`) to drive E2E tests.
- Backend: implement endpoints and internal pipeline in Node.js/TypeScript; add targetable envs for dependency URLs (`OLLAMA_BASE_URL`, `WHISPER_ASR_URL`, `COQUI_TTS_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, or native `POSTGRES_DSN`). Do not change Edge Function code.
 - Governance: each BE task includes a corresponding AUDIT task owned by the Auditor; FE coordinates mocks and end‑to‑end checks during parity sessions.

Milestones
- M1: Contract tests written for all endpoints (red).
- M2: Minimal handlers returning expected HTTP codes/shape (green, with mocks only).
- M3: Integration paths per endpoint (embedding/chunking/indexing/chat) with mocks (green).
- M4: E2E smoke with Supabase Edge Functions (green).

Notes
- Keep parity with original behaviors (status codes, payload shapes). Do not add idempotency or extra headers.
- Use `ANNEXES_PAYLOADS.md` as the canonical fixtures for tests.
