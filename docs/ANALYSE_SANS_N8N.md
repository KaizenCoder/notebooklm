<!-- Déplacé sous docs/ -->
# InsightsLM local — Analyse et plan sans n8n

Note de portée (mode Clone): on reprend l’existant tel quel. Aucun ajout fonctionnel ni réécriture de logique. Seul n8n est écarté et remplacé conceptuellement par un service API local (non implémenté à ce stade). Les Edge Functions, Supabase (DB/Storage), Ollama/Whisper/Coqui et la structure restent inchangés.

## Contexte et objectif
- Objectif: reproduire le dépôt « insights-lm-local-package » sans utiliser n8n, en conservant le comportement fonctionnel et les garanties de confidentialité (local/offline).
- Approche: remplacer les webhooks et orchestrations n8n par un service API local (FastAPI/Express) tout en réutilisant Supabase (DB/Storage/Edge), Ollama, Whisper ASR, Coqui TTS et le schéma existant.

## Architecture d’origine (résumé)
- Frontend: React/Vite/TypeScript (inchangé).
- Orchestration backend: n8n (workflows JSON + webhooks protégés par header auth).
- Base & stockage: Supabase (Postgres avec pgvector, buckets Storage, Edge Functions Deno, RLS).
- IA locales: Ollama (LLM `qwen3:8b-q4_K_M`, embeddings `nomic-embed-text`), Whisper ASR, Coqui TTS.
- Table vectorielle: `documents(embedding vector(768), metadata jsonb)` + RPC `match_documents(query_embedding, match_count, filter)`.

## Schéma & données (extraits utiles)
- Tables clés: `notebooks`, `sources`, `notes`, `n8n_chat_histories`, `documents`.
- Rôles & RLS: politiques par utilisateur via `profiles` et fonctions `is_notebook_owner*`.
- Stockage: buckets `sources` (privé), `audio` (privé), `public-images` (public).
- RPC de similarité: `match_documents` (pgvector cosine), filtrable par `metadata` (ex: `{"notebook_id": <uuid>}`).

## Workflows n8n identifiés → équivalents API (remplacement conceptuel, sans implémentation)

1) Chat (`n8n/InsightsLM___Chat.json`)
- Entrée: webhook POST (auth header) avec `{ session_id, message, user_id }`.
- Étapes: charger l’historique (`n8n_chat_histories`), LLM pour formuler une requête de recherche, recherche vectorielle (Supabase `documents` avec filtre `metadata.notebook_id`), LLM RAG pour la réponse avec citations, transformation du format de sortie et sauvegarde des messages.
- Équivalent API: `POST /webhook/chat` implémentant les mêmes étapes.

2) Upsert vers le vector store (`n8n/InsightsLM___Upsert_to_Vector_Store.json`)
- Entrée: webhook POST (auth header) avec `{ source_id, file_path, source_type }` ou déclenché par autre workflow avec `{ notebook_id, extracted_text, source_id }`.
- Étapes: extraction texte (ou réception directe), génération titre/résumé (LLM), mise à jour `sources`, découpage (overlap 200), embeddings (Ollama), insertion `documents` avec `metadata` `{notebook_id, source_id, loc.lines}`, callback Supabase `process-document-callback`.
- Équivalent API: `POST /webhook/process-document` pour extraction+indexation et callback.

3) Extraction de texte (`n8n/InsightsLM___Extract_Text.json`)
- Entrée: chemin Storage signé via Supabase; download; switch selon `content-type`:
  - PDF → extraction texte.
  - Audio → Whisper ASR (HTTP multipart) → transcription.
  - Texte → pass-through.
- Équivalent API: sous-routine de `/webhook/process-document` (mêmes branches).

4) Sources additionnelles (`n8n/InsightsLM___Process_Additional_Sources.json`)
- Modes: `copied-text` (titre+contenu texte) et `multiple-websites` (liste d’URLs → fetch HTML → conversion Markdown, extraction titre HTML).
- Étapes: upload `.txt` dans bucket `sources/<notebook>/<source>.txt`, update `sources`, puis upsert vectoriel.
- Équivalent API: `POST /webhook/process-additional-sources` + réutilisation de la logique d’indexation.

5) Podcast (présent dans le dépôt: `InsightsLM___Podcast_Generation.json`)
- Génération audio locale (Coqui TTS) + gestion URL d’accès + mise à jour `notebooks`.
- Équivalent API: `POST /webhook/generate-audio`.

## Variables d’environnement clefs (origine → cible)
- `NOTEBOOK_CHAT_URL` → `http://api:PORT/webhook/chat`.
- `DOCUMENT_PROCESSING_WEBHOOK_URL` → `http://api:PORT/webhook/process-document`.
- `ADDITIONAL_SOURCES_WEBHOOK_URL` → `http://api:PORT/webhook/process-additional-sources`.
- `AUDIO_GENERATION_WEBHOOK_URL` → `http://api:PORT/webhook/generate-audio`.
- `NOTEBOOK_GENERATION_AUTH` → header d’auth commun Edge→API.
- Endpoints internes inchangés: `http://ollama:11434`, `http://whisper-asr:9000`, `http://kong:8000` (Supabase local via Kong proxy).

## Proposition d’architecture sans n8n (à isopérimètre)

Services
- API locale (FastAPI recommandé) exposant les webhooks ci‑dessus.
- Dépendances: client Supabase (service role pour opérations serveur), client HTTP vers Ollama/Whisper/Coqui, accès Storage via Kong.
- Jobs longs: d’abord synchrone/in‑process; option d’évoluer vers une file (RQ/Celery) si besoin.

Endpoints proposés (interfaces de remplacement de n8n — à brancher ultérieurement)
- `POST /webhook/process-document`
  - Payload: `{ source_id, file_path, source_type, callback_url }` ou `{ notebook_id, extracted_text, source_id }`.
  - Actions: extraction → (titre, résumé) → update `sources` → chunking/embeddings → insert `documents` → callback Supabase (success/failed).

- `POST /webhook/process-additional-sources`
  - Modes: `copied-text`, `multiple-websites`.
  - Actions: fetch/convert si nécessaire → upload `.txt` dans bucket → update `sources` → indexation (reuse).

- `POST /webhook/chat`
  - Payload: `{ session_id, message, user_id }`.
  - Actions: récupérer historique, générer requête de recherche (LLM), calculer embedding requête, appeler `match_documents` avec filtre `{"notebook_id": session_id}`, LLM RAG avec citations, construire `citations` à partir de `metadata` et sauvegarder les messages.

- `POST /webhook/generate-audio`
  - Payload minimal: `{ notebook_id, text }`.
  - Actions: synthèse Coqui → upload bucket `audio` → mise à jour `notebooks`.

Flux détaillés (principaux)
- Extraction/Indexation:
  1) Si `file_path`: générer URL signée Storage, télécharger; sinon utiliser `extracted_text` fourni.
  2) Détecter type: PDF/Audio/Texte. PDF→PyMuPDF/pdfminer; Audio→Whisper; Texte→direct.
  3) Générer titre/résumé via Ollama; mettre à jour `sources`.
  4) Chunking (taille configurée, overlap ~200) + numérotation/`loc.lines`.
  5) Embeddings via `nomic-embed-text`; insertion dans `documents` avec `metadata` `{notebook_id, source_id, loc.lines}`.
  6) Callback Supabase (Edge) pour statut `completed` ou `failed`.

- Chat RAG avec citations:
  1) Charger `n8n_chat_histories(session_id)` pour contexte.
  2) LLM pour produire `search_query`.
  3) Embedding de la requête; `match_documents(topK, filter: {notebook_id})`.
  4) Préparer contexte (conserver `chunk_id` et métadonnées).
  5) Prompt RAG strict (réponses fondées sur les chunks; format JSON; citations en fin de phrase sous forme `[n]`).
  6) Post‑traitement: transformer `[n]` en tableau `citations` avec `source_id` et `loc.lines.from/to`.
  7) Sauvegarder human/ai dans `n8n_chat_histories`.

## Choix techniques
- Langage API: Python (FastAPI) pour l’écosystème parsing et simplicité Postgres/pgvector.
- Embeddings/LLM: Ollama local (offline). Modèles par défaut comme dans le dépôt.
- Stockage: Supabase Storage via Kong (auth service role sur le serveur uniquement).
- Recherche: RPC `match_documents` (pgvector) pour cohérence avec le schéma fourni.
- Auth: header partagé `NOTEBOOK_GENERATION_AUTH` entre Edge et API.

## Impacts Docker & ENV (sans implémentation)
- Remplacer le service `n8n` par `api` dans `docker-compose` (ports, réseaux, dépendances vers `ollama`, `kong`, `whisper-asr`, `coqui-tts`).
- Mettre à jour `.env`: rediriger `*_WEBHOOK_URL` vers `http://api:PORT/...` et conserver les clés Supabase/Ollama/Whisper.
- L’API n’est pas encore implémentée: ces variables et le service `api` sont des placeholders pour permettre le clonage sans n8n.

## Roadmap d’implémentation (sans développement pour l’instant)
1) Scaffold API + clients (Supabase, Ollama) et validation ENV.
2) Implémenter `/webhook/process-document` (extraction → indexation → callback).
3) Implémenter `/webhook/chat` (historique → retrieve → RAG + citations → persistance).
4) Implémenter `/webhook/process-additional-sources` (copied-text/websites).
5) Implémenter `/webhook/generate-audio` (Coqui + update).
6) Intégration Docker & tests locaux.

Statut actuel: documentation et configuration prêtes; pas d’implémentation.

## Risques & garde‑fous
- Performance embeddings/LLM: prévoir batchs et timeouts; journaliser par étape.
- Cohérence citations: toujours mapper `[n]` aux `chunk_id` réels utilisés pour la génération.
- Sécurité: limiter l’usage des clés service role au backend; protéger les webhooks par header auth.
- Compat: conserver le format de sortie attendu par le frontend (JSON des réponses + historisation identique).

## Prochaines étapes
- Confirmer la stack (Python vs Node) et je génère le squelette API avec endpoints, stubs d’extraction/embeddings, et exemples d’appels Supabase/Ollama.
