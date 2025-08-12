---
title: "Audit — tm-13 Docs sync check (repos modèle, specs, Task‑Master)"
doc_kind: audit
team: team-01
team_name: foundations
version: 1.0
status: review
author: AI-Implementateur
tm_ids: [13]
scope: docs
related_files:
  - docs/clone/insights-lm-local-package-main/insights-lm-local-package-main
  - docs/clone/insights-lm-public-main/insights-lm-public-main
  - docs/spec/openapi.yaml
  - docs/DOCUMENTATION_PROJET.md
  - .taskmaster/tasks/tasks.json
---

## Résumé
- Repos modèles présents et intègres sous `docs/clone/` (local-package + public/frontend).
- Spécifications OpenAPI centralisées (`docs/spec/openapi.yaml`) cohérentes avec la structure attendue (endpoints référencés par fichiers).
- État Task‑Master synchronisé avec l’implémentation et les tests (chat complet; ingestion en cours; logging en cours; santé/readiness OK).
- Aucun écart bloquant constaté vis‑à‑vis de la documentation projet; les adaptations relèvent du cadre prévu (remplacement n8n par Orchestrator, logs structurés selon SPEC, idempotence côté ingestion).

## Références
- Repos modèles
  - `docs/clone/insights-lm-local-package-main/insights-lm-local-package-main`
  - `docs/clone/insights-lm-public-main/insights-lm-public-main`
- Documentation projet
  - `docs/DOCUMENTATION_PROJET.md` (parité stricte; mapping webhooks; variables d’env; stockage modèles D:/)
  - `docs/spec/` (OpenAPI et SPEC complémentaires: HEALTH_READY, GPU_ONLY, LOGGING_ERRORS, IDEMPOTENCY, CHUNKING)
- Gouvernance
  - `.taskmaster/tasks/tasks.json`

## Vérifications
- OpenAPI
  - `openapi.yaml` référence bien `chat.yaml`, `process-document.yaml`, `process-additional-sources.yaml`, `generate-notebook-content.yaml`, `generate-audio.yaml` et expose `/health`, `/ready`.
  - Schéma d’erreurs `ErrorResponse` et header `Authorization` (ApiKeyAuth) présents; paramètre `Idempotency-Key` documenté.
- Implémentation actuelle (orchestrator)
  - Auth sur `/webhook/*` conforme (401 si header manquant/incorrect).
  - `/health` et `/ready` opérationnels; `/ready` retourne 503 avec `NOT_READY` + `details` lorsque dépendances manquantes (conforme SPEC).
  - Ingestion: idempotence supportée; `process-document` aligne la validation OpenAPI when signaled; `additional-sources` gère `copied-text` et `multiple-websites` avec stockage `.txt` simulé.
  - Logging: `correlation_id` propagé; events structurés ajoutés (RAG/TTS/UPLOAD/CALLBACK) — conforme à `LOGGING_ERRORS_SPEC.md` (sans redaction encore).
- Task‑Master
  - 1 (chat): done; 2 (process-document): in‑progress; 10 (logging): in‑progress avec sous‑tâches détaillées; 14 (health): done; 15 (idempotence): tests OK; 19 (ingestion gap closure): in‑progress.

## Points à confirmer (pas des écarts)
- `process-additional-sources` (multiple‑websites): la conversion HTML→texte et la structuration des titres/chemins doivent suivre le comportement d’origine; notre implémentation actuelle simule le contenu texte et l’upload `.txt` — à valider contre les workflows du repo modèle (Edge Functions et n8n d’origine) avant de déclarer la parité complète.
- Redaction de secrets (ex. `Authorization`) dans les logs: non implémentée; prévue par la SPEC (tm‑10.6) — c’est une exigence de conformité, pas un choix architectural.

#TEST: orchestrator/test/contract/ready-error-shape.test.ts
#TEST: orchestrator/test/contract/webhooks.test.ts
#TEST: orchestrator/test/contract/additional-sources.test.ts
#TEST: orchestrator/test/integration/additional-sources-storage-db.test.ts

## Limitations
- L’audit s’appuie sur la lecture des repos clonés et l’exécution locale de la suite de tests; il ne statue pas encore sur la parité fine des conversions HTML→texte.
- La redaction des secrets n’est pas encore vérifiée par des tests dédiés; elle fera l’objet d’un audit une fois implémentée (tm‑10.6).
