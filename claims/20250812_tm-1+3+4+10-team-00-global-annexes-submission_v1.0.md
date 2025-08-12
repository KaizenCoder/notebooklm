---
title: "Annexes — Submission Ready (IDs 1,3,4,10)"
doc_kind: claim
team: team-00
team_name: global
version: 1.0
status: review
author: AI-Implementateur
tm_ids: [1, 3, 4, 10]
scope: submission
related_files:
  - claims/NOTICE_submission_ready_global_v1.0.md
  - claims/NOTICE_submission_ready_global_v1.1.md
---

## Tableau récapitulatif

| ID | Titre | Statut | Tests clés |
|---:|---|---|---|
| 1 | POST `/webhook/chat` | done | `chat-integration`, `chat-edge-send-e2e` |
| 3 | `/webhook/process-additional-sources` (websites) | done | `additional-sources`, `idempotency-additional-sources`, `additional-sources-storage-db` |
| 4 | `/webhook/process-additional-sources` (copied-text) | done | `additional-sources`, `idempotency-additional-sources`, `additional-sources-storage-db` |
| 10 | Logging & Errors | done | `ready-error-shape`, `logging-redaction`, `process-document-step-logs`, `generate-audio-step-logs`, `chat-llm-metrics` |

## Preuves (#TEST)
#TEST: orchestrator/test/contract/chat-integration.test.ts
#TEST: orchestrator/test/contract/additional-sources.test.ts
#TEST: orchestrator/test/contract/idempotency-additional-sources.test.ts
#TEST: orchestrator/test/integration/process-document-step-logs.test.ts
#TEST: orchestrator/test/integration/generate-audio-step-logs.test.ts

## Bundle de soumission (audit + specs)
- Audits:
  - `audit/20250812_tm-19-team-02-ingestion-audit_v1.0.md`
  - `audit/20250812_tm-19-team-02-ingestion-submission-ready-audit_v1.0.md`
  - `audit/20250812_tm-10-team-01-foundations-logging-submission-ready-audit_v1.0.md`
- Specs:
  - `docs/spec/openapi.yaml`
  - `docs/spec/process-document.yaml`
  - `docs/spec/process-additional-sources.yaml`

## Limitations
- Document de synthèse: renvoie vers les audits/sources pour détails; pas de métriques nouvelles ici.
