---
title: "Task 10 — Logging & Errors — Audit (implementation)"
doc_kind: audit
team: team-01
team_name: foundations
tm_ids: [10]
scope: logging-errors
status: passed
version: 1.1
author: AI-Auditeur
related_files:
  - orchestrator/src/app.ts
  - orchestrator/test/contract/logging-redaction.test.ts
  - orchestrator/test/contract/logging-sampling.test.ts
  - orchestrator/test/contract/ready-error-shape.test.ts
  - orchestrator/test/contract/correlation-id-on-errors.test.ts
---

#TEST: orchestrator/test/contract/logging-redaction.test.ts
#TEST: orchestrator/test/contract/logging-sampling.test.ts
#TEST: orchestrator/test/contract/ready-error-shape.test.ts
#TEST: orchestrator/test/contract/correlation-id-on-errors.test.ts

## Résumé
- Logs JSON structurés, redaction `Authorization`, sampling contrôlé (`LOG_SAMPLE_PCT`).
- Gestion d'erreurs uniformisée avec codes (`GPU_REQUIRED`, `UNAUTHORIZED`, etc.).

## Points de parité clés
- Hook `onResponse` samplé (erreurs ≥400 toujours loggées).
- `x-correlation-id` sur les réponses et propagation dans callbacks.

## Preuves (#TEST)
- `#TEST: orchestrator/test/contract/logging-redaction.test.ts`
- `#TEST: orchestrator/test/contract/logging-sampling.test.ts`
- `#TEST: orchestrator/test/contract/ready-error-shape.test.ts`
- `#TEST: orchestrator/test/contract/correlation-id-on-errors.test.ts`
- Code: `orchestrator/src/app.ts`

## Limitations
- Sampling pseudo-aléatoire non déterministe; prévoir seed en mode debug si besoin.

## Recommandations
- Exporter des métriques de latence par route via un collecteur dédié.

## Historique des versions
- v1.1: Ajout des métriques LLM et logs d'étapes audio; conformité confirmée.
