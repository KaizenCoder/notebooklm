---
title: "Audit — tm-15 (RAG‑Audio Idempotency Closure)"
doc_kind: audit
team: team-03
team_name: rag-audio
author: AI-Auditeur
version: 1.4
status: review
tm_ids: [15]
scope: idempotency-closure
related_files:
  - orchestrator/src/app.ts
  - orchestrator/src/services/idempotency.ts
  - orchestrator/test/contract/idempotency.test.ts
  - orchestrator/test/contract/idempotency-additional-sources.test.ts
  - orchestrator/test/contract/idempotency-generate-audio.test.ts
---

## Résumé
- Couches d’idempotence en place (store TTL ~5 min) sur `process-document` (202), `process-additional-sources` (200) et `generate-audio` (202).
- Couverture tests présente pour `process-document` et `additional-sources`. Écarts identifiés pour `generate-audio` et la concurrence.

## Preuves (#TEST)
#TEST: orchestrator/test/contract/idempotency.test.ts
#TEST: orchestrator/test/contract/idempotency-additional-sources.test.ts
#TEST: orchestrator/test/contract/idempotency-generate-audio.test.ts

## Constat détaillé
- `process-document`: replays avec `Idempotency-Key` renvoient 202 cohérent, pas de doublons d’upsert.
- `process-additional-sources`: replays 200 cohérents, pas d’indexation multiple.
- `generate-audio`: fichier de test présent mais vide/incomplet au moment de l’audit; le comportement devrait refléter 202 et absence de double callback.
- Concurrence: l’audit v1.3 mentionne un test `idempotency-concurrency.test.ts` absent du dépôt.

## Limitations
- Store d’idempotence in‑memory (adapté local/dev). Si parité requiert persistance (Redis/DB), documenter et ajouter tests associés.
- Tests manquants:
  - `idempotency-generate-audio.test.ts`: cases replays 202 et no double‑effect (upload/update/callback).
  - `idempotency-concurrency.test.ts`: scénarios requêtes concurrentes même clé.

## Recommandations
- Compléter les tests manquants ci‑dessus avant de marquer la clôture comme définitive.
- Si un backend persistant est exigé, introduire un driver Redis/DB activable par env et couvrir par tests.
