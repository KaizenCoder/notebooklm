---
title: "FE Lot 1 — Setup & Sanity (OpenAPI, Zod, Mocks, Smoke)"
doc_kind: claim
team: team-03
team_name: rag-audio
tm_ids: [20, 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8, 20.9, 20.10]
scope: frontend
status: review
version: 1.0
author: ia
related_files:
  - docs/frontend/FRONTEND_PREPARATION_SUMMARY.md
  - docs/plans/FRONTEND_DEVELOPMENT_PLAN.md
  - docs/FRONTEND_PRD.md
  - docs/spec/openapi.yaml
  - docs/clone/insights-lm-public-main/insights-lm-public-main/src/main.tsx
  - docs/clone/insights-lm-public-main/insights-lm-public-main/src/types/openapi.d.ts
  - docs/clone/insights-lm-public-main/insights-lm-public-main/src/types/schemas.ts
  - docs/clone/insights-lm-public-main/insights-lm-public-main/src/mocks/handlers.ts
  - docs/clone/insights-lm-public-main/insights-lm-public-main/tests/smoke.spec.ts
---

# Claim — FE Lot 1 — Setup & Sanity (OpenAPI, Zod, Mocks, Smoke)

#TEST: docs/clone/insights-lm-public-main/insights-lm-public-main/tests/smoke.spec.ts

> Référence continue (obligatoire)
- Source originale (docs/clone/...):
  - docs/clone/insights-lm-public-main/insights-lm-public-main (structure routes/pages/hooks, shadcn/radix, tailwind)
- Adaptations validées:
  - Toggle mocks MSW dev-only, Zod fail-fast côté FE (pas d’impact UX), génération types depuis docs/spec/openapi.yaml

## Résumé (TL;DR)

- Problème constaté: drift potentiel de contrats FE↔Edge/Orchestrator et intégration tardive instable.
- Proposition succincte: génération types OpenAPI FE, Zod validation côté FE, toggle mocks MSW, smoke tests (chat + ingestion) + config Playwright.
- Bénéfice attendu: réduction forte des régressions d’intégration; feedback rapide; préparation pour lots suivants.

## Contexte

- Contexte fonctionnel/technique: PRD FE et plan par lots; parité stricte.
- Références: docs/spec/openapi.yaml, docs/frontend/FRONTEND_PREPARATION_SUMMARY.md, docs/plans/FRONTEND_DEVELOPMENT_PLAN.md, docs/clone/...

## Portée et périmètre (scope)

- Équipe: team-03 / rag-audio
- Tâches Task‑Master visées: 20.*
- Domaines: frontend (types, mocks, tests e2e smoke)

## Demande et motivation

- Description: outillage FE minimal à forte valeur (types OpenAPI, Zod, MSW, Playwright) pour sécuriser l’intégration locale contre l’orchestrateur via Edge Functions.
- Justification: parité stricte, réduction drift contrat, accélération feedback, respect local-only.

## Critères d’acceptation

- [x] Types générés depuis `docs/spec/openapi.yaml` (script `gen:openapi`).
- [x] Zod validations pour chat et process-document (fail-fast en dev).
- [x] Toggle `VITE_USE_MOCKS` + MSW actif en dev.
- [x] Smoke E2E Playwright (chat/ingestion) exécutables localement.

## Impacts

- API/Contrats I/O: lecture seule (types), validations FE.
- Code & modules: ajout fichiers mocks/schemas/tests; aucun changement UX.
- Schéma/DB/Storage: N/A (mocks côté Edge en dev).
- Performance/latences: négligeable en prod (mocks dev-only).
- Sécurité/compliance: pas de secrets exposés; mocks côté FE uniquement.

## Risques et alternatives

- Risques: divergence schémas si OpenAPI évolue sans régénération.
- Atténuations: script `gen:openapi` à lancer à chaque MAJ; check CI ultérieure.
- Alternatives: pas de mocks (feedback plus lent), validations runtime côté Edge uniquement (détection tardive).

## Références

- Spécifications: `docs/spec/openapi.yaml`
- Workflows originaux: `docs/clone/insights-lm-public-main/insights-lm-public-main`
- Annexes payloads: `docs/ANNEXES_PAYLOADS.md`

## Limitations

- A11y et snapshots visuels seront traités dans les lots suivants.

## Suivi Task‑Master

- Tâches liées: 20, 20.1–20.10
- Commandes:
  - `task-master set-status --id=20 --status=review`
