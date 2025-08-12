---
title: "Audit TM-9 — Chunking + Embeddings (768) — Clone strict"
doc_kind: "audit"
team: "team-01"
team_name: "Foundations"
tm_ids: ["9"]
scope: "orchestrator/services/document.ts"
status: "reviewed"
version: "v1.3"
author: "AI Auditor"
related_files:
  - "orchestrator/src/services/document.ts"
  - "orchestrator/test/contract/chunking-overlap-dims.test.ts"
  - "orchestrator/test/contract/chunking-overlap-metadata.test.ts"
  - "orchestrator/test/contract/chunking-loc-lines-repeats.test.ts"
  - "orchestrator/test/contract/document-embeddings.test.ts"
---

#TEST: orchestrator/test/contract/chunking-overlap-dims.test.ts
#TEST: orchestrator/test/contract/chunking-overlap-metadata.test.ts
#TEST: orchestrator/test/contract/chunking-loc-lines-repeats.test.ts
#TEST: orchestrator/test/contract/document-embeddings.test.ts

## Mise à jour (v1.3)
- Implémentation: `loc.lines` est désormais dérivé d’un mapping token→ligne (au lieu de `indexOf`), supprimant l’ambiguïté sur textes répétitifs.
- Nouveau test: `chunking-loc-lines-repeats.test.ts` vérifie la monotonie de `loc.lines.to` et les invariants sur un corpus très répétitif.
- Enforcement 768d activé dans le processeur de documents; tests de dimensions alignés.

## Limitations
- Tokenisation whitespace approximative vs BPE; acceptable pour parité fonctionnelle, à documenter comme approximation.
- Batching embeddings/upserts non implémenté (écart de perf potentiel vs original), toléré à ce stade.

## Décision
- Conformité renforcée: overlap, metadata `loc.lines` robuste, 768d enforced. Suite contrats + E2E: verte.
- Suivi: envisager batching si requis par parité stricte; sinon documenter l’écart dans la SPEC.
