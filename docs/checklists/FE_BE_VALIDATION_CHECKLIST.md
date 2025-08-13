# FE↔BE Validation Checklist (Smoke & Parity)

Use this checklist after mapping Supabase secrets to the Orchestrator.

**Chat (RAG)**
- Invoke `send-chat-message` with `{ session_id, message, user_id }`.
- Orchestrator `/webhook/chat` returns 200 `{ success: true, data.output[0].text }`.
- DB: message appended to `n8n_chat_histories` (user then assistant).
- FE Realtime: receives INSERT for `session_id` and renders response with citations.
- Logs: RAG_START/RAG_COMPLETE with match_documents_ms and llm_generate_ms.

**Process Document (PDF/Text)**
- Edge `process-document` sends `{ sourceId, filePath, sourceType }` → Orchestrator `/webhook/process-document` (202).
- Callback to `process-document-callback` with `{ source_id, status }`.
- DB: `sources.processing_status` transitions generating → completed/failed.
- Embeddings: dims match (e.g., 768); metadata contains notebook_id, source_id, loc.lines.
- Logs: EXTRACT/EMBED/UPSERT timings present.

**Additional Sources**
- Type `copied-text`: Edge sends content; Orchestrator stores `.txt`, indexes, returns success.
- Type `multiple-websites`: Edge sends URLs + sourceIds; Orchestrator fetches, stores `.txt`, indexes.
- DB: `sources` entries updated, chunks linked with metadata.

**Generate Notebook Content**
- Edge `generate-notebook-content` (returns 202-style success) → background job updates notebook fields.
- DB: notebook title/description updated.
- Idempotence: repeated calls with same `Idempotency-Key` return cached response.

**Generate Audio**
- Edge `generate-audio-overview` → Orchestrator `/webhook/generate-audio` (generating → callback success/failed).
- DB: `notebooks.audio_overview_url` + `audio_url_expires_at` set on success.
- FE: audio player plays returned URL.

**Readiness/Santé**
- `/health` → { status: 'ok' }.
- `/ready` → 200 when DB, Ollama models present, GPU_OK (if `GPU_ONLY=1`).

**Security**
- All webhooks require `Authorization` (Edge only); FE never sends it.
- Logs redact Authorization headers.

**Redis Communication**
- Heartbeats: `AGENT_ONLINE` on boot, `*_ALIVE` every ~600s ±30s, `AGENT_OFFLINE` on shutdown.
- Claims: publier `STATUS_UPDATE` sur `agents:pair:<team>` avant tout commit dans `claims/` (inclure lien PR/évidence).
- Audits: `AUDIT_REQUEST` (impl→audit) puis `AUDIT_VERDICT` (audit→impl) avant tout commit dans `audit/`.
- Streams: `agents:global`, `agents:orchestrator`, `agents:pair:<team>` (ex: `agents:pair:team03`).

**Acceptance (Parity)**
- Payloads, statuses, DB side-effects match original reference.
- Evidence collected (logs snippets, DB snapshots, FE screenshots where relevant).

**Référence Continue (Obligatoire)**
- Citer les fichiers correspondants sous `docs/clone/...` pour chaque scénario testé
- Joindre les liens/chemins dans la PR (section "Source originale")
- Lier toute adaptation à `docs/DECISIONS.md`

