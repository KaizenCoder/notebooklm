# Webhooks Mapping — Edge Functions → Orchestrator (Parité stricte)

Note: Cette référence reprend strictement les contrats visibles dans les Edge Functions du package original. Seul le destinataire change (orchestrateur local au lieu de n8n). Les en‑têtes, méthodes, payloads et codes HTTP doivent rester identiques. Données: toutes les lectures/écritures se font vers une base PostgreSQL locale (pgvector); aucun service cloud. Gouvernance: chaque adaptation est suivie par Task‑Master (SPEC→IMPL→TEST→AUDIT) et vérifiée en revue de parité hebdomadaire.

**send-chat-message**
- Env var (Edge): `NOTEBOOK_CHAT_URL`
- Méthode: `POST`
- Endpoint orchestrateur: `/webhook/chat`
- Auth: header `Authorization: ${NOTEBOOK_GENERATION_AUTH}`
- Payload: `{ session_id, message, user_id, timestamp }`
- Réponse: `200 OK` JSON (renvoyée telle quelle au frontend via l’Edge Function)

**process-document**
- Env var (Edge): `DOCUMENT_PROCESSING_WEBHOOK_URL`
- Méthode: `POST`
- Endpoint orchestrateur: `/webhook/process-document`
- Auth: header `Authorization: ${NOTEBOOK_GENERATION_AUTH}`
- Payload: `{ source_id, file_url, file_path, source_type, callback_url }`
- Attendu: extraction → indexation (chunks + embeddings) → upsert `documents` → update `sources` → callback vers `callback_url`

**process-additional-sources**
- Env var (Edge): `ADDITIONAL_SOURCES_WEBHOOK_URL`
- Méthode: `POST`
- Endpoint orchestrateur: `/webhook/process-additional-sources`
- Auth: header `Authorization: ${NOTEBOOK_GENERATION_AUTH}`
- Payload (selon type):
  - `type: 'multiple-websites'`: `{ notebookId, urls, sourceIds, timestamp }`
  - `type: 'copied-text'`: `{ notebookId, title, content, sourceId, timestamp }`
- Attendu: création/màj `sources`, stockage `.txt` si besoin, indexation identique à un document importé

**generate-notebook-content**
- Env var (Edge): `NOTEBOOK_GENERATION_URL`
- Méthode: `POST`
- Endpoint orchestrateur: `/webhook/generate-notebook-content`
- Auth: header `Authorization: ${NOTEBOOK_GENERATION_AUTH}`
- Payload: `{ sourceType, notebookId, filePath? | content? }`
- Réponse: `202 Accepted` (traitement asynchrone; `notebooks.generation_status='generating'` puis complétion)

**generate-audio-overview**
- Env var (Edge): `AUDIO_GENERATION_WEBHOOK_URL`
- Méthode: `POST`
- Endpoint orchestrateur: `/webhook/generate-audio`
- Auth: header `Authorization: ${NOTEBOOK_GENERATION_AUTH}`
- Payload: `{ notebook_id, callback_url }`
- Attendu: génération TTS locale, upload dans bucket `audio`, mise à jour `notebooks`, callback

**Callbacks (appelés par l’orchestrateur)**
- `process-document-callback` (Edge): URL fournie dans `callback_url` (ne pas modifier). Payload conforme à l’original (statut et informations de traitement).
- `audio-generation-callback` (Edge): `${SUPABASE_URL}/functions/v1/audio-generation-callback`
  - Payload minimal: `{ notebook_id, status: 'success'|'failed', audio_url? }`

Remarque: conserver les mêmes entêtes CORS/Content-Type que ceux utilisés par les Edge Functions, et ne pas altérer les structures JSON attendues côté frontend.
