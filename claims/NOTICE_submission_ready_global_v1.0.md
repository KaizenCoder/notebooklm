---
title: "Notice — Submission Ready (Récapitulatif des items DONE)"
doc_kind: notice
team: global
team_name: all
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

## Récapitulatif — Items DONE

- ID 1 — POST `/webhook/chat` (done)
  - Contrat, intégration, E2E; persistance messages; RPC `match_documents`.
  - Logs RAG + métriques; redaction Authorization.

- ID 3 — POST `/webhook/process-additional-sources` (multiple-websites) (done)
  - Fetch→upload `.txt`→indexation; idempotence; tests intégration et contrat.

- ID 4 — POST `/webhook/process-additional-sources` (copied-text) (done)
  - Upload `.txt`→indexation; idempotence; tests intégration et contrat.

- ID 10 — Logging & Errors (done)
  - Modèle d’erreur contractuel; `correlation_id` et `x-correlation-id`.
  - Redaction de secrets dans logs; évènements et métriques d’étapes (RAG/TTS/UPLOAD/CALLBACK, EXTRACT/EMBED/UPSERT).

## Preuves de tests (#TEST)
#TEST: orchestrator/test/contract/chat-integration.test.ts
#TEST: orchestrator/test/e2e/chat-edge-send.test.ts
#TEST: orchestrator/test/contract/additional-sources.test.ts
#TEST: orchestrator/test/contract/idempotency-additional-sources.test.ts
#TEST: orchestrator/test/integration/additional-sources-storage-db.test.ts
#TEST: orchestrator/test/contract/ready-error-shape.test.ts
#TEST: orchestrator/test/integration/logging-redaction.test.ts
#TEST: orchestrator/test/integration/process-document-step-logs.test.ts
#TEST: orchestrator/test/integration/generate-audio-step-logs.test.ts

## Observations de parité
- Contrats I/O conformes aux specs `docs/spec/*.yaml` et Edge Functions modèle.
- Évènements et métriques présents; redaction appliquée.

## Limitations
- Les endpoints non listés (ex. `process-document`, `generate-notebook-content`) sont en review/in-progress et ne sont pas couverts par ce récapitulatif DONE.
- La qualité sémantique de la conversion HTML→texte n’est pas évaluée (tests fonctionnels seulement).
- Le mode NO_MOCKS n’est pas dans le périmètre de cette notice (voir guide CI/NO_MOCKS).
