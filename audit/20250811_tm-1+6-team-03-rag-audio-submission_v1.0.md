---
title: "Soumission — Équipe 3 (RAG & Audio)"
doc_kind: submission
team: team-03
team_name: rag-audio
tm_ids: [1, 6]
scope: chat|generate-audio
status: draft
version: 1.0
author: ia
related_files:
  - "claims/20250811_tm-1-team-03-rag-audio-chat-claim_v1.0.md"
  - "claims/20250811_tm-6-team-03-rag-audio-generate-audio-claim_v1.0.md"
---

# Soumission à Audit — Équipe 3 (RAG & Audio)

#TEST: orchestrator/test/contract/health.test.ts
#TEST: orchestrator/test/contract/ready.test.ts
#TEST: orchestrator/test/contract/ready-failures.test.ts
#TEST: orchestrator/test/contract/auth.test.ts
#TEST: orchestrator/test/contract/webhooks.test.ts
#TEST: orchestrator/test/contract/chat-contract-strict.test.ts
#TEST: orchestrator/test/contract/chat-integration.test.ts
#TEST: orchestrator/test/contract/chat-persist.test.ts
#TEST: orchestrator/test/contract/generate-notebook-job.test.ts
#TEST: orchestrator/test/contract/process-document-job.test.ts
#TEST: orchestrator/test/contract/document-embeddings.test.ts
#TEST: orchestrator/test/contract/process-document-status.test.ts
#TEST: orchestrator/test/contract/generate-audio.test.ts

## 1) Résumé

- Objet: soumission à audit des correctifs Équipe 3 sur `/webhook/chat` et `/webhook/generate-audio`.
- Couverture: parité stricte (payloads/headers/codes), persistance chat, citations, génération audio asynchrone avec callback et idempotence.
- État tests: `npm test` → SUITE VERTE (tous les tests contractuels passants).

## 2) Claims inclus

- Chat — Parité stricte OpenAPI + persistance n8n_chat_histories
  - Fichier: `claims/20250811_tm-1-team-03-rag-audio-chat-claim_v1.0.md`
- Generate‑Audio — Parité stricte (TTS + upload + callback)
  - Fichier: `claims/20250811_tm-6-team-03-rag-audio-generate-audio-claim_v1.0.md`

## 3) Éléments de preuve

- Exécution locale:
  - Dossier: `orchestrator/`
  - Installation: `npm ci`
  - Exécution: `npm test`
- Résultat: tous les tests listés en tête (`#TEST:`) passent.

## 4) Modifications clés (chemins)

- `orchestrator/src/app.ts`: routes `/webhook/chat`, `/webhook/generate-audio`, idempotence, error handler, ready.
- `orchestrator/src/services/db.ts`: `insertChatHistory`, `updateNotebookStatus`, `setNotebookAudio`, `upsertDocuments`.
- `orchestrator/src/services/document.ts`: chunking + embeddings (mock/ollama), upsert docs.
- `orchestrator/src/services/ollama.ts`: chat/embeddings.
- `orchestrator/src/services/supabase.ts`: RPC `match_documents`.
- `orchestrator/src/services/audio.ts`: synthèse (mock).
- `orchestrator/src/services/storage.ts`: upload (mock) + URL.

## 5) Conformité & critères d’acceptation (extraits)

- Chat (CA1–CA3) — voir claim chat
- Generate‑Audio (CA1–CA4) — voir claim generate‑audio

## 6) Points ouverts (déjà tracés dans Task‑Master)

- Parité DB stricte sur table `n8n_chat_histories` (structure exacte du schéma d’origine).
- Citations: validation précise des `lines.from/to` sur un set d’oracles.
- Generate‑Audio: intégration d’un vrai Storage local (URL signées) et moteur TTS local (Coqui) si exigé par l’environnement cible.
- Middleware d’erreurs: généralisation à toutes les routes et cas d’échec (400/422/500) avec messages contractuels.

## 7) Suivi Task‑Master (exécution)

- Chat: sous‑tâche `1.5` → status: review
  - commandes: `task-master set-status --id=1.5 --status=review`
- Generate‑Audio: sous‑tâche `6.4` → status: in-progress (prêt pour review à validation de ce dossier)
  - commandes: `task-master set-status --id=6.4 --status=review`

## 8) Reproductibilité & logs

- Lancement: `cd orchestrator && npm test`
- Les logs Fastify indiquent les statuts HTTP et la vivacité/aptitude.

## Limitations

- Ce dossier ne modifie pas la portée fonctionnelle; il documente la parité avec l’original.
- Les mocks (TTS/Storage) sont destinés aux tests contractuels; l’intégration des services réels est prévue selon l’environnement local cible. 