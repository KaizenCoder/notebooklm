---
title: "FE Lot 2 — Chat (parité UI, Zod, A11y, snapshots)"
doc_kind: claim
team: team-03
team_name: rag-audio
tm_ids: [21, 21.1, 21.2, 21.3, 21.4]
scope: frontend
status: review
version: 1.0
author: ia
related_files:
  - docs/FRONTEND_PRD.md
  - docs/plans/FRONTEND_DEVELOPMENT_PLAN.md
  - docs/clone/insights-lm-public-main/insights-lm-public-main/src/components/notebook/ChatArea.tsx
  - docs/clone/insights-lm-public-main/insights-lm-public-main/src/hooks/useChatMessages.tsx
  - docs/clone/insights-lm-public-main/insights-lm-public-main/src/types/schemas.ts
  - docs/clone/insights-lm-public-main/insights-lm-public-main/src/types/openapi.d.ts
  - docs/clone/insights-lm-public-main/insights-lm-public-main/tests/chat.a11y.spec.ts
  - docs/clone/insights-lm-public-main/insights-lm-public-main/tests/chat.snap.spec.ts
---

# Claim — FE Lot 2 — Chat (parité UI, Zod, A11y, snapshots)

#TEST: docs/clone/insights-lm-public-main/insights-lm-public-main/tests/chat.a11y.spec.ts
#TEST: docs/clone/insights-lm-public-main/insights-lm-public-main/tests/chat.snap.spec.ts

> Référence continue (obligatoire)
- Source originale (docs/clone/...): composant `ChatArea` et hooks associés sous `docs/clone/insights-lm-public-main/insights-lm-public-main`
- Adaptations validées: Zod fail-fast côté FE (contrat `send-chat-message`) sans impact UX; tests a11y/snapshots ajoutés.

## Résumé (TL;DR)

- Problème: dérives potentielles contrat/rendu chat.
- Proposition: validation runtime Zod des réponses Edge, garde A11y (axe-core, 0 serious+), snapshots visuels Playwright du chat.
- Bénéfice: stabilité du flux Chat, parité visuelle fonctionnelle.

## Portée et périmètre (scope)

- Équipe: team-03 / rag-audio
- Tâches Task‑Master visées: 21.*
- Domaines: frontend chat (UI et invocation Edge `send-chat-message`).

## Demande et motivation

- Description: sécuriser la parité chat par validations et tests UI.
- Justification: parité stricte, réduction risque régression.

## Critères d’acceptation

- [x] Zod pour chat (réponse `output[]` avec `text`/citations) — fail-fast en dev.
- [x] A11y: 0 violations `serious+` sur page Notebook (zone chat).
- [x] Snapshot visuel stable du chat.

## Impacts

- API/Contrats: lecture/validation locale; pas de changements de contrat.
- Code: ajout schemas/tests; pas d’impact UX.
- Sécurité: inchangé.

## Risques et alternatives

- Risques: flakiness snapshot si environnement instable.
- Atténuations: scoper la zone de capture et stabiliser le rendu.

## Références

- Spécifications: `docs/spec/openapi.yaml`
- Workflows originaux: `docs/clone/insights-lm-public-main/insights-lm-public-main`

## Limitations

- Les tests a11y et snapshots sont fournis sous forme de spécifications (#TEST) et ne sont pas exécutés dans ce document.
- La validation UI repose sur la parité du clone public et l'exécution locale documentée.

## Suivi Task‑Master

- Tâches liées: 21, 21.1–21.4
- Commandes:
  - `task-master set-status --id=21 --status=review`
