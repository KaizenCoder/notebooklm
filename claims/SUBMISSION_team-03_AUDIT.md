---
title: "Dossier de Validation — Équipe 3 (RAG & Audio) — Resoumission"
doc_kind: submission
team: team-03
team_name: rag-audio
version: 1.1
author: ia
related_claims:
  - claims/CLAIM_team-03_chat_parite_stricte.md
  - claims/CLAIM_team-03_generate-audio_parite_stricte.md
related_addenda:
  - claims/ADDENDUM_team-03_scripts_test.md
---

# Dossier de Validation — Équipe 3 (RAG & Audio) — Resoumission

#TEST: orchestrator/test/contract/*.test.ts
#TEST: orchestrator/test/e2e/*.test.ts

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
- Addendum: `claims/ADDENDUM_team-03_scripts_test.md`

## 5) Recommandations

- Étendre tests d’erreurs 400/422/500 (tâche 10.*)
- Câbler Idempotency-Key TTL/fingerprint + tests replays (tâche 15.*)

## 6) Limitations

- Storage/TTS mocks en place (parité contractuelle); intégration des services réels selon infra locale.

## 7) Suivi Task‑Master

- 1.5 (chat IMPL): review — prêt pour validation
- 6.4 (generate‑audio IMPL): review — prêt pour validation
- 1.2 (chat IT): in-progress — livrable présent; bascule en review sur validation
- 1.3 (chat E2E): in-progress — livrable présent; bascule en review sur validation
