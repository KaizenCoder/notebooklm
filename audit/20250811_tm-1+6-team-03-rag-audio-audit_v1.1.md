---
title: "Audit Équipe 3 — RAG (Chat) & Audio"
doc_kind: audit
team: team-03
team_name: rag-audio
tm_ids: [1, 6, 10, 15]
scope: chat|generate-audio|logging|idempotency
status: draft
version: 1.1
author: ia
related_files:
  - "../claims/20250811_tm-1-team-03-rag-audio-chat-claim_v1.0.md"
  - "../claims/20250811_tm-6-team-03-rag-audio-generate-audio-claim_v1.0.md"
---

# Audit Équipe 3 — RAG (Chat) & Audio

Statut: en cours
Responsable: Auditeur Équipe 3
Date: 2025-08-11

## Portée
- POST /webhook/chat (RAG + citations + persistance historique)
- POST /webhook/generate-audio (TTS + stockage + callback)

## Résumé exécutif
- Tests contrat/intégration actuels: PASS.
- Écarts parité à corriger pour conformité stricte avec l’original:
  - Persistance chat: utiliser `n8n_chat_histories` et le shape attendu (2 lignes: user/assistant).
  - Citations: retourner des citations structurées par chunk, avec lignes `loc.lines.from/to` et `source_id`.
  - generate-audio: implémenter le flux complet (Coqui TTS, upload, mises à jour `notebooks`, callback Edge) plutôt que 202 simple.
  - Idempotence: supporter `Idempotency-Key` pour les opérations d’ingestion/génération.
  - Erreurs: réponses uniformisées `{ code, message, details?, correlation_id }` conformément à `docs/spec/openapi.yaml`.

## Constats détaillés
- Chat
  - Persistance: `src/services/db.ts` écrit dans `messages` (placeholder). Attendu: table `n8n_chat_histories` (parité amont) avec structure JSON conforme.
  - Citations: handler construit `citations` à partir de `match_documents` mais sans mapping précis vers `loc.lines.*`. Attendu: mapping explicite des lignes issues du chunking.
- Generate-audio
  - Handler renvoie 202 sans pipeline TTS, ni upload, ni callback.
- Cross-cutting
  - Idempotence absente (ingestion/génération)
  - Schéma d’erreurs et `correlation_id` non uniformisés

## Recommandations
1) Chat
   - SPEC: documenter le schéma `n8n_chat_histories` et le mapping citations attendu.
   - IMPL: écrire 2 entrées (user/assistant) dans `n8n_chat_histories`; construire `citations` à partir des chunks (incluant `source_id` et `loc.lines`)
   - TEST: assertions DB + structure de citations; cas « je ne sais pas ».
   - AUDIT: parité vs original (payloads et side-effects DB)
2) Generate-audio
   - SPEC: contrat I/O + callback (Edge) + champs `audio_overview_url`, statut.
   - IMPL: adapter Coqui TTS + upload bucket `audio` + mises à jour `notebooks` + callback.
   - TEST: callback + URL audio + transitions de statut.
   - AUDIT: parité complète.
3) Idempotence & Erreurs
   - SPEC: sémantique `Idempotency-Key` + modèle d’erreurs commun.
   - IMPL: middleware idempotence + middleware erreurs avec `correlation_id`.
   - TEST: replays sans duplication; erreurs contractuelles.
   - AUDIT: conformité.

## Impacts
- Modifications ciblées dans `orchestrator/src/app.ts`, `src/services/db.ts`, `src/services/document.ts`, et ajout/adaptation d’adaptateurs Storage/Coqui.
- Ajustements tests d’intégration et éventuels fixtures d’audit.

## Limites & risques
- Dépendances sur chunking/metadata (`loc.lines.*`) et RPC `match_documents` (précision citations) — attention à la cohérence avec l’indexation.
- Coût VRAM et performance TTS locale selon modèle (profil matériel requis).

## Actions pilotées par .taskmaster
- Création de sous-tâches SPEC/IMPL/TEST/AUDIT dédiées (voir `.taskmaster/tasks/tasks.json`).

#TEST: orchestrator/test/contract/chat-integration.test.ts
#TEST: orchestrator/test/contract/webhooks.test.ts
#TEST: orchestrator/test/contract/generate-notebook-job.test.ts
#TEST: orchestrator/test/contract/process-document-job.test.ts

## Limitations
- Le présent audit s’appuie sur les tests locaux actuels (PASS) mais n’inclut pas encore d’E2E avec Edge Functions réelles et stockage local; ces vérifications seront ajoutées dans les tâches TEST/AUDIT correspondantes. 