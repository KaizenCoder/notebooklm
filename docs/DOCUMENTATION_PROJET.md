<!-- Déplacé sous docs/ -->
# InsightsLM Local — Documentation complète du projet (sans n8n)

Important — Mode Clone: on ne réinvente rien. On reprend l’existant à l’identique et on ne fait QU’UN remplacement de n8n par un service API local prévu (non implémenté pour le moment). Toutes les autres briques (Supabase, Edge Functions, Ollama, Whisper, Coqui, schéma SQL) restent identiques.
les repo modèles ont été cloné ici : C:\Dev\my_notebooklm\docs\clone

## Principe de parité stricte
- Aucun ajout fonctionnel, technique ou UX par rapport au package original.
- Seul changement autorisé: remplacer n8n par une API locale exposant les mêmes webhooks, référencés par les mêmes variables d’environnement (`*_WEBHOOK_URL`).
- Conserver les mêmes flux, contrats I/O, schéma SQL, Edge Functions, et conventions Docker/volumes que l’original.
- Cette documentation n’introduit aucune alternative ni optimisation non présentes dans l’original.
- Base de données: DOIT être locale, en PostgreSQL (avec pgvector). L’usage éventuel de Supabase se fait en mode local uniquement (il s’appuie lui‑même sur PostgreSQL local). Aucune base cloud n’est autorisée.

## Référence continue au repo modèle (obligatoire)
- Source de vérité: les dépôts clonés sous `docs/clone/`:
  - `docs/clone/insights-lm-local-package-main/insights-lm-local-package-main`
  - `docs/clone/insights-lm-public-main/insights-lm-public-main`
- Toute tâche d’implémentation doit:
  - référencer le(s) fichier(s) d’origine concernés (chemins précis) ;
  - prouver l’équivalence des endpoints/payloads/comportements (copie d’extraits au besoin) ;
  - signaler et justifier toute « adaptation validée » (diff minimale, raison, impact nul côté frontend).
- Les revues doivent vérifier l’absence d’écart non justifié avec le modèle.

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
- Backend (remplace n8n): service API local (« API Orchestrator ») exposant exactement les mêmes webhooks attendus par les Edge Functions. Stack alignée avec le repo original: Node.js/TypeScript (ex.: Fastify/Express). À ce stade, c’est un placeholder documentaire (pas d’implémentation).
- Base de données: PostgreSQL local avec extension pgvector (table `documents`) pour la recherche sémantique. Option: Supabase en mode local comme surcouche, mais la base reste strictement locale.
- Stockage: en local (ex.: via le composant Storage de Supabase local, ou répertoire monté), buckets `sources`, `audio`, `public-images`.
- IA locales:
  - Ollama pour LLM (p. ex. `qwen3:8b-q4_K_M`) et embeddings (`nomic-embed-text`).
  - Whisper ASR pour transcription audio.
  - Coqui TTS pour synthèse vocale.

Visuel (texte):
- Frontend ⇄ couche d’accès aux données locale (Supabase local optionnel pour Auth/Realtime) ⇄ PostgreSQL local
- Edge Functions (si utilisées en local) → appellent l’API Orchestrator via webhooks
- API Orchestrator → Ollama / Whisper / Coqui / PostgreSQL (tables + pgvector) et stockage local

## 4) Schéma des données (extraits)
- `notebooks`: cahiers, statut de génération, url audio, etc.
- `sources`: éléments d’un cahier (pdf, texte, site, audio), contenu, résumé, statut de traitement.
- `notes`: notes utilisateur.
- `n8n_chat_histories`: historique de conversation (réutilisé pour compat frontend).
- `documents`: table vectorielle pour les chunks (embedding 768d; `metadata` inclut `notebook_id`, `source_id`, positions `loc.lines`).
- RPC/SQL `match_documents(query_embedding, match_count, filter)` pour la similarité (cosine) avec filtre JSON sur `metadata`, implémentée dans PostgreSQL local.

## 5) Composants et responsabilités
- API Orchestrator (nouveau, Node.js/TypeScript):
  - Expose des webhooks équivalents à n8n.
  - Orchestre: extraction (en utilisant des librairies de l'écosystème Node.js/TypeScript pour la parité), transformation, embeddings, upsert vectoriel, RAG, citations, callbacks.
  - Persiste l’historique chat et met à jour `sources`/`notebooks` dans PostgreSQL local.
- Accès aux données:
  - PostgreSQL local (pgvector) pour les tables métier et la fonction `match_documents` (SQL côté base).
  - Stockage de fichiers en local (ou via composant Storage local si Supabase local est utilisé).
- Services IA:
  - Ollama: chat et embeddings.
  - Whisper ASR: transcription audio.
  - Coqui TTS: génération audio (podcast/aperçu).

## 5bis) Gouvernance & Méthodologie (Task‑Master OS)
- Règle d’or: « Pas de tâche, pas de travail ». Toute action (spec, dev, test, audit, doc) est traçée dans `.taskmaster/tasks.json` et référencée dans commits/PR.
- Binôme systématique: Implémenteur (code/tests unitaires) + Auditeur (conformité/parité/perfs/sécurité).
- Chaîne de travail par fonctionnalité: SPEC → IMPL → TEST → AUDIT (dépendances bloquantes). L’IMPL ne démarre qu’après SPEC; l’AUDIT ne démarre qu’après IMPL + TEST.
- Revue de parité: hebdomadaire, comparaison contre les dépôts sous `docs/clone/` (payloads, statuts HTTP, effets DB, UX). Résultats consignés dans `docs/PARITY_REVIEW_CHECKLIST.md` et `docs/DECISIONS.md` avec IDs Task‑Master.
- Séparation claire FE/BE: équipes dédiées; le FE peut avancer via mocks contractuels tant que les webhooks ne sont pas prêts.

## 6) Flux principaux
- Ingestion d’un document (PDF/Audio/Texte):
  1) Edge Function `process-document` envoie à l’API: `{ source_id, file_path, source_type, callback_url }`.
  2) L’API télécharge depuis Storage (URL signée) ou utilise le texte fourni.
  3) Extraction: PDF→texte; Audio→Whisper; Texte→direct.
  4) L’API génère titre/résumé (LLM) et met à jour `sources`.
  5) Découpage en chunks (overlap ~200), embeddings (Ollama), insertions dans `documents` avec `metadata` complètes.
  6) Callback vers `process-document-callback` avec statut `completed` ou `failed`.

- Sources additionnelles (copied‑text / multiple‑websites):
  1) Edge Function poste à l’API: `{ type, notebookId, sourceId, title, content|urls[] }`.
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

### Spécification Formelle de l'API (OpenAPI)

Pour garantir la parité et fournir une "source de vérité" technique, l'ensemble des contrats d'API de l'Orchestrateur est formellement défini à l'aide de la spécification OpenAPI 3.0.

Ces spécifications sont la référence absolue pour l'implémentation et les tests. Elles se trouvent dans le répertoire `docs/spec/`.

- **Point d'entrée principal :** `docs/spec/openapi.yaml`
- **Détails :** Chaque endpoint est détaillé dans un fichier séparé et référencé par le fichier principal. Un `README.md` dans ce répertoire explique la structure en détail.

L'utilisation de ces spécifications est obligatoire pour toute tâche de développement ou d'audit liée à l'API.

- Auth: toutes les routes Webhook sont protégées par un header `Authorization: ${NOTEBOOK_GENERATION_AUTH}`.
- Données: toutes les lectures/écritures se font sur PostgreSQL local (aucune base distante).
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

## 7bis) Table de correspondance — Webhooks Edge → Endpoints Orchestrateur

Cette table liste, à titre de référence, les variables d’environnement utilisées par les Edge Functions et la route correspondante côté orchestrateur. Les contrats (méthode, en‑têtes, payload, codes HTTP) doivent rester identiques à l’original.

| Edge Function (source) | Var d’env (Edge) | Méthode | Endpoint orchestrateur | Auth | Payload attendu (extraits) | Remarques |
|---|---|---|---|---|---|---|
| send-chat-message | `NOTEBOOK_CHAT_URL` | POST | `/webhook/chat` | Header `Authorization: ${NOTEBOOK_GENERATION_AUTH}` | `{ session_id, message, user_id, timestamp }` | Écrit l’historique dans `n8n_chat_histories` (2 messages: user, assistant). |
| process-document | `DOCUMENT_PROCESSING_WEBHOOK_URL` | POST | `/webhook/process-document` | Header `Authorization` | `{ source_id, file_url, file_path, source_type, callback_url }` | Extraction → indexation → upsert `documents` → callback (URL fournie). |
| process-additional-sources | `ADDITIONAL_SOURCES_WEBHOOK_URL` | POST | `/webhook/process-additional-sources` | Header `Authorization` | `type: 'multiple-websites' | 'copied-text'`; pour websites: `{ notebookId, urls[], sourceIds[], timestamp }`; pour texte: `{ notebookId, title, content, sourceId, timestamp }` | Met à jour/ajoute `sources`, stocke le contenu `.txt` si besoin, indexe comme un document. |
| generate-notebook-content | `NOTEBOOK_GENERATION_URL` | POST | `/webhook/generate-notebook-content` | Header `Authorization` | `{ sourceType, notebookId, filePath? | content? }` | Doit répondre 202 (accepted); met `notebooks.generation_status='generating'` puis complète plus tard. |
| generate-audio-overview | `AUDIO_GENERATION_WEBHOOK_URL` | POST | `/webhook/generate-audio` | Header `Authorization` | `{ notebook_id, callback_url }` (texte à générer récupéré côté orchestrateur selon l’original) | Met `audio_overview_generation_status`, upload audio, puis callback avec `audio_url` et statut. |

Note: les callbacks (ex. `process-document-callback`, `audio-generation-callback`) sont des Edge Functions Supabase et doivent être appelés exactement avec les URLs fournies dans les payloads (`callback_url`).

Voir aussi: `WEBHOOKS_MAPPING.md` (table de correspondance) et `ANNEXES_PAYLOADS.md` (exemples JSON) pour référence rapide.

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
- Edge Functions: garder le code tel quel; leurs URLs webhook (`*_WEBHOOK_URL`) pointeront vers un futur service `api` (placeholder). Ne pas déployer n8n.

Variante — Modèles Ollama sur D:/modeles_llm (Windows)
- Dans Docker Desktop, autoriser le partage du disque D: (Settings → Resources → File Sharing).
- Dans le service `ollama` du `docker-compose.yml` (infra de base), monter le dossier local et définir la variable d’environnement:
  - volumes: `- "D:/modeles_llm:/root/.ollama"`
  - environment: `- OLLAMA_MODELS=/root/.ollama`
- Démarrer le service Ollama puis vérifier: `docker exec -it <container_ollama> ollama list`.
- Remarque: `D:/modeles_llm` doit contenir un store Ollama valide (manifest + blobs). Si nécessaire, exécuter `ollama pull <model>` avec le montage actif pour initialiser le store dans ce dossier.

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

### 12bis) Mode No‑Mocks (exécution réelle obligatoire)
- Variable `NO_MOCKS=1` active des garde‑fous runtime interdisant les mocks.
  - DB: `createDb` jette si `POSTGRES_DSN` absent.
  - GPU: `GPU_ONLY=1` + probe embeddings obligatoire.
  - Whisper/Storage/Coqui: URLs requises; pannes → `/ready` 503.
- Hooks Git pre‑push (Windows + Bash/WSL):
  - Emplacements versionnés: `scripts/git-hooks/pre-push`, `scripts/git-hooks/pre-push.ps1`
  - Installation locale Windows: `.git/hooks/pre-push.ps1` + `.git/hooks/pre-push.cmd`
  - Actions: (1) `ci/anti-mock-scan.ps1` (détecte mock/fake/dummy/placeholder/noop) puis (2) `ci/no-mocks-check.ps1` (E2E minimal avec `NO_MOCKS=1`)
- Commandes manuelles:
```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File ci\anti-mock-scan.ps1
pwsh -NoProfile -ExecutionPolicy Bypass -File ci\no-mocks-check.ps1
```

#TEST: ci/anti-mock-scan.ps1
#TEST: ci/no-mocks-check.ps1
#TEST: .git/hooks/pre-push.ps1

### 12ter) Anti‑Mock & Gouvernance de non‑contournement
- Objectif: empêcher le « renommage pour contourner » et garantir l’exécution réelle en local.
- Règles:
  - Interdiction d’introduire ou de conserver des implémentations « mock/fake/dummy/placeholder/noop » dans `orchestrator/src`.
  - Les simulations ne sont autorisées que sous `orchestrator/test/**`.
  - `NO_MOCKS=1` en local et en CI active des contrôles bloquants (scan + E2E): un push/merge échoue si l’environnement réel n’est pas prêt ou si des motifs suspects sont détectés.
  - Toute tentative de contournement (renommer variables, déplacer le code simulé) est contraire à la politique et sera bloquée par les contrôles outillés.
- CI locale: reproduit les deux contrôles (anti-mock et no-mocks) dans le pipeline.

## Limitations
- Le mode No‑Mocks exige DB/Ollama/Whisper/Storage opérationnels localement.
- Le scan anti‑mock est lexicographique (mots clés); il peut produire des faux positifs à whitelister si nécessaire (ajouter des exceptions documentées côté tests uniquement).

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

Cette documentation présente la vision, l’architecture cible, les flux et l’interface de l’API de remplacement sans n8n, avec un objectif de parité stricte avec le package original (aucun ajout non présent dans l’original).

## 16) Claims & Audits (processus et conventions)

- Objectif: tracer les demandes de changement (claims) et leurs vérifications (audits) en cohérence avec Task‑Master et les règles de parité.
- Localisation: répertoires `claims/` et `audit/` à la racine du projet.

### Schéma de nommage des fichiers
- Claims: `YYYYMMDD_tm-<ids>-team-<nn>-<team-name>-<scope>-claim[_resubmit-<n>]_v<maj.min>.md`
  - Ex.: `claims/20250812_tm-2-team-02-ingestion-claim_resubmit-1_v1.1.md`
- Audits: `YYYYMMDD_tm-<ids>-team-<nn>-<team-name>-<scope>-audit_v<maj.min>.md`
  - Ex.: `audit/20250811_tm-1+6-team-03-rag-audio-audit_v1.0.md`
- Règles:
  - minuscules, kebab‑case, ASCII
  - ne pas encoder le statut dans le nom (statut dans le front‑matter)
  - `<ids>` concaténés avec `+` (ex.: `tm-2+9+16`), sous‑tâches autorisées (`2.4`)

### Templates
- Claim: `claims/TEMPLATE_CLAIM.md`
- Audit: `audit/TEMPLATE_AUDIT.md`

### Front‑matter requis (YAML)
Champs obligatoires communs (claims et audits):
- `title`, `doc_kind` (claim|audit), `team` (ex.: team-03), `team_name` (ex.: rag-audio)
- `tm_ids` (ex.: `[1, 6, 10, 15]`), `scope` (ex.: `chat|generate-audio|logging`)
- `status` (draft|review|approved|rejected|superseded), `version` (ex.: 1.0), `author`, `related_files`

### Workflow recommandé
1) Création du claim (équipe demandeuse)
- Dupliquer le template claim et remplir le front‑matter + sections (Résumé, Contexte, Portée, Critères d’acceptation, Impacts, Risques, Références, Limitations, Suivi Task‑Master)
- Ouvrir/mettre à jour les tâches `.taskmaster` concernées et référencer les IDs dans le front‑matter

2) Audit (auditeur)
- Dupliquer le template audit, relier le claim dans `related_files`
- Compléter Références (vers `docs/spec/...`, `docs/clone/...`, `docs/ANNEXES_PAYLOADS.md`), Méthodologie, Vérifications (HTTP/DB/Storage/Logs), Résultats, Recommandations, Limitations, Suivi

3) Preuves et traçabilité
- Ajouter au moins une ligne `#TEST:` pointant vers des tests/évidences:
  - `#TEST: orchestrator/test/contract/*.test.ts`
  - `#TEST: orchestrator/test/integration/*.test.ts`

4) Gouvernance Task‑Master
- Respect strict du flux SPEC → IMPL → TEST → AUDIT
- Exemples de commandes: 
  - `task-master set-status --id=<ID> --status=in-progress`
  - `task-master set-status --id=<ID> --status=review`
  - `task-master set-status --id=<ID> --status=done`

### Bonnes pratiques
- Un fichier par demande majeure (version majeure), révisions mineures via `vMAJEUR.MINEUR`
- Statuts dans le front‑matter (pas dans le nom du fichier)
- Référencer systématiquement les IDs Task‑Master et les fichiers sources (`docs/clone/...`)

#TEST: docs/spec/README.md

## 17) Limitations
- Cette section formalise l’organisation documentaire; elle n’introduit aucune exigence nouvelle hors parité avec l’original.
- Toute métrique mentionnée dans les documents est indicative; les preuves doivent être apportées via `#TEST:` (logs, tests, artefacts).

### Validation automatique (claims/audit)

- Script: `node scripts/validate-claims-audit.mjs`
- Vérifie:
  - Nommage conforme (regex par type: claim/audit/submission)
  - Front‑matter YAML requis présent
  - Au moins une ligne `#TEST:`
  - Présence de la section `## Limitations`
- Sortie:
  - Code 0: conforme
  - Code 1: violations listées (corriger avant commit/PR)
- Recommandation: exécuter localement avant chaque commit; optionnellement l’ajouter en pré‑commit Git.
