---
title: "Release Notes v1.3 — Équipe 3 (RAG & Audio)"
version: 1.3
author: ia
status: released
---

# Release Notes — v1.3 (Team 03)

#TEST: orchestrator/test/contract/*.test.ts
#TEST: orchestrator/test/e2e/*.test.ts

## TL;DR
- Chat (tâche 1): parité stricte atteinte (citations loc.lines, persistance) — done.
- Generate‑audio (tâche 6): 202 + job + upload mock + MAJ notebook + callback — done.
- Logging/Erreurs (tâche 10): ErrorResponse uniforme + `x-correlation-id` + tests — done.
- Idempotence (tâche 15): middleware/DAO + replays identiques + concurrence — done.

## Points clés
- Nouveaux tests: `errors-assertions.test.ts`, `idempotency-concurrency.test.ts`, `idempotency-additional-sources.test.ts`.
- Scripts de vérification: `npm run -s test:contract` et `npm run -s test:e2e` — PASS.

## Changes
- Docs/audits: ajout des audits v1.3 (logging/erreurs, idempotence) et des claims de soumission v1.3.
- Code: normalisation erreurs + header `x-correlation-id`; renfort Idempotency‑Key sur routes ingestion/génération.

## Breaking changes
- Aucun.

## Comment vérifier
- Depuis `orchestrator/`: exécuter `npm run -s test:contract && npm run -s test:e2e`.

## Limitations
- Exécutions locales; journaux complets non joints. Les lignes `#TEST:` ci‑dessus pointent vers les preuves reproductibles.
