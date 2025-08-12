---
title: "Notice — Submission Ready (Récapitulatif des items DONE)"
doc_kind: notice
team: global
team_name: all
version: 1.1
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

## Tableau récapitulatif

| ID | Titre | Statut | Tests clés |
|---:|---|---|---|
| 1 | POST `/webhook/chat` | done | `chat-integration`, `chat-edge-send-e2e` |
| 3 | `/webhook/process-additional-sources` (websites) | done | `additional-sources`, `idempotency-additional-sources`, `additional-sources-storage-db` |
| 4 | `/webhook/process-additional-sources` (copied-text) | done | `additional-sources`, `idempotency-additional-sources`, `additional-sources-storage-db` |
| 10 | Logging & Errors | done | `ready-error-shape`, `logging-redaction`, `process-document-step-logs`, `generate-audio-step-logs`, `chat-llm-metrics` |

## Détail (inchangé vs v1.0)

- Voir `NOTICE_submission_ready_global_v1.0.md` pour le contenu narratif, preuves `#TEST` et Limitations.

## Bundle de soumission (fichiers à joindre)

- Audits:
  - `audit/20250812_tm-19-team-02-ingestion-audit_v1.0.md`
  - `audit/20250812_tm-19-team-02-ingestion-submission-ready-audit_v1.0.md`
  - `audit/20250812_tm-10-team-01-foundations-logging-submission-ready-audit_v1.0.md`
- Notice globale:
  - `claims/NOTICE_submission_ready_global_v1.0.md`
  - `claims/NOTICE_submission_ready_global_v1.1.md`
- Référence specs:
  - `docs/spec/openapi.yaml`
  - `docs/spec/process-document.yaml`
  - `docs/spec/process-additional-sources.yaml`

## Limitations
- Identiques à v1.0 (voir le fichier correspondant).
