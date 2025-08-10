<!-- Déplacé sous docs/ -->
# InsightsLM Local — Documentation complète du projet (sans n8n)

Important — Mode Clone: on ne réinvente rien. On reprend l’existant à l’identique et on ne fait QU’UN remplacement de n8n par un service API local prévu (non implémenté pour le moment). Toutes les autres briques (Supabase, Edge Functions, Ollama, Whisper, Coqui, schéma SQL) restent identiques.

## 1) Résumé
- But: fournir un assistant de recherche/lecture local et privé (« NotebookLM‑like »), capable de discuter avec vos documents, avec citations vérifiables, transcription audio et génération d’audio.
- Contrainte: reproduire le dépôt « insights-lm-local-package » sans utiliser n8n, en conservant l’UX et les interfaces attendues par le frontend.
- Solution: remplacer n8n par un service API local léger, tout en réutilisant Supabase (DB/Storage/Edge Functions), Ollama (LLM + embeddings), Whisper ASR et Coqui TTS.

## 2) Objectifs fonctionnels
- Importer des sources (PDF, texte, sites web, audio) et indexer leur contenu.
- Discuter avec un cahier (notebook) et obtenir des réponses étayées par des citations.
- Générer un résumé audio/podcast localement.
- Contrôle complet des données: exécution locale, offline‑first.

## 3) Architecture générale
- Frontend: React/Vite/TypeScript (inchangé).
- Backend (remplace n8n): service API local (« API Orchestrator ») exposant des webhooks internes consommés par les Edge Functions Supabase. À ce stade, c’est un placeholder documentaire (pas d’implémentation).
- Base de données: Supabase Postgres + extension pgvector (table `documents`) pour la recherche sémantique.
- Stockage: Supabase Storage (buckets `sources`, `audio`, `public-images`).
- IA locales:
  - Ollama pour LLM (p. ex. `qwen3:8b-q4_K_M`) et embeddings (`nomic-embed-text`).
  - Whisper ASR pour transcription audio.
  - Coqui TTS pour synthèse vocale.

Visuel (texte):
- Frontend ⇄ Supabase (auth, données temps réel)
- Edge Functions Supabase → appellent l’API Orchestrator via webhooks
- API Orchestrator → Ollama / Whisper / Coqui / Supabase (DB + Storage)

## 4) Schéma des données (extraits)
- `notebooks`: cahiers, statut de génération, url audio, etc.
- `sources`: éléments d’un cahier (pdf, texte, site, audio), contenu, résumé, statut de traitement.
- `notes`: notes utilisateur.
- `n8n_chat_histories`: historique de conversation (réutilisé pour compat frontend).
- `documents`: table vectorielle pour les chunks (embedding 768d; `metadata` inclut `notebook_id`, `source_id`, positions `loc.lines`).
- RPC `match_documents(query_embedding, match_count, filter)` pour la similarité (cosine) avec filtre JSON sur `metadata`.

## 5) Composants et responsabilités
- API Orchestrator (nouveau):
  - Expose des webhooks équivalents à n8n.
  - Orchestre: extraction, transformation, embeddings, upsert vectoriel, RAG, citations, callbacks.
  - Persiste l’historique chat et met à jour `sources`/`notebooks`.
- Supabase:
  - Auth, RLS, tables métier, RPC `match_documents`.
  - Storage pour fichiers sources et audio.
  - Edge Functions (inchangées) qui appellent l’API via variables d’environnement.
- Services IA:
  - Ollama: chat et embeddings.
  - Whisper ASR: transcription audio.
  - Coqui TTS: génération audio (podcast/aperçu).

## 6) Flux principaux
- Ingestion d’un document (PDF/Audio/Texte):
  1) Edge Function `process-document` envoie à l’API: `{ source_id, file_path, source_type, callback_url }`.
  2) L’API télécharge depuis Storage (URL signée) ou utilise le texte fourni.
  3) Extraction: PDF→texte; Audio→Whisper; Texte→direct.
  4) L’API génère titre/résumé (LLM) et met à jour `sources`.
  5) Découpage en chunks (overlap ~200), embeddings (Ollama), insertions dans `documents` avec `metadata` complètes.
  6) Callback vers `process-document-callback` avec statut `completed` ou `failed`.

- Sources additionnelles (copied‑text / multiple‑websites):
  1) Edge Function poste à l’API: `{ type, notebookId, sourceId, content|urls[] }`.
  2) `copied-text`: upload `.txt` dans bucket, update `sources`, indexation.
  3) `multiple-websites`: fetch HTML → conversion Markdown + titre → upload + update + indexation.

- Chat (RAG avec citations):
  1) Edge Function `send-chat-message` envoie `{ session_id, message, user_id }`.
  2) L’API charge l’historique chat, génère une requête de recherche (LLM), calcule l’embedding de la requête.
  3) Appelle `match_documents(topK, filter: {"notebook_id": session_id})`.
  4) Construit un contexte avec `chunk_id` et `metadata` (source et lignes).
  5) LLM répond en JSON; post‑traitement pour fabriquer `citations` précises; persistance des messages.

- Génération audio:
  1) Edge Function appelle l’API avec `{ notebook_id, text }`.
  2) L’API synthétise (Coqui), uploade dans bucket `audio` et met à jour `notebooks`.

## 7) API Orchestrator — Design des endpoints
- Auth: toutes les routes Webhook sont protégées par un header `Authorization: ${NOTEBOOK_GENERATION_AUTH}`.
- Statut: spécifications stabilisées, pas d’implémentation à ce stade (remplacement pur de n8n au niveau documentation et variables d’environnement).

- `POST /webhook/process-document`
  - Body (cas Storage): `{ source_id, file_path, source_type, callback_url }`.
  - Body (cas texte déjà fourni): `{ notebook_id, extracted_text, source_id }`.
  - Rôle: extraction/normalisation → titre+résumé → update `sources` → chunking/embeddings → upsert `documents` → callback.
  - Réponse: `{ success: true, message: "Document processing initiated" }`.

- `POST /webhook/process-additional-sources`
  - Body (copied-text): `{ type: "copied-text", notebookId, sourceId, title, content }`.
  - Body (multiple-websites): `{ type: "multiple-websites", notebookId, sourceIds: string[], urls: string[] }` (1‑to‑1 mapping).
  - Rôle: upload `.txt` dans `sources/<notebook>/<source>.txt`, update `sources`, indexation (réutilise la logique ci‑dessus).
  - Réponse: `{ success: true }`.

- `POST /webhook/chat`
  - Body: `{ session_id, message, user_id }`.
  - Rôle: RAG avec citations: historique → requête de recherche → retrieval → génération structuré JSON → citations → persistance.
  - Réponse: `{ success: true, data: { output: [{ text, citations: [...] }], ... } }` (compatible frontend).

- `POST /webhook/generate-audio`
  - Body: `{ notebook_id, text }`.
  - Rôle: TTS local, upload, mise à jour `notebooks`.
  - Réponse: `{ success: true, audio_url }`.

## 8) Variables d’environnement (principales)
- Redirections Webhooks Edge → API Orchestrator:
  - `NOTEBOOK_CHAT_URL = http://api:PORT/webhook/chat`
  - `DOCUMENT_PROCESSING_WEBHOOK_URL = http://api:PORT/webhook/process-document`
  - `ADDITIONAL_SOURCES_WEBHOOK_URL = http://api:PORT/webhook/process-additional-sources`
  - `AUDIO_GENERATION_WEBHOOK_URL = http://api:PORT/webhook/generate-audio`
- Auth:
  - `NOTEBOOK_GENERATION_AUTH` — secret partagé pour le header.
- Services locaux:
  - `OLLAMA_BASE_URL = http://ollama:11434`
  - `WHISPER_ASR_URL = http://whisper-asr:9000`
  - `SUPABASE_URL = http://kong:8000` (ou URL locale Supabase), `SUPABASE_SERVICE_ROLE_KEY` (uniquement côté serveur).

Remarque: si vous clonez l’infra d’origine (repo base `local-ai-packaged`), copiez d’abord son `.env.example` en `.env`, puis ajoutez les variables supplémentaires de ce package. Remplacez simplement les `*_WEBHOOK_URL` qui pointaient vers n8n par les endpoints de l’API Orchestrator (placeholder).

## 8bis) Étapes de clonage (sans n8n, sans implémentation)
- Cloner la base locale:
  - `git clone https://github.com/coleam00/local-ai-packaged.git`
  - `cd local-ai-packaged`
- Cloner ce package dans ce dossier:
  - `git clone https://github.com/theaiautomators/insights-lm-local-package.git`
- Env: copier `.env.example` → `.env` (depuis la base), puis ouvrir `insights-lm-local-package/.env.copy` et coller ses variables en fin de `.env`.
- Docker compose: ouvrir `docker-compose.yml` (base) et `insights-lm-local-package/docker-compose.copy.yml`. Ne pas ajouter n8n. Prévoir un service `api` placeholder (ou commenter la section n8n si présente).
- Supabase: importer `insights-lm-local-package/supabase-migration.sql` (SQL Editor) et copier les dossiers `supabase-functions/*` dans `supabase/volumes/functions/`.
- Edge Functions: garder le code tel quel; leurs URLs webhook (`*_WEBHOOK_URL`) pointeront vers l’API Orchestrator (qui n’est pas encore implémentée).

## 9) Déploiement local (guides haut‑niveau)
- Pré‑requis: Docker Desktop, Supabase local (via le projet de base), Ollama, Whisper ASR et Coqui TTS (containers), Python/Node.
- Étapes:
  1) Démarrer l’infra locale (DB, Storage, Ollama, Whisper, Coqui) via `docker-compose` du projet de base.
  2) Déployer les Edge Functions (fichiers fournis) inchangées.
  3) Configurer les `*_WEBHOOK_URL` pour pointer vers un futur service `api` (placeholder). Ne pas déployer n8n.
  4) Importer le SQL `supabase-migration.sql` si nécessaire (indexes, RPC, RLS, buckets).
  5) Frontend: l’application démarre mais les actions dépendantes des webhooks (ex‑n8n) resteront inactives tant que l’API Orchestrator n’est pas implémentée.

## 10) Détails clés d’implémentation
- Extraction PDF: privilégier PyMuPDF ou pdfminer (gestion du layout et encodage).
- Whisper: requête multipart `audio_file` → `output=txt` pour transcription.
- Chunking: taille et overlap configurables; conserver `loc.lines` (from/to) pour citations.
- Embeddings: `nomic-embed-text` via Ollama; batchs pour performance.
- Recherche: embedding de la requête + `match_documents` avec filtre `{"notebook_id": session_id}`.
- Citations: le LLM produit des références `[n]`; mapper vers les `chunk_id` du lot récupéré et bâtir `citations: [{ chunk_index, chunk_source_id, chunk_lines_from, chunk_lines_to }]`.
- Historique chat: écrire dans `n8n_chat_histories` pour compatibilité (structure JSON identique).

## 11) Sécurité & confidentialité
- Données et modèles restent locaux; pas d’appel cloud.
- Auth simple par header pour les webhooks; restreindre l’API au réseau interne Docker.
- Clés service role: côté serveur uniquement; jamais exposées au frontend.
- RLS Supabase déjà configurée pour les accès côté client via JWT.

## 12) Observabilité & robustesse
- Journalisation par étape (ingestion, embeddings, upsert, retrieval, génération).
- Timeouts et retry (download Storage, requêtes Ollama/Whisper/TTS, insertions DB).
- Callback de fin de traitement pour mises à jour de statut.

## 13) Performances & limites
- Embeddings/LLM locaux: dépendants du matériel (CPU/GPU, VRAM).
- Optimisations: batch embeddings, cache de chunks, topK et seuils de similarité, normalisation texte.
- Alternatives: possibilité de passer à une file de jobs (RQ/Celery) si volume important.

## 14) Roadmap
- v1: API Orchestrator avec les 4 endpoints, pipeline complet, compat frontend.
- v1.1: file de jobs optionnelle, metrics de qualité (couverture citations), tests d’intégration.
- v1.2: UI d’administration (logs, files, stats), support DOCX/HTML avancé.

## 15) FAQ
- Q: Peut‑on rester 100% offline ?
  - R: Oui, tous les modèles et services sont locaux (Docker, Ollama, Whisper, Coqui). 
- Q: Pourquoi conserver Supabase ?
  - R: Le frontend y est déjà intégré (auth, RLS, Storage) et `match_documents` évite d’introduire un second moteur vectoriel.
- Q: Et si je préfère Node/Express ?
  - R: L’API Orchestrator peut être écrite en Node, la conception des endpoints reste identique.

---

Cette documentation couvre la vision, l’architecture cible, les flux et l’interface de l’API de remplacement sans n8n. Sur demande, un squelette de projet (FastAPI/Express + docker-compose) peut être généré pour démarrer l’implémentation.
