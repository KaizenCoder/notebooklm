# Analyse du plan de développement — V1.0.0

- Source analysée: `projet_plan_de_dev_dataillee_v100.md`
- Contexte: PRD V0.1 (parité stricte sans n8n, Windows + RTX 3090 GPU-only, offline apres installation), docs du repo (`docs/*`).
- Objet: evaluation critique et recommandations operationnelles avant execution.

## Verdict
- Globalement solide et aligne sur le PRD: parité sans n8n, phasage V1/V1.1, GPU-only, offline apres installation. Phases et criteres d’acceptation clairs.
- Points a preciser pour eviter les regressions: compat I/O Edge, citations robustes, idempotence des webhooks, garantie d’usage GPU via Ollama sous Windows/WSL2, objectifs de performance mesurables.

## Points forts
- Clarte du phasage: livraison incrementale jusqu’a une V1 testee; V1.1 pour audio/transcription/exports.
- Endpoints cibles bien cadres: `POST /webhook/process-document`, `POST /webhook/process-additional-sources`, `POST /webhook/chat` (audio en V1.1).
- Observabilite et securite presentes: logs par etape, header d’auth, exposition limitee au reseau Docker local.
- Strategie offline: usage de snapshots web pour V1.
- Rappel systematique GPU-only et mesures prevues en validation.

## Ecarts / manques vs PRD et docs
- Compatibilite I/O avec Edge Functions: le PRD indique que la compat exacte n’est pas requise, mais les Edge pointeront vers l’API. Recommende: conserver un contrat tres proche des reponses n8n (shape `output[{ text, citations[] }]`, historique `n8n_chat_histories`) pour minimiser tout changement cote Edge.
- Citations: preciser la methode de mapping `[n]` -> `citations[]` (ordre et stabilite des chunks, conservation de `chunk_id` et `loc.lines`) pour parite stricte et verifiabilite.
- Idempotence: non traite. Les webhooks peuvent etre rejoues; necessite d’une cle d’idempotence (ex. `source_id` + `notebook_id` ou header `Idempotency-Key`) et d’upserts `documents` pour eviter doublons.
- Objectifs de perf: PRD marque TBD. Fixer des fourchettes indicatives pour guider S+6 (ex.: indexation 50 pages < 8–12 min, Q simple < 3–5 s, Q complexe < 10–15 s sur RTX 3090).
- GPU sous Windows: l’utilisation GPU se fait dans le conteneur Ollama, pas l’API. Preciser NVIDIA Container Toolkit/WSL2, options Docker (`--gpus all`), et conf Ollama pour eviter fallback CPU.
- Dimension embeddings: 768 attendue; ajouter une sonde au boot pour verifier `pgvector` et la dimension cible (sanity check DB/RPC).

## Risques & mitigations
- Extraction PDF heterogene: double implementation PyMuPDF/pdfminer avec fallback; tests d’encodage; normalisation CRLF/UTF-8.
- Citations incoherentes: trier les chunks par score, figer l’ordre, injecter indices dans le prompt, journaliser le mapping `[n]` -> `{chunk_id, source_id, loc.lines}`.
- Rejouabilite webhooks: idempotence par `source_id`/`notebook_id`, verrous de traitement (statuts) et upserts `documents`.
- GPU non utilise: checklist NVIDIA/WSL2/Toolkit; conteneur Ollama avec `--gpus all`; variables et conf (ex. `OLLAMA_NUM_GPU`); test rapide embedding/generation affichant la device.
- Offline strict: bannir les fetchs reseau (sauf telechargement initial); mode snapshots only pour `multiple-websites`.
- Chemins Windows: normaliser volumes Docker (`D:\\modeles_llm\\` -> `/models`), verifier droits et CRLF.

## Ajustements recommandes
- Contrats API (Phase 1):
  - Ajouter schemas d’erreurs, documenter `Authorization` obligatoire, champs stables pour compat Edge, exemples JSON realistes (request/response).
- Idempotence & retry:
  - Header `Idempotency-Key` (ou derive de `source_id`), upsert `documents`, retries avec backoff pour Ollama/Supabase/Storage.
- Logs/trace:
  - `X-Request-Id` par requete, correlation dans tous les logs; niveaux INFO/ERROR par defaut, DEBUG activable; log des topK chunks retenus.
- Sanity checks au boot:
  - Ping `OLLAMA_BASE_URL`, test embedding (dimension=768), test RPC `match_documents`, verif acces Storage via `kong`.
- Tests de contrat:
  - Petite suite (Postman/pytest) pour les 3 endpoints V1 (fixtures), a lancer avant QA.
- Docker compose:
  - Montage du volume modeles (`D:\\modeles_llm\\` -> `/models` pour Ollama), GPU (`--gpus all`), `depends_on` (`ollama`, `kong`), healthchecks (`/health`).

## Clarifications d’acceptation
- Ingestion/indexation: valider dimension 768, presence de `metadata.notebook_id`, `metadata.source_id`, `metadata.loc.lines.from/to` sur echantillon; mesurer temps d’indexation et le journaliser.
- Chat RAG: reponse conforme `output[{ text, citations[] }]`; reponse "je ne sais pas" hors contexte; historique ecrit dans `n8n_chat_histories` (format inchangé).
- GPU-only: captures `nvidia-smi` pendant embeddings et generation; absence de fallback CPU.
- Offline: ingestion texte + chat sans reseau apres installation; logs explicites si une fonction requerrait le reseau.

## Notes techniques
- Embeddings: `nomic-embed-text` -> 768 dims; verifier alignement schema SQL; batch (p.ex. 32–128) et ajuster selon VRAM.
- Chunking: overlap ~200; stocker offsets de lignes reproductibles apres normalisation pour robustesse des citations.
- RPC `match_documents`: filtre `metadata.notebook_id`; `topK` et seuil de score parametres par env.
- Web: pour V1, prioriser inputs `.md`/`.txt`; conversion HTML->Markdown offline-first via snapshots.

## Sequencement / jalons (ajouts)
- Fin M1: revue de contrats avec echantillons JSON valides par PO.
- Fin S+3: tests de contrat automatisees (CI locale) avant implementation complete.
- Gate S+5: demo E2E PDF court avec citations verifiables et logs complets avant QA.

## Questions ouvertes
- Faut-il un shim de compat exact pour toutes les reponses attendues par les Edge existantes, ou une compat "suffisante" documentee est acceptable ?
- Valeurs cibles de performance (indexation/latence) a geler; proposer des fourchettes initiales puis iterees a S+6.
- Stack API finale: FastAPI confirmee ? (Sinon Express; Python garde l’avantage parsing/pgvector/outillage ML).

## Suites proposees
- Rediger les contrats JSON precis des 3 endpoints V1 avec exemples (requests/responses, erreurs).
- Ecrire une mini suite de tests de contrat (pytest/Postman) et un `/health` detaille.
- Esquisser `docker-compose` sans n8n avec montage `D:\\modeles_llm\\` et GPU pour `ollama`.

***

Derniere mise a jour: generee automatiquement lors de l’analyse du plan V1.0.0.
