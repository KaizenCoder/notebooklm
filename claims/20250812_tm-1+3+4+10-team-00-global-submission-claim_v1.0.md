---
title: "Claim — Submission Ready (IDs 1,3,4,10)"
doc_kind: claim
team: team-00
team_name: global
version: 1.0
status: review
author: AI-Implementateur
tm_ids: [1, 3, 4, 10]
scope: submission
related_files:
  - .taskmaster/tasks/tasks.json
  - orchestrator/src/app.ts
  - orchestrator/src/services/document.ts
  - orchestrator/src/services/storage.ts
  - docs/spec/openapi.yaml
---

## Résumé
Ce claim atteste que les items 1 (chat), 3 (additional-sources websites), 4 (additional-sources copied-text) et 10 (logging & errors) sont prêts pour soumission.

## Contexte
- Parité stricte requise vis-à-vis des Edge Functions & specs dans `docs/spec/*`.
- Tests de contrat, d’intégration et E2E au vert localement.

## Portée
- ID 1 — POST `/webhook/chat`: contrat, intégration, E2E; logs RAG & métriques; redaction Authorization.
- ID 3 — `/webhook/process-additional-sources` (websites): fetch→upload `.txt`→indexation; idempotence.
- ID 4 — `/webhook/process-additional-sources` (copied-text): upload `.txt`→indexation; idempotence.
- ID 10 — Logging & Errors: modèle d’erreur contractuel; `correlation_id`+`x-correlation-id`; redaction; évènements & métriques.

## Critères d’acceptation
- Réponses HTTP conformes (statuts & shape) aux tests.
- Journaux d’étapes présents et sans fuite de secrets.
- Idempotency-Key: mêmes corps de réponse en replay.

## Impacts
- Aucun impact de rupture API; alignement parité renforcé.

## Risques
- Qualité de conversion HTML→texte non évaluée sémantiquement.

## Références
- Specs: `docs/spec/openapi.yaml`, `process-document.yaml`, `process-additional-sources.yaml`.
- Audits: `audit/20250812_tm-19-team-02-ingestion-audit_v1.0.md`, `audit/20250812_tm-19-team-02-ingestion-submission-ready-audit_v1.0.md`, `audit/20250812_tm-10-team-01-foundations-logging-submission-ready-audit_v1.0.md`.

#TEST: orchestrator/test/contract/chat-integration.test.ts
#TEST: orchestrator/test/e2e/chat-edge-send.test.ts
#TEST: orchestrator/test/contract/additional-sources.test.ts
#TEST: orchestrator/test/contract/idempotency-additional-sources.test.ts
#TEST: orchestrator/test/integration/additional-sources-storage-db.test.ts
#TEST: orchestrator/test/contract/ready-error-shape.test.ts
#TEST: orchestrator/test/integration/logging-redaction.test.ts
#TEST: orchestrator/test/integration/process-document-step-logs.test.ts
#TEST: orchestrator/test/integration/generate-audio-step-logs.test.ts
#TEST: orchestrator/test/contract/chat-llm-metrics.test.ts

## Limitations
- Conversion HTML→texte: validée fonctionnellement, pas de métrique de qualité.
- Storage dépendant de `STORAGE_BASE_URL` en env local; tests via mocks.
- NO_MOCKS non exécuté dans ce claim (voir script CI dédié).
