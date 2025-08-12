---
title: "Audit Idempotence — Ingestion & Génération"
doc_kind: audit
team: team-03
team_name: rag-audio
tm_ids: [15]
scope: idempotence
status: draft
version: 1.0
author: ia
related_files: []
---

# Audit — Idempotency-Key (process-document, generate-audio)

#TEST: orchestrator/test/contract/*.test.ts

## Résumé (TL;DR)

- Objet de l’audit: Garantir l’absence de doublons via `Idempotency-Key` pour les opérations d’ingestion/génération.
- Décision: À implémenter (store TTL+fingerprint+statut; middleware sur routes concernées).
- Points bloquants: non câblé actuellement; risques de doublons.

## Références

- Guidelines: `docs/TECHNICAL_GUIDELINES.md`

## Méthodologie

- Jeux d’essai: replays contractuels (même payload + même Idempotency-Key).
- Procédure: design store mémoire/disque; vérif de fingerprint; réponses cohérentes.

## Vérifications de parité

- HTTP: replays retournent le même résultat (202/200) sans ré‑exécuter effets.
- DB: aucune duplication d’insertions (`documents`, `n8n_chat_histories`, `notebooks`).

## Résultats

- Observations: pas d’idempotence active.
- Écarts: duplication potentielle.

## Recommandations & décisions

- Actions requises: middleware idempotence + DAO stockage; tests replays; TTL cleanup.
- Acceptation: après tests replays verts et absence de doublons observables.

## Limitations

- Store persistant à définir (mémoire vs disque) selon contraintes locales.

## Suivi Task‑Master

- Tâches liées: 15.1 (SPEC), 15.2 (IMPL), 15.3 (TEST), 15.4 (AUDIT)
- Commandes:
  - `task-master set-status --id=15.1 --status=in-progress`

## Historique des versions

- v1.0: création du brouillon