---
title: "<titre court>"
doc_kind: audit
team: team-0x
team_name: <foundations|ingestion|rag-audio>
tm_ids: [<1>, <2.4>]
scope: <chat|process-document|additional-sources|generate-notebook-content|generate-audio|adapters|health|gpu-only|chunking|pdf-bridge|resilience|logging>
status: draft
version: 1.0
author: <ia|humain>
related_files: []
---

# Audit — <titre court>

#TEST: orchestrator/test/integration/*.test.ts

## Résumé (TL;DR)

- Objet de l’audit:
- Décision:
- Points bloquants:

## Références

- Claim associé: <lien vers claims/...>
- Spécifications: `docs/spec/...`
- Workflows originaux: `docs/clone/...`
- Annexes payloads: `docs/ANNEXES_PAYLOADS.md`

## Méthodologie

- Jeux d’essai:
- Procédure:
- Environnements/ENVs:

## Vérifications de parité

- HTTP (statuts, payloads, entêtes):
- Side‑effects DB (tables, RPC `match_documents`):
- Stockage (buckets, clés):
- Logs & erreurs (format contractuel):

## Résultats

- Observations:
- Écarts détectés:
- Captures/logs:

## Recommandations & décisions

- Actions requises:
- Acceptation conditionnelle / Refus:

## Limitations

- Cet audit ne modifie pas les contrats; il ne fait que constater l’écart par rapport à l’original.

## Suivi Task‑Master

- Tâches liées: <liste des IDs>
- Commandes:
  - `task-master set-status --id=<ID> --status=review`
  - `task-master set-status --id=<ID> --status=done`

## Historique des versions

- v1.0: création de l’audit 