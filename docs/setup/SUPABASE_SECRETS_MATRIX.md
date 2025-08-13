# Supabase Secrets → Orchestrator Endpoints (Template)

Use this matrix to configure Supabase Edge Functions to call the local Orchestrator, replacing n8n. Keep the same Authorization header. Do not expose secrets in the frontend.

**Core Secrets (local target)**
- NOTEBOOK_CHAT_URL: http://127.0.0.1:8000/webhook/chat
- DOCUMENT_PROCESSING_WEBHOOK_URL: http://127.0.0.1:8000/webhook/process-document
- ADDITIONAL_SOURCES_WEBHOOK_URL: http://127.0.0.1:8000/webhook/process-additional-sources
- NOTEBOOK_GENERATION_URL: http://127.0.0.1:8000/webhook/generate-notebook-content
- AUDIO_GENERATION_WEBHOOK_URL: http://127.0.0.1:8000/webhook/generate-audio
- NOTEBOOK_GENERATION_AUTH: Bearer test (must match backend env)

**Backend Env References (local)**
- ORCHESTRATOR_BASE_URL: http://127.0.0.1:8000
- Backend `PORT`: 8000 (orchestrator)
- NOTEBOOK_GENERATION_AUTH: Bearer test
- POSTGRES_DSN: postgres://postgres:postgres@127.0.0.1:54322/postgres
- OLLAMA_BASE_URL: http://127.0.0.1:11434
- REDIS_URL: redis://127.0.0.1:6379
- SUPABASE_URL: http://127.0.0.1:54321
- SUPABASE_SERVICE_ROLE_KEY: <local service key> (server-side only)
- DB/Storage model: unchanged from original, local-only

**Callbacks (from Orchestrator back to Supabase)**
- process-document callback: <SUPABASE_URL>/functions/v1/process-document-callback
- audio-generation callback: <SUPABASE_URL>/functions/v1/audio-generation-callback

Optional (if implemented):
- refresh-audio-url: http://127.0.0.1:8000/webhook/refresh-audio-url

**Security Notes**
- Frontend never sends `Authorization`; Edge Functions add it.
- Orchestrator remains internal; only Edge Functions call it.

**Verification**
- Edge Function `send-chat-message` reaches `/webhook/chat` and returns `{ success: true, data: { output: [...] } }`.
- Edge Function `process-document` returns 200 with initiation and later triggers callback.
