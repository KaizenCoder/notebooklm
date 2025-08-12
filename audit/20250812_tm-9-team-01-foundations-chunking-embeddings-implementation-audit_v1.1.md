---
title: "Task 9 — Chunking & Embeddings — Audit (implementation)"
doc_kind: audit
team: team-01
team_name: foundations
tm_ids: [9]
scope: chunking-embeddings
status: passed
version: 1.1
author: AI-Auditeur
related_files:
  - orchestrator/src/services/document.ts
  - orchestrator/test/contract/chunking-overlap-dims.test.ts
  - orchestrator/test/contract/chunking-overlap-metadata.test.ts
  - orchestrator/test/contract/chunking-loc-lines-repeats.test.ts
  - orchestrator/test/contract/document-embeddings.test.ts
  - orchestrator/test/contract/embeddings-dim-mismatch.test.ts
---

#TEST: orchestrator/test/contract/chunking-overlap-dims.test.ts
#TEST: orchestrator/test/contract/chunking-overlap-metadata.test.ts
#TEST: orchestrator/test/contract/chunking-loc-lines-repeats.test.ts
#TEST: orchestrator/test/contract/document-embeddings.test.ts
#TEST: orchestrator/test/contract/embeddings-dim-mismatch.test.ts

## Résumé
- Chunking ~200 tokens avec 40 d'overlap, mapping `loc.lines` robuste.
- Enforcements embeddings 768-dim avec graceful failure (vecteur vide sinon).

## Points de parité clés
- **loc.lines** monotone et correct même avec répétitions.
- **768-dim** validé post-`ollama.embeddings`; erreurs non bloquantes si non conforme.

## Preuves (#TEST)
- `#TEST: orchestrator/test/contract/chunking-overlap-dims.test.ts`
- `#TEST: orchestrator/test/contract/chunking-overlap-metadata.test.ts`
- `#TEST: orchestrator/test/contract/chunking-loc-lines-repeats.test.ts`
- `#TEST: orchestrator/test/contract/document-embeddings.test.ts`
- `#TEST: orchestrator/test/contract/embeddings-dim-mismatch.test.ts`
- Code: `orchestrator/src/services/document.ts`

## Limitations
- Tokenisation approximative par mots; un tokenizer BPE améliorerait la fidélité aux limites de modèle.

## Recommandations
- Introduire un tokenizer aligné modèle pour un découpage plus stable.

## Historique des versions
- v1.1: Ajout des tests de métadonnées et de répétitions; validation finale verte.
