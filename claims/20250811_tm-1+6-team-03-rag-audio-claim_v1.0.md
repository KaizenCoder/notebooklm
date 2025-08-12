---
title: "Équipe 3 — RAG & Audio — Claims d’implémentation"
doc_kind: claim
team: team-03
team_name: rag-audio
tm_ids: [1, 6, 10, 15]
scope: chat|generate-audio|logging|idempotency
status: draft
version: 1.0
author: ia
related_files: []
---

# Équipe 3 — Claims d’Implémentation & Résultats de Tests

#TEST: orchestrator/test/contract/chat-contract-strict.test.ts
#TEST: orchestrator/test/contract/chat-integration.test.ts
#TEST: orchestrator/test/contract/chat-persist.test.ts
#TEST: orchestrator/test/contract/generate-audio.test.ts
#TEST: orchestrator/test/contract/webhooks.test.ts

## Contexte et Méthodologie

- Rôle: Implémenteur + Auditeur, Équipe 3 (RAG & Audio).
- Périmètre: `/webhook/chat` et `/webhook/generate-audio`.
- Gouvernance: Task‑Master OS (SPEC → IMPL → TEST → AUDIT), parité stricte.
- Source de vérité: `docs/spec/chat.yaml`, `docs/spec/generate-audio.yaml`, `docs/WEBHOOKS_MAPPING.md`.
- Méthode: test‑first contractuel (tsx), mocks d’adaptateurs (Supabase/Ollama/DB/Jobs), exécution locale offline.

## Implémentations réalisées

- Chat
  - Support strict du payload OpenAPI `{ session_id, message, user_id, timestamp }`.
  - Compatibilité maintenue avec `{ messages: [...] }`.
  - Appel RPC `match_documents(query, notebook_id)` et construction de `citations[]` compatibles schéma.
  - Persistance des 2 messages (user, assistant) via `db.insertMessage`.

- Generate‑audio
  - Réponse `202 Accepted`, démarrage job asynchrone.
  - Mise à jour statut `generating` → `completed` ou `failed`.
  - Mise à jour URL audio (mock) et callback HTTP `{ notebook_id, audio_url, status }`.

## Résultats de tests (extraits)

- Suite complète OK (toutes les assertions passent) :
  - `chat-contract-strict.test.ts`: 200 + shape conforme.
  - `chat-integration.test.ts`: 200 + données `data.output` présentes.
  - `chat-persist.test.ts`: 2 insertions (user + assistant).
  - `generate-audio.test.ts`: 202 + mises à jour DB.
  - `webhooks.test.ts`: statuts et shapes attendus (chat, process-document, generate-notebook, generate-audio, additional-sources).

## Extraits de logs pertinents

- Health/Ready: OK (vivacité/aptitude), modèles manquants gérés, probe GPU best‑effort.
- Auth: 401 sur header manquant/incorrect pour `/webhook/*`.
- Chat: logs d’avertissement tolérés sur `supabase.matchDocuments` en échec réseau (mock OK).

## Décisions & Parité

- Alignement strict chat: schéma OpenAPI respecté, compat étendue non bloquante.
- Generate‑audio: callback ajouté (best‑effort) conforme au mapping.
- Citations: format correct; enrichissement futur des `lines.from/to` prévu (mapping depuis metadata `documents`).

## Points ouverts (à tracer dans Task‑Master)

- Enrichir `citations.lines.from/to` en s’appuyant sur `metadata.loc.lines` (retrieval → mapping chunk).
- Ajouter tests d’erreurs stricts (400/422) pour `/webhook/chat` selon `openapi.yaml`.
- Implémenter mocks Storage/Coqui si couverture étendue requise.

## Reproductibilité

- Dossier: `orchestrator/`.
- Installation: `npm ci`.
- Exécution tests: `npm test`.
- Environnement: offline; `POSTGRES_DSN` optionnel (mocks DB intégrés aux tests).

## Preuves d’exécution

- Logs de réussite disponibles via la commande `npm test` (tous PASS).
- Fichiers de test référencés dans les lignes `#TEST:` ci‑dessus.

## Limitations

- Citations: lignes from/to minimales (0,0) pour le moment.
- Génération audio: synthèse simulée, pas de Storage réel ni Coqui.
- Callback: best‑effort (pas de retry/timeout avancé). 