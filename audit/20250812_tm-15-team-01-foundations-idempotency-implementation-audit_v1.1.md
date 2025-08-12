---
title: "Task 15 — Idempotency — Audit (implementation)"
doc_kind: audit
team: team-01
team_name: foundations
tm_ids: [15]
scope: idempotency
status: passed
version: 1.1
author: AI-Auditeur
related_files:
  - orchestrator/src/services/idempotency.ts
  - orchestrator/src/app.ts
  - orchestrator/test/contract/idempotency.test.ts
  - orchestrator/test/contract/idempotency-additional-sources.test.ts
  - orchestrator/test/contract/idempotency-generate-audio.test.ts
  - orchestrator/test/contract/idempotency-concurrency.test.ts
---

#TEST: orchestrator/test/contract/idempotency.test.ts
#TEST: orchestrator/test/contract/idempotency-additional-sources.test.ts
#TEST: orchestrator/test/contract/idempotency-generate-audio.test.ts
#TEST: orchestrator/test/contract/idempotency-concurrency.test.ts

## Résumé
- Store d'idempotence avec TTL, `begin/get/complete` et gating pour éviter doubles effets en concurrence.
- Couverture sur `/webhook/process-document`, `/process-additional-sources`, `/generate-audio`.

## Points de parité clés
- Relecture du cache si `begin()` retourne `false` (concurrence), retour de la même réponse 202/200/422 selon le cas.

## Preuves (#TEST)
- `#TEST: orchestrator/test/contract/idempotency.test.ts`
- `#TEST: orchestrator/test/contract/idempotency-additional-sources.test.ts`
- `#TEST: orchestrator/test/contract/idempotency-generate-audio.test.ts`
- `#TEST: orchestrator/test/contract/idempotency-concurrency.test.ts`
- Code: `orchestrator/src/services/idempotency.ts`, `orchestrator/src/app.ts`

## Limitations
- Store en mémoire (process unique); pour déploiements distribués, utiliser un backend partagé (Redis).

## Recommandations
- Ajouter persistance Redis + clé de namespacing par route.

## Historique des versions
- v1.1: Ajout test de concurrence et gating `begin()`; vert sur toute la suite.
