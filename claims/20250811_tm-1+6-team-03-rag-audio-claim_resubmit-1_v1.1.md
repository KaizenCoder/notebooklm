---
title: "Équipe 3 — RAG & Audio — Ré‑soumission"
doc_kind: claim
team: team-03
team_name: rag-audio
tm_ids: [1, 6, 10, 15]
scope: chat|generate-audio|logging|idempotency
status: draft
version: 1.1
author: ia
related_files:
  - "./20250811_tm-1-team-03-rag-audio-chat-claim_v1.0.md"
  - "./20250811_tm-6-team-03-rag-audio-generate-audio-claim_v1.0.md"
---

# Équipe 3 — Dossier de Ré‑soumission (Chat & Generate‑Audio)

#TEST: orchestrator/test/contract/chat-contract-strict.test.ts
#TEST: orchestrator/test/contract/chat-integration.test.ts
#TEST: orchestrator/test/contract/chat-persist.test.ts
#TEST: orchestrator/test/contract/generate-audio.test.ts
#TEST: orchestrator/test/contract/webhooks.test.ts

## Correctifs appliqués (suite audit)

- Chat (strict OpenAPI)
  - Utilisation effective du payload `{ session_id, message, user_id, timestamp }`.
  - Persistance dans `n8n_chat_histories` via `db.insertChatHistory` (fallback vers `insertMessage`).
  - Citations enrichies: récupération `loc.lines.from/to` depuis `metadata` des matches RPC.

- Generate‑audio
  - Job asynchrone: statut `generating` → `completed|failed`.
  - Mise à jour `audio_url` (mock) et callback HTTP `{ notebook_id, audio_url, status }`.

- Erreurs (début d’alignement)
  - Préparation middleware de réponse d’erreur standard `{ code, message, details?, correlation_id }` (utilisation progressive planifiée sur routes principales).

- Idempotence
  - Création d’un store en mémoire (prototype) pour `Idempotency-Key` (prêt à câbler sur ingestion/génération).

## Preuves — Exécution tests

- `npm test`: suite verte, incluant `chat-contract-strict`, `generate-audio`, `chat-persist`, `webhooks`.

## Points restants (prochain incrément)

- Généraliser le middleware d’erreurs (400/422/500) à toutes les routes `/webhook/*`.
- Activer `Idempotency-Key` sur `/webhook/process-document` et `/webhook/generate-audio` (lecture → cache → replay 202).
- Mocker Storage/Coqui si extension des tests d’intégration.

## Méthodologie

- Test‑first contractuel, corrections incrémentales gardant la suite verte à chaque étape.
- Parité stricte visée avec les repos de référence; compat maintenue lorsque non‑bloquante. 

## Limitations

- Ce document n’introduit aucune exigence hors parité avec l’original.
- Les métriques chiffrées sont indicatives et non contractuelles. 