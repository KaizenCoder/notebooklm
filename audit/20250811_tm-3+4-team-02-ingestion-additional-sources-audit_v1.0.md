---
title: "Ingestion — additional-sources (AUDIT v1)"
doc_kind: audit
team: team-02
team_name: ingestion
tm_ids: [3, 4, 9]
scope: additional-sources
status: draft
version: 1.0
author: ia
related_files:
  - "claims/20250811_tm-2+9+16+15-team-02-ingestion-claim_v1.0.md"
  - "docs/spec/process-additional-sources.yaml"
  - "docs/ANNEXES_PAYLOADS.md"
  - "orchestrator/src/app.ts"
---

# Audit — additional-sources (Ingestion)

#TEST: orchestrator/test/contract/webhooks.test.ts

## Résumé (TL;DR)

- Objet de l’audit: vérifier la conformité de `POST /webhook/process-additional-sources` pour les deux variantes `copied-text` et `multiple-websites`.
- Décision: non conforme à la parité stricte (implémentation placeholder); acceptation impossible à ce stade pour clôture du chantier.
- Points bloquants: absence de stockage `.txt`, pas de traitement des URLs/HTML, pas d’indexation, pas de mise à jour `sources`.

## Références

- Claim associé: `claims/20250811_tm-2+9+16+15-team-02-ingestion-claim_v1.0.md`
- Spécifications: `docs/spec/process-additional-sources.yaml`
- Workflows originaux: `docs/clone/...`
- Annexes payloads: `docs/ANNEXES_PAYLOADS.md`

## Méthodologie

- Jeux d’essai: tests contractuels et charge utile d’exemples.
- Procédure: exécution `npm test`; inspection `app.ts` route additional-sources.
- Environnements/ENVs: `NOTEBOOK_GENERATION_AUTH`.

## Vérifications de parité

- HTTP (statuts, payloads, entêtes): 200 renvoyé; mais aucune logique réelle appliquée selon `type`.
- Side‑effects DB: non présents.
- Stockage (buckets, clés): non utilisés (absence d’upload `.txt`).
- Logs & erreurs: minimaux.

## Résultats

- Observations: réponse statique; pas de branchement `copied-text` vs `multiple-websites` réel.
- Écarts détectés: pas de stockage ni d’indexation; pas de mise à jour `sources`; pas de validations spécifiques.
- Captures/logs: voir `npm test` (cas de succès contractuel minimal).

## Recommandations & décisions

- Actions requises:
  - Implémenter `copied-text`: stockage `.txt`, update `sources`, indexation via pipeline.
  - Implémenter `multiple-websites`: fetch HTML→texte/markdown, stockage `.txt`, update `sources`, indexation.
  - Tests d’intégration dédiés (mocks Storage/DB) pour chaque variante.
- Acceptation conditionnelle / Refus: refus à ce stade pour parité stricte.

## Limitations

- Audit sans E2E complet Supabase local; basé sur tests contractuels et lecture du code.

## Suivi Task‑Master

- Tâches liées: 3, 4, 9, 19
- Commandes:
  - `task-master set-status --id=3.6 --status=in-progress`
  - `task-master set-status --id=4.6 --status=in-progress`

## Historique des versions

- v1.0: création de l’audit 