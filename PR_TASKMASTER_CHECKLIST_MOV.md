### Checklist Task‑Master (MOV)

- **15.2 IMPL: Middleware/DAO idempotence** → review
  - Fichiers: `orchestrator/src/app.ts`, `orchestrator/src/services/idempotency.ts`
  - #TEST: `orchestrator/test/contract/idempotency*.test.ts`
- **15.3 TEST: Replays sans doublons** → done
  - #TEST: `idempotency.test.ts`, `idempotency-additional-sources.test.ts`
- **19.2 IMPL: Ingestion texte + callbacks** → review
  - Fichiers: `orchestrator/src/app.ts`, `orchestrator/src/services/document.ts`
  - #TEST: `process-document-*.test.ts`, `additional-sources.test.ts`, `generate-audio-callback.test.ts`
- **10.x Logs minimaux + correlation_id** → review/done (selon sous‑tâche)
  - Fichiers: `orchestrator/src/app.ts`
  - #TEST: `logging-redaction.test.ts`, `process-document-step-logs.test.ts`, `generate-audio-step-logs.test.ts`
- **Hook no‑mocks & Anti‑mock** → done
  - Fichiers: `scripts/git-hooks/pre-push.ps1`, `ci/anti-mock-scan.ps1`, `ci/no-mocks-check.ps1`, `ci/local-ci.ps1`

Commandes proposées (si CLI présent):
- `task-master set-status --id 15 --sub 2 --status review`
- `task-master set-status --id 15 --sub 3 --status done`
- `task-master set-status --id 19 --sub 2 --status review`
- `task-master set-status --id 10 --sub 3 --status done`

Références claims:
- `claims/20250812_tm-15.2+15.3+19.2-team-01-foundations-mov-claim_v1.0.md`
- `claims/20250812_tm-19.3-team-01-foundations-additional-sources-mov-claim_v1.0.md`