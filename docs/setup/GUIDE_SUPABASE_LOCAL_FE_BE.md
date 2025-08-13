# Guide — Intégration Supabase Local + FE ↔ BE (Orchestrator)

Ce guide décrit, pas à pas, la mise en place locale du backend (orchestrator) et du frontend cloné via Supabase Edge Functions, avec mapping des secrets et validations rapides.

## 0) Prérequis
- Docker Desktop (ou équivalent) et Docker Compose
- Node.js LTS + npm
- Redis (docker ou binaire local)
- GPU disponible si `GPU_ONLY=1` (recommandé pour parité stricte)
- Supabase local (via Supabase CLI) ou stack équivalente exposant:
  - `SUPABASE_URL` (ex: `http://127.0.0.1:54321`)
  - Postgres local (ex: `127.0.0.1:54322`)

Références de valeurs: voir `docs/setup/ENVIRONMENT_VALUES.md` et `docs/frontend/pre_requis_FE_BE_CODEX.MD`.

## 1) Backend Orchestrator — ENV et démarrage
1. Dupliquer `.env.example` → `.env` à la racine backend, puis renseigner:
   - `PORT=8000`
   - `NOTEBOOK_GENERATION_AUTH=Bearer test`
   - `POSTGRES_DSN=postgres://postgres:postgres@127.0.0.1:54322/postgres`
   - `OLLAMA_BASE_URL=http://127.0.0.1:11434`
   - `OLLAMA_LLM_MODEL=qwen2.5`
   - `OLLAMA_EMBED_MODEL=nomic-embed-text`
   - `REDIS_URL=redis://127.0.0.1:6379`
   - (optionnel) `GPU_ONLY=1`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
2. Lancer les dépendances:
   - Postgres (via `infra/docker-compose.yml`) et Ollama
   - Redis (ex: `docker run -d --name redis -p 6379:6379 redis:7-alpine`)
3. Démarrer l’orchestrator (mode dev ou build+start).
4. Vérifier santé/readiness:
   - `GET http://127.0.0.1:8000/health` → `{ status: 'ok' }`
   - `GET http://127.0.0.1:8000/ready` → 200 (sinon 503 si GPU ou modèles manquants)

Checklist complète: `docs/checklists/ORCHESTRATOR_READINESS_CHECKLIST.md`.

## 2) Modèles Ollama (GPU)
- Installer les modèles localement (chemin recommandé Windows: `D:\\modeles_llm\\`).
- Vérifier que le LLM (`qwen2.5`) et l’embeddings (`nomic-embed-text`) sont disponibles.
- Avec `GPU_ONLY=1`, `/ready` doit échouer (503) si GPU indisponible.

## 3) Supabase Local — Migrations et Edge Functions
1. Lancer la stack Supabase locale (CLI) exposant:
   - `SUPABASE_URL=http://127.0.0.1:54321`
   - Postgres local `127.0.0.1:54322`
2. Importer/appliquer les migrations présentes dans le frontend cloné:
   - Dossier: `docs/clone/insights-lm-public-main/insights-lm-public-main/supabase/migrations`
3. Déployer/activer les Edge Functions (depuis le dossier du FE cloné) pour:
   - `send-chat-message`, `process-document`, `process-additional-sources`,
     `generate-notebook-content`, `generate-audio-overview`, `audio-generation-callback`,
     `process-document-callback` (et autres nécessaires selon le clone)

## 4) Mapping des Secrets Supabase → Orchestrator
Renseigner les secrets Supabase (côté Edge/serveur uniquement):
- `NOTEBOOK_CHAT_URL`: `http://127.0.0.1:8000/webhook/chat`
- `DOCUMENT_PROCESSING_WEBHOOK_URL`: `http://127.0.0.1:8000/webhook/process-document`
- `ADDITIONAL_SOURCES_WEBHOOK_URL`: `http://127.0.0.1:8000/webhook/process-additional-sources`
- `NOTEBOOK_GENERATION_URL`: `http://127.0.0.1:8000/webhook/generate-notebook-content`
- `AUDIO_GENERATION_WEBHOOK_URL`: `http://127.0.0.1:8000/webhook/generate-audio`
- `NOTEBOOK_GENERATION_AUTH`: `Bearer test`

Callbacks attendus (depuis l’orchestrator vers Supabase):
- `process-document-callback`: `<SUPABASE_URL>/functions/v1/process-document-callback`
- `audio-generation-callback`: `<SUPABASE_URL>/functions/v1/audio-generation-callback`

Matrice complète: `docs/setup/SUPABASE_SECRETS_MATRIX.md`.

## 5) Frontend cloné — Configuration et démarrage
1. Dossier FE: `docs/clone/insights-lm-public-main/insights-lm-public-main`
2. Copier `.env.example` → `.env` et renseigner au minimum:
   - `VITE_SUPABASE_URL=http://127.0.0.1:54321`
   - `VITE_SUPABASE_ANON_KEY=<anon key locale>`
3. Installer et démarrer:
   - `npm install`
   - `npm run dev`
4. L’UI doit interagir via Supabase (auth, Realtime) et appeler les Edge Functions.

## 6) Bus Redis — Communication inter‑agents
- Streams: `agents:global`, `agents:orchestrator`, `agents:pair:team03`
- Heartbeats obligatoires:
  - Boot: `AGENT_ONLINE` sur pair + global
  - Périodique: `*_ALIVE` toutes ~600s ±30s
  - Shutdown: `AGENT_OFFLINE`
- Scripts utiles: `orchestrator/scripts/agent-heartbeat.mjs`, `redis-send-status-update.cjs`

Référence: `docs/communication/INTER_AGENT_COMMUNICATION_REDIS_STREAMS.md`

## 7) Validations FE ↔ BE (smoke tests)
- Chat: `send-chat-message` → réponse UI + insertion Realtime dans `n8n_chat_histories`.
- Ingestion: `process-document` (202) → callback → statut `sources`.
- Sources additionnelles: `copied-text` et `multiple-websites` → `.txt` + indexation.
- Audio: `generate-audio-overview` → callback → URL lisible.

Checklist détaillée: `docs/checklists/FE_BE_VALIDATION_CHECKLIST.md`.

## 8) Observabilité & Sécurité
- `/ready` doit valider DB/modèles/GPU.
- Logs JSON avec `correlation_id`; authorization redacted.
- Idempotence: `Idempotency-Key` supportée sur ingestion.
- FE ne porte aucun secret; `Authorization` injecté uniquement par Edge Functions.

## 9) Dépannage rapide
- `/ready` = 503: vérifier GPU, modèles Ollama, DSN Postgres.
- Erreurs 401 webhooks: `NOTEBOOK_GENERATION_AUTH` manquant/mauvais côté Edge.
- Pas de messages chat: vérifier Realtime Supabase et table `n8n_chat_histories`.
- Bus silencieux: vérifier `REDIS_URL` et scripts heartbeats.

## 10) Références
- Env: `docs/setup/ENVIRONMENT_VALUES.md`
- Secrets: `docs/setup/SUPABASE_SECRETS_MATRIX.md`
- Orchestrator readiness: `docs/checklists/ORCHESTRATOR_READINESS_CHECKLIST.md`
- FE↔BE validation: `docs/checklists/FE_BE_VALIDATION_CHECKLIST.md`
- PRD Frontend: `docs/FRONTEND_PRD.md`
