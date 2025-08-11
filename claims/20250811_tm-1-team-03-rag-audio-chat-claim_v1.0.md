---
title: "Chat — Parité stricte OpenAPI + persistance n8n_chat_histories"
doc_kind: claim
team: team-03
team_name: rag-audio
tm_ids: ["1", "1.4", "1.5", "1.6", "1.7"]
scope: chat
status: draft
version: 1.0
author: ia
related_files:
  - orchestrator/src/app.ts
  - orchestrator/src/services/db.ts
  - orchestrator/src/services/supabase.ts
  - docs/spec/chat.yaml
  - docs/WEBHOOKS_MAPPING.md
---

# Claim — Chat — Parité stricte OpenAPI + persistance n8n_chat_histories

#TEST: orchestrator/test/contract/chat-contract-strict.test.ts
#TEST: orchestrator/test/contract/chat-integration.test.ts
#TEST: orchestrator/test/contract/chat-persist.test.ts

## Résumé (TL;DR)

- Problème constaté: écart de parité sur le chat (payload strict OpenAPI partiellement exploité, persistance générique au lieu de `n8n_chat_histories`, citations incomplètes).
- Proposition succincte: prioriser le payload strict `{ session_id, message, user_id, timestamp }`, persister les 2 messages dans `n8n_chat_histories`, enrichir `citations.lines.from/to` depuis les métadonnées des chunks retournés par le retrieval.
- Bénéfice attendu: conformité 1:1 avec l’original (compat Edge Functions), stabilité des intégrations et traçabilité des échanges.

## Contexte

- Contexte fonctionnel/technique: le frontend appelle l’Edge Function `send-chat-message` qui relaie vers l’orchestrateur `/webhook/chat`. La parité exige un payload strict (OpenAPI), une persistance d’historique compatible (table `n8n_chat_histories`) et des citations exploitables (mapping lignes depuis les chunks).
- Références: `docs/spec/chat.yaml`, `docs/WEBHOOKS_MAPPING.md`, `docs/ANNEXES_PAYLOADS.md`, `docs/clone/...`

## Portée et périmètre (scope)

- Équipe: team-03 / rag-audio
- Tâches Task‑Master visées: 1 (et sous‑tâches 1.4 SPEC, 1.5 IMPL, 1.6 TEST, 1.7 AUDIT)
- Endpoints/domaines: chat

## Demande et motivation

- Description détaillée de la revendication:
  - Le handler `/webhook/chat` doit lire en priorité le payload strict OpenAPI `{ session_id, message, user_id, timestamp }` et ne tomber en compat `{ messages: [...] }` qu’en fallback.
  - Persister systématiquement 2 entrées dans `n8n_chat_histories` (user, assistant) avec les champs attendus (incluant `user_id`, `timestamp`).
  - Construire `citations[]` dont `lines.from/to` proviennent de `metadata.loc.lines` des documents retournés par la RPC `match_documents`.
- Justification (parité, bug, dette, conformité, performance, sécurité): parité stricte avec l’implémentation d’origine; évite les écarts de structure et garantit la compatibilité FE/Edge.

## Critères d’acceptation

- [ ] CA1: une requête strict OpenAPI retourne 200 avec `data.output[0].text` et `citations[]` remplies; `session_id`/`user_id`/`timestamp` pris en compte.
- [ ] CA2: 2 lignes sont créées dans `n8n_chat_histories` (user, assistant) avec les champs conformes.
- [ ] CA3: `citations[].lines.from/to` correspondent aux bornes `metadata.loc.lines` du chunk référencé.

## Impacts

- API/Contrats I/O: aucune modification des contrats; stricte application.
- Code & modules: `orchestrator/src/app.ts` (route chat), `orchestrator/src/services/db.ts` (DAO chat histories), `orchestrator/src/services/supabase.ts` (RPC retrieval).
- Schéma/DB/Storage: utilisation de `n8n_chat_histories` (existant dans la migration fournie par le projet original).
- Performance/latences: inchangées; traitement local minimal.
- Sécurité/compliance: inchangées; header Authorization déjà requis.

## Risques et alternatives

- Risques: divergence de schéma côté base si la table n’est pas provisionnée localement.
- Atténuations: vérifier la migration du package original et adapter le DAO si besoin (flags sur environnements mockés).
- Alternatives évaluées: persistance générique (refusée pour parité stricte).

## Références

- Spécifications: `docs/spec/chat.yaml`
- Workflows originaux: `docs/clone/...`
- Annexes payloads: `docs/ANNEXES_PAYLOADS.md`

## Limitations

- Ce document n’introduit aucune exigence hors parité avec l’original.
- Les métriques chiffrées sont indicatives et non contractuelles.

## Suivi Task‑Master

- Tâches liées: 1, 1.4, 1.5, 1.6, 1.7
- Commandes:
  - `task-master set-status --id=1.5 --status=in-progress`
  - `task-master set-status --id=1.5 --status=review`

## Historique des versions

- v1.0: création du claim 