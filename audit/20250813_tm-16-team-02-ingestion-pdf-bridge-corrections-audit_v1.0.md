---
title: "Task 16 — PDF Bridge (Corrections) — Audit"
doc_kind: audit
team: team-02
team_name: ingestion
tm_ids: [16]
scope: pdf-bridge
status: review
version: 1.0
author: AI-Auditeur
related_files:
  - orchestrator/src/app.ts
  - orchestrator/src/services/pdf.ts
  - orchestrator/test/contract/process-document-pdf-audio.test.ts
  - orchestrator/test/contract/pdf-bridge/integration.test.ts
  - orchestrator/test/run_pdf_bridge_tests.py
  - orchestrator/package.json
  - audit/20250813_tm-16-team-02-ingestion-pdf-bridge-audit_v1.0.md
---

#TEST: orchestrator/test/contract/process-document-pdf-audio.test.ts
#TEST: orchestrator/test/contract/pdf-bridge/integration.test.ts
#TEST: orchestrator/test/run_pdf_bridge_tests.py

## Résumé
- La resoumission affirme la correction des gaps (câblage, export API, intégration tests). Après vérification du code actuel, plusieurs points restent non conformes. Statut maintenu en review.

## Constatations
- `app.ts`: le service PDF n'est pas injecté dans `createDocumentProcessor` (actuel: `{ ollama, db }` sans `pdf`).
- `pdf.ts`: `extractPdfViaBridge` n'est pas exporté; l’API publique expose `createPdf` uniquement.
- Chemin bridge: `bridgePath` utilise `../scripts/...` alors que l’arborescence impose `../../scripts/...` depuis `src/services/`.
- Tests:
  - `orchestrator/test/contract/process-document-pdf-bridge.test.ts` annoncé, mais absent. Le test existant `process-document-pdf-audio.test.ts` n’exerce pas le bridge réel (mock `pdf.extractText`).
  - `integration.test.ts` (Jest) ne s’aligne pas avec la stack `tsx/vitest`. De plus, il importe une fonction non exportée.
- `package.json`: aucune cible `test:pdf-bridge` (Python) n’est intégrée au plan `npm test`.

## Preuves (#TEST)
- `#TEST: orchestrator/test/contract/process-document-pdf-audio.test.ts` (mock PDF)
- `#TEST: orchestrator/test/contract/pdf-bridge/integration.test.ts` (Jest + import non exporté)
- `#TEST: orchestrator/test/run_pdf_bridge_tests.py` (présent mais non branché aux scripts npm)

## Écarts vs claim de corrections
- Câblage app.ts: NON (à faire)
- Export API: NON (à faire)
- Intégration tests Python: NON (cible npm absente)
- Test contractuel réel: NON (fichier annoncé manquant; test actuel mock)
- Chemin bridge: NON (relative path incorrect)

## Recommandations concrètes
- `app.ts`: `const docProc = createDocumentProcessor(env, { ollama, db, pdf: createPdf(env) });`
- `pdf.ts`: `export { extractPdfViaBridge }` (ou adapter les tests pour utiliser `createPdf(env)`), corriger `bridgePath` en `../../scripts/pdf-bridge/pdf_extractor.py` et supporter `file://` → chemin local.
- `package.json`: ajouter `"test:pdf-bridge": "python orchestrator/test/run_pdf_bridge_tests.py"` et l’appeler depuis `test`.
- Créer `orchestrator/test/contract/process-document-pdf-bridge.test.ts` qui injecte `pdf: createPdf(env)` et valide une extraction réelle (fixture simple).

## Limitations
- Dépendances Python requises; prévoir skip conditionnel en CI si non disponible.

## Verdict
- Statut: review. Passage à done après livraison des edits ci‑dessus et exécution verte des tests.
