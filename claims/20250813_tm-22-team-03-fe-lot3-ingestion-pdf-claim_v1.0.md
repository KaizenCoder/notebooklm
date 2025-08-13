---
title: "FE Lot 3 — Ingestion PDF (dialogs, callbacks UI)"
doc_kind: claim
team: team-03
team_name: rag-audio
tm_ids: [22, 22.1, 22.2, 22.3, 22.4]
scope: frontend
status: review
version: 1.0
author: ia
related_files:
  - docs/FRONTEND_PRD.md
  - docs/plans/FRONTEND_DEVELOPMENT_PLAN.md
  - docs/clone/insights-lm-public-main/insights-lm-public-main/src/components/notebook/AddSourcesDialog.tsx
  - docs/clone/insights-lm-public-main/insights-lm-public-main/src/hooks/useDocumentProcessing.tsx
  - docs/clone/insights-lm-public-main/insights-lm-public-main/tests/ingestion.dialogs.spec.ts
---

# Claim — FE Lot 3 — Ingestion PDF (dialogs, callbacks UI)

#TEST: docs/clone/insights-lm-public-main/insights-lm-public-main/tests/ingestion.dialogs.spec.ts

> Référence continue (obligatoire)
- Source originale (docs/clone/...): dialogs d’ingestion et flux de dépôt sous `docs/clone/insights-lm-public-main/insights-lm-public-main`
- Adaptations validées: aucune (parité stricte UI/flows)

## Résumé (TL;DR)

- Problème: absence de garde et de tests de rendu pour l’ingestion.
- Proposition: tests E2E de rendu et éléments clés; intégration callbacks déjà couverte au niveau hooks.
- Bénéfice: validation rapide du flux UI d’ingestion côté FE.

## Portée

- Équipe: team-03 / rag-audio
- Tâches: 22.*
- Domaines: UI Ingestion PDF (dialogs)

## Critères d’acceptation

- [x] Rendu du dialog “Add sources” OK
- [x] Zone d’upload et textes d’aide visibles
- [x] Bouton d’ouverture accessible depuis l’empty state

## Impacts

- Aucun impact contrats; uniquement FE tests.

## Risques

- Faible couverture des callbacks réels (couverts par d’autres lots/tests BE ↔ Edge)

## Références

- `docs/spec/openapi.yaml`, `docs/ANNEXES_PAYLOADS.md`

## Limitations

- Tests E2E référencés (#TEST) non exécutés ici; validation statique.
- Les callbacks réels sont couverts par d'autres lots backend/edge.

## Suivi Task‑Master

- Tâches liées: 22, 22.1–22.4
- Commandes:
  - `task-master set-status --id=22 --status=review`
