Voici un plan de développement détaillé, aligné sur le PRD et vos contraintes (Windows + RTX 3090, offline après installation, parité stricte sans n8n).

**Vision À Court Terme**
- Remplacer n8n par une API locale isofonctionnelle.
- V1: ingestion/indexation (PDF/Texte/Web), RAG + citations, GPU-only.
- V1.1: audio (Coqui), transcription (Whisper), exports (MD/JSON).

**Phase 0 — Préparation (M0)**
- Rôles: PO, TL, OPS.
- Livrables:
  - Environnement local prêt (Docker Desktop, Supabase local).
  - Modèles présents dans `D:\modeles_llm\` (ou config équivalente).
  - `.env` consolidé (remplacement `*_WEBHOOK_URL` vers l’API locale).
  - Docker Desktop avec WSL2 et NVIDIA Container Toolkit configurés pour l’accès GPU dans les conteneurs.
- Tâches:
  - Installer/valider CUDA + pilotes RTX 3090.
  - Démarrer Supabase local (Postgres, Storage, Edge).
  - Importer `supabase-migration.sql`; copier `supabase-functions`.
  - Préparer le stockage des modèles Ollama et la config GPU (CUDA); adopter l'Option A (volume Docker nommé `ollama-models:/root/.ollama`) comme défaut. Alternative: montage d’un chemin Windows (`D:\modeles_llm\`) si requis.
- Critères d’acceptation:
  - GPU visible via `nvidia-smi` côté host et utilisable dans containers.
  - Tables/RPC Supabase OK; buckets présents.
  - Vérification d’un conteneur test avec accès GPU (ex.: `nvidia-smi` depuis un container) documentée.

**Phase 1 — Spécifications figées (M1)**
- Rôles: PO, TL.
- Livrables:
  - Contrats d’API (OpenAPI minimal) pour 3 endpoints V1, exemples de requêtes/réponses, matrice d’erreurs.
- Tâches:
  - Figer schémas d’entrée/sortie pour:
    - `POST /webhook/process-document`
    - `POST /webhook/process-additional-sources`
    - `POST /webhook/chat`
  - Définir codes d’erreur/lifecycle (pending → completed/failed) et modèle d’erreur standard `{ code, message, details?, correlation_id }`.
  - Idempotence: définir `Idempotency-Key` (header) ou `idempotency_key` (body) pour les opérations d’ingestion.
  - Compat I/O Edge (chat): conserver la forme de réponse attendue par le frontend (compat n8n) — `{ success, data: { output: [{ text, citations: [...] }] } }`; conserver `n8n_chat_histories` (structure des messages) inchangée.
- Critères d’acceptation:
  - Contrats publiés dans `docs/PRD.md` (section API) et validés PO (incluant exemples et erreurs).
  - Règles d’idempotence documentées et acceptées.
  - Statut: M1 GELÉ — voir `docs/PRD.md` section « 20. Contrats d’API (V1) + Idempotence ».

**Phase 2 — Infra clone sans n8n (M2)**
- Rôles: OPS, TL.
- Livrables:
  - `docker-compose.yml` sans n8n; service `api` placeholder.
- Tâches:
  - Créer service `api` (réseau interne, dépendance sur `ollama`) et monter le volume modèles (Option A). Accès GPU configuré pour `ollama`.
  - Modèles (Option A retenue): utiliser un volume Docker nommé pour Ollama (ex.: `ollama-models:/root/.ollama`).
  - Mettre à jour `.env` pour rediriger `*_WEBHOOK_URL` vers `api` (placeholder), sans exposition de port vers l’hôte.
- Critères d’acceptation:
  - L’infra démarre sans n8n.
  - `ollama` sain (healthcheck via `ollama list` OK) et GPU visible.
  - `api` placeholder présent dans compose (réseau interne), sans exigence de `/health` pour M2 (couvrira M3).

**Phase 3 — Scaffold API Orchestrator (Semaine S+2)**
- Rôles: TL, BE.
- Livrables:
  - Projet API (FastAPI recommandé) + client Supabase + client Ollama.
- Tâches:
  - Organisation projet: modules `ingestion`, `index`, `rag`, `utils/logging`.
  - Middlewares: auth header `NOTEBOOK_GENERATION_AUTH`, logs JSON structurés par requête (correlation_id), gestion des timeouts.
  - Adapteurs:
    - Supabase (service role; insert/update; RPC `match_documents`).
    - Ollama (chat + embeddings) GPU-only.
    - Storage via `kong` (sign URLs, upload).
  - Endpoints techniques: `/health` (connectivité services + ping embeddings minimal) et `/ready` (validation configuration ENV) avec fail-fast au démarrage.
  - Sanity checks au démarrage:
    - Ping `OLLAMA_BASE_URL` et test d’un embedding sur une phrase factice; vérifier dimension=768.
    - Test RPC `match_documents` (appel à vide/simplifié) pour valider la connectivité DB et l’existence de la fonction.
    - Test accès Storage via `kong` (URL signée simple ou HEAD sur un bucket) si applicable.
  - GPU (Ollama): exécuter avec accès GPU (`gpus: all`); exposer un check simple côté `/health` confirmant l’utilisation GPU (si possible) et documenter variables de tuning (ex.: nombre de GPU/VRAM).
- Critères d’acceptation:
  - `/health` et `/ready` OK; configuration ENV validée au démarrage; logs structurés avec `correlation_id` présents.

**Phase 4 — Ingestion/Indexation (S+3 à S+4)**
- Rôles: BE, OPS.
- Livrables:
  - Endpoint `POST /webhook/process-document` fonctionnel.
- Tâches:
  - Extraction:
    - PDF: PyMuPDF ou pdfminer.six (texte fidèle, encodage).
    - Texte: pass-through.
    - Web (mode V1 via snapshots MD/HTML → MD → `.txt` + titre).
  - Résumé/titre via Ollama (LLM paramétrable) → update `sources`.
  - Chunking: taille/overlap ~200; calcul `loc.lines.from/to`.
  - Embeddings: `nomic-embed-text` (batch GPU), dimension 768.
  - Upsert `documents`: `content`, `metadata = { notebook_id, source_id, loc: { lines: { from, to } }, chunk_id }`.
  - Idempotence & déduplication: support `Idempotency-Key`; hash de chunk (SHA-256 du texte normalisé); éviter doublons par (source_id, chunk_id).
  - Verrous/statuts de traitement: marquer la `source` en `processing` → `completed|failed` pour empêcher les replays concurrents.
  - Callback Edge (status) + gestion d’erreurs (retry limité, logs).
- Critères d’acceptation:
  - PDF court/long et Texte indexés; `documents` et métadonnées corrects.
  - GPU confirmé pendant embeddings; pas de fallback CPU.
  - Re-run d’une source avec même contenu n’insère pas de doublons (idempotence effective).

**Phase 5 — Chat RAG + Citations (S+4 à S+5)**
- Rôles: BE.
- Livrables:
  - Endpoint `POST /webhook/chat` fonctionnel.
- Tâches:
  - Récupérer historique `n8n_chat_histories(session_id)`.
  - Générer `search_query` (LLM).
  - Embedding de requête; RPC `match_documents` (filtre par `notebook_id`).
  - Prompt RAG strict (citations obligatoires `[n]`, “je ne sais pas” si non trouvé).
  - Post-traitement: transformer `[n]` en `citations[]` avec `source_id` + `lines.from/to`, en mappant strictement les indices aux `chunk_id` sélectionnés.
  - Ordonnancement & journaux: trier les chunks par score (déterministe), figer l’ordre d’indexation pour le prompt, journaliser le mapping `[n] → { chunk_id, source_id, loc.lines }` et les topK retenus.
  - Persister human/ai dans `n8n_chat_histories` (parité format JSON).
- Critères d’acceptation:
  - Q/A sur PDF court avec citations correctes (vérifiables).
  - Question hors contexte → “je ne sais pas”.
  - Chaque citation référence un chunk existant et des lignes plausibles.

**Phase 6 — Observabilité, Sécurité, Offline (S+5)**
- Rôles: TL, OPS.
- Livrables:
  - Journaux par étape; sécurité minimale; tests offline.
- Tâches:
  - Logs: corrélation par requête (correlation_id), niveaux info/debug, erreurs actionnables; métriques de latence par étape (extract, chunk, embed, upsert, retrieve, generate, postprocess).
  - Sécurité: header auth obligatoire; API non exposée hors réseau Docker (port non publié). Option HMAC/horodatage anti-replay (facultatif V1).
  - Offline: exécution ingestion texte + RAG sans réseau (post installation).
- Critères d’acceptation:
  - Checklist `docs/CHECKLIST_TESTS_V1.md` — sections env/séc/offline validées.
  - Présence de logs structurés JSON avec `correlation_id` et temps par étape.

**Phase 7 — Validation & Performance (S+6)**
- Rôles: QA, BE.
- Livrables:
  - Rapport de tests V1 rempli (`docs/TEST_REPORT_V1.md`).
- Tâches:
  - Exécuter la checklist V1 complète.
  - Mesurer: indexation PDF long (min:s), latences Q simple/complexe, occupation GPU; consigner métriques dans le rapport.
  - Ajuster batch taille embeddings/LLM si nécessaire.
- Critères d’acceptation:
  - Parité fonctionnelle confirmée, citations vérifiables, GPU-only OK.
  - Cibles indicatives atteintes (ajustables): Indexation PDF ~50p < 5–8 min; Q simple < 3–5 s; Q complexe < 10–15 s.

**Phase 8 — Emballage & Documentation (S+6)**
- Rôles: DOC, OPS.
- Livrables:
  - Docs finales; `README.md` mis à jour; éventuel script `start_services.py`.
- Tâches:
  - Finaliser `docs/` (sections finales, liens).
  - Option: script unique de démarrage et vérifications préflight (GPU, modèles, env) + `.env.example` complet et commenté.
- Critères d’acceptation:
  - Lecture “de zéro à V1 validée” réalisable uniquement via la doc.

- Rôles: BE, OPS.
- Livrables:
  - `POST /webhook/generate-audio` (Coqui), pipeline Whisper ASR, exports MD/JSO
N.
- Tâches:
  - Coqui TTS (GPU si dispo), upload bucket `audio`, update `notebooks`.
  - Whisper ASR (HTTP multipart), mapping vers `sources`/`documents`.
  - Exports (Markdown/JSON) des réponses/citations.
- Critères d’acceptation:
  - Audio/transcription/exports validés et testés (checklist V1.1).

**Planification Indicative**
- S+0: Phase 0 (env) — terminé
- S+1: Phase 1 (contrats API)
- S+2: Phase 2 (infra sans n8n)
- S+3/4: Phases 3–4 (scaffold + ingestion/indexation)
- S+5: Phase 5–6 (RAG + obs/séc/offline)
- S+6: Phase 7–8 (validation/perfs + docs) → Release V1
- S+8: V1.1 (audio/transcription/exports)

**Standards & Conventions**
- GPU-only: vérifier systématiquement l’utilisation GPU sur embeddings/LLM.
- Modèles: Option A (volume Docker nommé `ollama-models:/root/.ollama`) par défaut; alternative: montage `D:\modeles_llm\` si nécessaire.
- Erreurs: ne jamais planter le service; remonter des erreurs contextualisées.
- Logs: corrélation par requête; logs JSON structurés (INFO/ERROR, DEBUG optionnel) avec `correlation_id` et temps par étape.
- Sécurité: header auth minimal; réseau local Docker uniquement.
 - Idempotence: utiliser `Idempotency-Key` pour les opérations d’ingestion; éviter les doublons via hash de chunk et clés uniques logiques.
 - Timeouts & retries: définir des délais raisonnables par appel et des retries avec backoff sur erreurs transitoires.
 - Compat I/O Edge: préserver la structure de réponse compatible frontend (forme n8n) et la structure des messages dans `n8n_chat_histories`.

**Risques & Parades**
- Extraction PDF hétérogène: prévoir fallback extraction (PyMuPDF/pdfminer) et n
- Normalisation.
- Occupation GPU: ajuster tailles lot (batch) et activer modèles quantifiés si besoin.
- Offline strict: prévoir fallback snapshots web (pas de fetch réseau en test).
- Windows chemins/accès: standardiser les volumes Docker pour `D:\modeles_llm\`.
 - Intégration Edge/Frontend: rester proche des formats I/O pour limiter l’écart; prévoir adaptations minimales si nécessaire.

**Livrables Clés**
- Code API Orchestrator (3 endpoints V1).
- `docker-compose.yml` sans n8n + service `api`.
- `.env` consolidé (URLs, secrets) + `.env.example` commenté.
- Docs finales sous `docs/` + `README.md` racine.
- Checklist test V1 et Rapport test V1 complétés.
 - Spécifications OpenAPI (V1) avec exemples et matrice d’erreurs; endpoints `/health` et `/ready`.