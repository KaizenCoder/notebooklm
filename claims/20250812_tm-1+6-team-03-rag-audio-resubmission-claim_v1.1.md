---
title: "Dossier de Validation — Équipe 3 (RAG & Audio) — Resoumission"
doc_kind: claim
team: team-03
team_name: rag-audio
tm_ids: [1,6]
scope: submission
status: review
version: 1.1
author: ia
related_files:
  - orchestrator/test/contract
  - orchestrator/test/e2e
---

#TEST: orchestrator/test/contract/chat-integration.test.ts

## 1) Résumé

- Objet: resoumission après renforcement des tests d’intégration (chat loc.lines) et ajout E2E smoke Edge→orchestrateur.
- État: suite contractuelle + E2E smokes PASS (`npm run -s test:contract`, `npm run -s test:e2e`).

## 2) Claims inclus

- Chat — Parité stricte OpenAPI + persistance n8n_chat_histories
- Generate‑Audio — Parité stricte (TTS + upload + callback)

## 3) Éléments de preuve

- `npm run -s test:contract` → PASS
- `npm run -s test:e2e` → PASS

## 4) Modifications clés (depuis soumission v1.0)

- Test d’intégration citations loc.lines: `test/contract/chat-integration-loc-lines.test.ts` (PASS)
- Test E2E Edge→orchestrateur chat: `test/e2e/chat-edge-send.test.ts` (PASS)
- Scripts de test séparés (`package.json`): `test:contract`, `test:e2e`, `test`
- Addendum: `claims/20250812_tm-0-team-03-rag-audio-scripts-test-claim_v1.0.md`

## 5) Recommandations

- Étendre tests d’erreurs 400/422/500 (tâche 10.*)
- Câbler Idempotency-Key TTL/fingerprint + tests replays (tâche 15.*)

## Limitations
- Storage/TTS mocks en place (parité contractuelle); intégration des services réels selon infra locale.
