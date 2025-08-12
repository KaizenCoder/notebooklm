---
title: "Addendum — Scripts de test (contract vs e2e)"
doc_kind: addendum
team: team-03
team_name: rag-audio
version: 1.0
author: ia
related:
  - claims/SUBMISSION_team-03_AUDIT.md
---

#TEST: orchestrator/test/contract/*.test.ts
#TEST: orchestrator/test/e2e/*.test.ts

## Scripts ajoutés

- `npm run test:contract` — exécute uniquement les tests contractuels/intégration
- `npm run test:e2e` — exécute les smokes E2E (Edge → orchestrateur)
- `npm test` — enchaîne contractuels puis E2E

## Motivation

- Séparer les cibles pour accélérer l’itération et permettre des exécutions ciblées en CI.

## Utilisation

- `cd orchestrator`
- `npm run -s test:contract`
- `npm run -s test:e2e`
