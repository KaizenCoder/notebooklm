---
title: "Task 16 — PDF Bridge Corrections — Audit"
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
  - orchestrator/package.json
  - orchestrator/test/contract/process-document-pdf-audio.test.ts
  - orchestrator/test/contract/pdf-bridge/integration.test.ts
  - orchestrator/test/run_pdf_bridge_tests.py
---

#TEST: orchestrator/test/contract/process-document-pdf-audio.test.ts
#TEST: orchestrator/test/contract/pdf-bridge/integration.test.ts
#TEST: orchestrator/test/run_pdf_bridge_tests.py

## Résumé
- Claim de corrections (réintégration bridge PDF dans le pipeline). Constat: les corrections annoncées ne sont pas reflétées dans le code et la suite de tests standard.

## Constatations vérifiables
- Intégration app: `orchestrator/src/app.ts` n'injecte pas `pdf` dans `createDocumentProcessor(env, {...})` (toujours `{ ollama, db }`).
- Export API: `orchestrator/src/services/pdf.ts` ne `export` pas `extractPdfViaBridge` (fonction interne non exportée). Seuls `createPdf` et le type sont exportés.
- Pipeline tests: `orchestrator/package.json` ne contient pas de script `test:pdf-bridge` et `npm test` n’exécute pas les tests Python.
- Test contractuel annoncé `test/contract/process-document-pdf-bridge.test.ts` introuvable; le dépôt contient `orchestrator/test/contract/process-document-pdf-audio.test.ts` qui mocke le PDF au lieu d’appeler le bridge réel.
- Tests TS PDF existants (`orchestrator/test/contract/pdf-bridge/integration.test.ts`) importent une API non exportée et ne sont pas intégrés à la matrice de tests.

## Preuves (#TEST)
- `#TEST: orchestrator/test/contract/process-document-pdf-audio.test.ts` — utilise un faux `pdf.extractText`, pas le bridge.
- `#TEST: orchestrator/test/contract/pdf-bridge/integration.test.ts` — présent mais non exécuté par les scripts `npm test` et importe non exporté.
- `#TEST: orchestrator/test/run_pdf_bridge_tests.py` — existe mais non câblé aux scripts `npm`.

## Écarts vs Claim
- « Câblage applicatif corrigé »: NON constaté dans `app.ts`.
- « export extractPdfViaBridge »: NON présent dans `pdf.ts`.
- « Intégration script test:pdf-bridge »: NON présent dans `package.json`.
- « Nouveau test process-document-pdf-bridge »: FICHIER INEXISTANT dans l’arborescence.

## Recommandations actionnables
- App: injecter `pdf: createPdf(env)` dans `buildApp()` lors de l’instanciation de `createDocumentProcessor`.
- PDF service: soit exporter `extractPdfViaBridge`, soit faire passer tous les tests via `createPdf(env).extractText*()`.
- Tests: 
  - Ajouter `"test:pdf-bridge": "python orchestrator/test/run_pdf_bridge_tests.py"` et l’inclure dans `npm test`.
  - Créer un test contractuel `orchestrator/test/contract/process-document-pdf-bridge.test.ts` qui vérifie un appel réel du bridge (fixture simple) sous conditions contrôlées.
- Optional: au besoin, supporter `file://` → chemin local dans `pdf.ts`.

## Limitations
- Dépendances Python requises (PyMuPDF/pdfminer.six); prévoir un job CI dédié ou un flag `NO_PDF_BRIDGE` pour environnements sans Python.

## Verdict
- Statut: review — Claim non validé à ce stade. Passage à done après preuves de câblage et tests exécutés dans la suite standard.
