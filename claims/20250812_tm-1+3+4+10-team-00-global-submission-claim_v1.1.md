---
title: "Claim — Submission Ready (IDs 1,3,4,10) + Annexes"
doc_kind: claim
team: team-00
team_name: global
version: 1.1
status: review
author: AI-Implementateur
tm_ids: [1, 3, 4, 10]
scope: submission
related_files:
  - .taskmaster/tasks/tasks.json
  - orchestrator/src/app.ts
  - orchestrator/src/services/document.ts
  - orchestrator/src/services/storage.ts
  - docs/spec/openapi.yaml
  - claims/20250812_tm-1+3+4+10-team-00-global-submission-claim_v1.0.md
  - claims/20250812_tm-1+3+4+10-team-00-global-annexes_v1.0.md
---

## Résumé
Consolide le claim v1.0 et intègre les annexes de soumission globales.

## Annexes intégrées
- Annexes Notice (renommées): `claims/20250812_tm-1+3+4+10-team-00-global-annexes_v1.0.md`
  - Contient le tableau récapitulatif (ID, Titre, Statut, Tests clés), la liste de bundle (audits + specs) et reprend les limitations.

## Rappels
- Voir v1.0 pour le détail narratif; voir l’annexe pour le tableau et bundle.

#TEST: scripts/validate-claims-audit.mjs

## Limitations
- identiques à v1.0 et à l’annexe.
