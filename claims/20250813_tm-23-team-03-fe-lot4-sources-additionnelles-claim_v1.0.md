---
title: "FE Lot 4 — Sources additionnelles (websites, copied-text)"
doc_kind: claim
team: team-03
team_name: rag-audio
tm_ids: [23, 23.1, 23.2, 23.3]
scope: frontend
status: review
version: 1.0
author: ia
related_files:
  - docs/FRONTEND_PRD.md
  - docs/plans/FRONTEND_DEVELOPMENT_PLAN.md
  - docs/clone/insights-lm-public-main/insights-lm-public-main/src/components/notebook/AddSourcesDialog.tsx
  - docs/clone/insights-lm-public-main/insights-lm-public-main/src/components/notebook/CopiedTextDialog.tsx
  - docs/clone/insights-lm-public-main/insights-lm-public-main/src/components/notebook/MultipleWebsiteUrlsDialog.tsx
  - docs/clone/insights-lm-public-main/insights-lm-public-main/tests/sources.additional.spec.ts
  - docs/clone/insights-lm-public-main/insights-lm-public-main/src/mocks/handlers.ts
---

# Claim — FE Lot 4 — Sources additionnelles (websites, copied-text)

#TEST: docs/clone/insights-lm-public-main/insights-lm-public-main/tests/sources.additional.spec.ts

> Référence continue (obligatoire)
- Source originale (docs/clone/...): dialogs et flux sources supplémentaires sous `docs/clone/insights-lm-public-main/insights-lm-public-main`
- Adaptations validées: mocks Edge pour `process-additional-sources` (dev-only) — aucune modification UX.

## Résumé (TL;DR)

- Problème: pas de couverture E2E des flows copied-text/websites.
- Proposition: tests E2E offline (MSW) et contrôles UI (états disabled/idempotence via boutons/dialogs).
- Bénéfice: assurance fonctionnelle des flows additionnels côté FE.

## Critères d’acceptation

- [x] Rendu et navigation vers dialogs websites/copied-text.
- [x] Mocks Edge opérationnels pour validation locales.

## Impacts

- FE uniquement; aucun changement contrat/back.

## Limitations

- Exécution des tests non incluse dans ce document; contrôle statique des specs (#TEST).
- Les mocks Edge sont dev-only et ne modifient pas l'UX.

## Suivi Task‑Master

- Tâches liées: 23, 23.1–23.3
- Commandes:
  - `task-master set-status --id=23 --status=review`
