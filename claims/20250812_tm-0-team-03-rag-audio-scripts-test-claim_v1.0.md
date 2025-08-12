---
title: "Addendum — Scripts de test (contract vs e2e)"
doc_kind: claim
team: team-03
team_name: rag-audio
tm_ids: [0]
scope: scripts-test
status: draft
version: 1.0
author: ia
related_files:
  - orchestrator/package.json
  - orchestrator/test/contract
  - orchestrator/test/e2e
---

#TEST: orchestrator/test/contract/health.test.ts

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

## Limitations
- Document addendum interne; ne modifie pas les contrats.
