---
title: "Audit — tm-19 Équipe 2 — Ingestion (parité stricte)"
doc_kind: audit
team: team-02
team_name: ingestion
version: 1.0
status: review
author: AI-Implementateur
tm_ids: [19]
scope: ingestion
related_files:
  - orchestrator/src/app.ts
  - orchestrator/src/services/document.ts
  - orchestrator/src/services/storage.ts
  - docs/spec/process-document.yaml
  - docs/spec/process-additional-sources.yaml
  - docs/spec/openapi.yaml
---

## Résumé
- Parité ingestion confirmée sur les flux principaux:
  - process-document: validation OpenAPI (quand signalée), exécution extraction → chunking → embeddings 768d → upsert `documents` → callback; logs d’étapes présents.
  - additional-sources: `copied-text` et `multiple-websites` gérés; upload `.txt` dans `sources/<notebook>/<source>.txt` puis indexation; idempotency-key supporté.
  - Conformité chunking/metadata: `loc.lines.from/to` conservés; overlap et dimensions vérifiés.
  - Logs: `EXTRACT_COMPLETE`, `EMBED_COMPLETE`, `UPSERT_START/COMPLETE`, résumé `doc.processed`; redaction des secrets active au niveau des requêtes.

## Vérifications (sélection)
- Contrats HTTP (statuts, shapes) et side-effects simulés (DB/Storage mocks) sur les endpoints d’ingestion.
- Idempotence pour `process-document` et `process-additional-sources` avec même corps de réponse en relecture.
- Embeddings: enforcement 768d (échec contrôlé en cas de mismatch).
- Journalisation d’étapes et métriques par phase d’ingestion.

## Résultats
- process-document: conforme (accepted 202, pipeline complet, callback tenté; logs d’étapes et timings présents).
- additional-sources: conforme (200; upload `.txt` + indexation; idempotence OK; websites: fetch→upload→indexation, fallback fileUrl si fetch indisponible).
- Chunking/metadata: overlap et `loc.lines` cohérents; dims embeddings respectées.

#TEST: orchestrator/test/contract/process-document-job.test.ts
#TEST: orchestrator/test/contract/process-document-status.test.ts
#TEST: orchestrator/test/contract/document-embeddings.test.ts
#TEST: orchestrator/test/contract/embeddings-dim-mismatch.test.ts
#TEST: orchestrator/test/contract/payload-validation.test.ts
#TEST: orchestrator/test/contract/additional-sources.test.ts
#TEST: orchestrator/test/contract/idempotency.test.ts
#TEST: orchestrator/test/contract/idempotency-additional-sources.test.ts
#TEST: orchestrator/test/integration/process-document-step-logs.test.ts
#TEST: orchestrator/test/integration/additional-sources-storage-db.test.ts

## Recommandations
- Qualifier la qualité d’extraction HTML→texte (websites) par rapport au repo modèle; ajuster si nécessaire.
- Confirmer le mapping exact des callbacks côté Edge selon `docs/clone/*`.

## Limitations
- Extraction HTML→texte: conversion simple validée fonctionnellement, pas d’évaluation de qualité sémantique.
- Storage: endpoint réel dépend de `STORAGE_BASE_URL` local; tests utilisent mocks.
- Le mode NO_MOCKS n’est pas exécuté dans cette vérification; voir guide ci/no-mocks pour contrainte runtime réelle.
