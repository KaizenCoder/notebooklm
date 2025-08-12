---
title: "Audit — Chunking + 768d Embeddings (Task 9)"
doc_kind: audit
team: team-01
team_name: foundations
tm_ids: [9]
scope: ingestion-indexing
status: review
version: 1.0
author: ia
related_files:
  - orchestrator/src/services/document.ts
  - orchestrator/test/contract/chunking-overlap-dims.test.ts
  - orchestrator/test/contract/chunking-overlap-metadata.test.ts
  - orchestrator/test/contract/document-embeddings.test.ts
---

#TEST: orchestrator/test/contract/chunking-overlap-dims.test.ts
#TEST: orchestrator/test/contract/chunking-overlap-metadata.test.ts
#TEST: orchestrator/test/contract/document-embeddings.test.ts

## Résumé
- Chunking par ~200 tokens avec recouvrement 40 tokens validé.
- Embeddings 768d assurés (mocks) et vérifiés dans les tests.
- Métadonnées loc.lines.from/to présentes sur chaque chunk.

## Evidence (tests PASS)
- chunking-overlap-dims.test.ts: multi-chunks + 768 dims mock
- chunking-overlap-metadata.test.ts: overlap 40 tokens, dims 768, loc.lines
- document-embeddings.test.ts: embeddings présents et dimension contrôlée par stub

## Notes
- Mapping from/to basé sur une recherche de sous-chaîne déterministe; suffisant pour la parité actuelle.
- Embeddings réels via Ollama conformes aux interfaces; les tests utilisent des stubs 768d.

## Conclusion
- Parité chunking + embeddings 768d atteinte; prêt pour revue.

## Limitations
- Exécutions locales; les logs complets ne sont pas inclus ici. Les lignes `#TEST:` pointent vers des preuves reproductibles.
