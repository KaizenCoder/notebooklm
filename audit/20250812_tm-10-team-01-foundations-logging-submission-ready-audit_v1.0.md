---
title: "Submission Ready — tm-10 Team-01 Foundations — Logging & Errors"
doc_kind: audit
team: team-01
team_name: foundations
version: 1.0
status: review
author: AI-Implementateur
tm_ids: [10]
scope: logging
related_files:
  - orchestrator/src/app.ts
  - docs/spec/LOGGING_ERRORS_SPEC.md
  - docs/spec/openapi.yaml
---

## Résumé
- Le volet Logging & Errors est prêt à soumission (submission-ready) pour tm‑10.
- Couverture:
  - Modèle d’erreur contractuel: `{ code, message, details?, correlation_id }` pour 400/401/422/500.
  - Corrélation: `correlation_id` présent dans toutes les réponses; header `x-correlation-id` ajouté.
  - Redaction: en‑têtes sensibles (Authorization) masqués dans les logs.
  - Événements et métriques: RAG (`RAG_START/COMPLETE`, `match_documents_ms`, `rag_duration_ms`, `llm_generate_ms`), Audio (`TTS_*`, `UPLOAD_*`, `CALLBACK_SENT`), Ingestion (`EXTRACT_COMPLETE`, `EMBED_COMPLETE`, `UPSERT_*`, `doc.processed`).

## Preuves (tests & exécutions)
- Suite de tests complète verte (contrats, intégration, E2E) au moment de la rédaction.

#TEST: orchestrator/test/contract/ready-error-shape.test.ts
#TEST: orchestrator/test/contract/ready.test.ts
#TEST: orchestrator/test/contract/ready-failures.test.ts
#TEST: orchestrator/test/contract/generate-audio-invalid.test.ts
#TEST: orchestrator/test/contract/payload-validation.test.ts
#TEST: orchestrator/test/integration/logging-redaction.test.ts
#TEST: orchestrator/test/integration/process-document-step-logs.test.ts
#TEST: orchestrator/test/integration/generate-audio-step-logs.test.ts
#TEST: orchestrator/test/e2e/chat-edge-send.test.ts
#TEST: orchestrator/test/contract/chat-llm-metrics.test.ts

## Points de parité clés
- Format d’erreur et statuts alignés sur la spec.
- Logs JSON structurés avec `correlation_id`.
- Événements d’étapes et mesures de latence intégrés aux routes principales.

## Limitations
- Redaction actuelle centrée sur les en‑têtes (Authorization). Extension future si d’autres secrets apparaissent dans les payloads.
- Métriques RAG: `llm_generate_ms` instrumentée à travers le test, mais l’instrumentation runtime peut varier selon le modèle LLM.
- Échantillonnage/retention des logs (sampling) non formalisé; à cadrer si requis par l’original.
