---
title: "Audit Idempotence — Ingestion & Génération (v1.1)"
doc_kind: audit
team: team-03
team_name: rag-audio
tm_ids: [15]
scope: idempotency
status: review
version: 1.1
author: ia
related_files:
  - orchestrator/src/app.ts
  - orchestrator/src/services/idempotency.ts
  - orchestrator/src/env.ts
  - orchestrator/test/contract/idempotency.test.ts
  - orchestrator/test/contract/idempotency-additional-sources.test.ts
  - orchestrator/test/contract/idempotency-generate-audio.test.ts
---

#TEST: orchestrator/test/contract/idempotency.test.ts

# Audit — Idempotency-Key (process-document, additional-sources, generate-audio)

## Résumé

- Idempotence implémentée via en-tête `Idempotency-Key` avec store mémoire TTL configurable (`IDEMPOTENCY_TTL_MS`).
- Couverture sur les endpoints: `/webhook/process-document`, `/webhook/process-additional-sources` (copied-text, multiple-websites), `/webhook/generate-audio`.
- Replays retournent la même réponse (202/200) sans ré-exécuter d'effets (retraitement/enqueue).

## Méthodologie

- Replays contractuels (même payload + même `Idempotency-Key`).
- Vérification d'absence de double traitement (compteur d'appels/queues instrumenté dans tests).
- Validation statuts et corps strictement identiques entre 1er et 2e appel.

## Résultats (evidence)

- Tests PASS:
  - `test/contract/idempotency.test.ts` (process-document, 202 stable)
  - `test/contract/idempotency-additional-sources.test.ts` (copied-text, 200 stable, 1 seul traitement)
  - `test/contract/idempotency-generate-audio.test.ts` (202 stable, 1 seul enqueue)

## Implémentation

- `createIdempotencyStore(ttlMs)` (in-memory, sweep périodique par accès, champs: done, response, ts).
- Intégré dans handlers:
  - Lookup early → court-circuit si réponse en cache.
  - `begin(key)` puis `complete(key, { statusCode, body })` au retour.
- TTL configurable via `IDEMPOTENCY_TTL_MS` (optionnel).

## Limitations et suites

- Store mémoire non partagé (single-process). Pour multi-réplica, prévoir persistance (Redis/DB) avec fingerprint requête.
- Fingerprint/lock conservateurs à envisager si charge concurrente élevée.

## Conclusion

- Parité d’idempotence atteinte pour les opérations d’ingestion/génération cibles. Prêt pour revue.
