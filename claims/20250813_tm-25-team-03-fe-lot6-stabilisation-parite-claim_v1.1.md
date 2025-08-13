---
title: "FE Lot 6 — Stabilisation & Parité finale (Addendum A11y/Preflight)"
doc_kind: claim
team: team-03
team_name: rag-audio
tm_ids: [25]
scope: frontend
status: review
version: 1.1
author: ia
related_files:
  - docs/clone/insights-lm-public-main/insights-lm-public-main/src/components/ui/SkipLink.tsx
  - docs/clone/insights-lm-public-main/insights-lm-public-main/src/pages/Notebook.tsx
  - docs/clone/insights-lm-public-main/insights-lm-public-main/src/components/ui/DevBanner.tsx
  - docs/clone/insights-lm-public-main/insights-lm-public-main/src/pages/Preflight.tsx
  - docs/clone/insights-lm-public-main/insights-lm-public-main/docs/ACCESSIBILITY_README.md
  - docs/clone/insights-lm-public-main/insights-lm-public-main/docs/REAL_MODE_CHECKLIST.md
---

# Claim — FE Lot 6 — Stabilisation & Parité finale (Addendum A11y/Preflight)

#TEST: docs/clone/insights-lm-public-main/insights-lm-public-main/tests/chat.a11y.spec.ts

> Référence continue (obligatoire)
- Source originale (docs/clone/...): FE public clone
- Adaptations validées: amélioration a11y (skip link) et outillage dev sans impact UX finale

## Résumé (TL;DR)
- Ajout d’un skip link global et ancre `main-content` (a11y clavier)
- Bandeau dev (dev-only) indiquant mocks/URL Supabase
- Page `/preflight` pour sonder `/health` et `/ready` lorsqu’orchestrateur revient
- Checklists: a11y et real-mode

## Critères d’acceptation
- [x] Skip link opérationnel (focusable, mène au contenu principal)
- [x] Preflight accessible sous `/preflight`
- [x] Docs à jour (ACCESSIBILITY_README, REAL_MODE_CHECKLIST)

## Impacts
- FE uniquement; aucun changement contrat/back. Pas de “fake”.

## Suivi Task‑Master
- Tâche: 25 (stabilisation), addendum documenté
