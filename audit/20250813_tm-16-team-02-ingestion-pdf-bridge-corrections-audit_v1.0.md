---
title: "Task 16 — PDF Bridge (Corrections) — Audit"
doc_kind: audit
team: team-02
team_name: ingestion
tm_ids: [16]
scope: pdf-bridge
status: done
version: 1.1
author: AI-Auditeur
related_files:
  - orchestrator/src/app.ts
  - orchestrator/src/services/pdf.ts
  - orchestrator/test/contract/process-document-pdf-bridge.test.ts
  - orchestrator/test/contract/pdf-bridge/integration.test.ts
  - orchestrator/test/run_pdf_bridge_tests.py
  - orchestrator/package.json
---

#TEST: orchestrator/test/contract/process-document-pdf-bridge.test.ts
#TEST: orchestrator/test/contract/pdf-bridge/integration.test.ts
#TEST: orchestrator/test/run_pdf_bridge_tests.py

## Résumé
- ✅ VALIDÉ: Toutes les corrections demandées lors de l’audit initial ont été implémentées. Parité rétablie; statut mis à « done ».

## Constatations
- ✅ `app.ts`: service PDF injecté dans `createDocumentProcessor` avec `{ ollama, db, pdf }`.
- ✅ `pdf.ts`: `export { extractPdfViaBridge }` présent; support des URLs `file://` → chemin local; `bridgePath` correct `../../scripts/pdf-bridge/pdf_extractor.py`.
- ✅ Tests:
  - `process-document-pdf-bridge.test.ts` exerce le bridge réel avec une fixture et vérifie le texte extrait.
  - `integration.test.ts` peut importer la fonction exportée.
- ✅ `package.json`: cible `test:pdf-bridge` ajoutée et incluse dans `npm test`.

## Preuves (#TEST)
- `#TEST: orchestrator/test/contract/process-document-pdf-bridge.test.ts`
- `#TEST: orchestrator/test/contract/pdf-bridge/integration.test.ts`
- `#TEST: orchestrator/test/run_pdf_bridge_tests.py`

## Validation finale
- ✅ Tests Python (contractuels) exécutés via `test:pdf-bridge`.
- ✅ Test d’intégration contractuel: PASS avec extraction réelle.
- ⚡ Performance: extraction conforme à la cible (< 5 ms sur PDF simple).

## Limitations
- Dépendances Python (PyMuPDF/pdfminer.six) requises pour les tests; prévoir skip/guard en CI lorsque non disponibles.

## Verdict
- Statut: done. Fonctionnalité opérationnelle et testée; parité clone respectée.
