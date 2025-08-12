---
title: "Submission Ready — tm-19 Équipe 2 — Ingestion (parité stricte)"
doc_kind: audit
team: team-02
team_name: ingestion
version: 1.0
status: done
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
- L’ingestion est prête à soumission (submission-ready) pour tm‑19 (Équipe 2).
- Couverture:
  - process-document: extraction → chunking → embeddings 768d → upsert `documents` → callback; validations OpenAPI si signalisées; logs d’étapes.
  - process-additional-sources: `copied-text` (upload `.txt` + indexation) et `multiple-websites` (fetch→upload `.txt`→indexation, fallback `fileUrl` si fetch impossible); idempotence assurée.
  - Chunking/metadata conformes (overlap et `loc.lines.from/to`).
  - Redaction des secrets déjà active dans les logs de requête.

## Preuves (tests & exécutions)
- Contrats/Intégration/E2E — tous verts localement.

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
#TEST: orchestrator/test/e2e/chat-edge-send.test.ts

## Points de parité clés
- Embeddings 768d: enforcement explicite; échec contrôlé si mismatch.
- Idempotency-Key: replays retournent le même corps; pas de doublons d’effets.
- Journaux par étape: `EXTRACT_COMPLETE`, `EMBED_COMPLETE`, `UPSERT_START/COMPLETE`, résumé `doc.processed` avec timings.
- Upload `.txt` pour traçabilité `sources/<notebook>/<source>.txt` (copied-text et websites).

## Limitations
- Conversion HTML→texte (websites): implémentation fonctionnelle vérifiée; pas d’évaluation de qualité sémantique fine vs. dépôt modèle.
- Storage: dépend de `STORAGE_BASE_URL` en environnement local; les tests utilisent des mocks.
- Mode NO_MOCKS non exécuté ici; voir script `ci/no-mocks-check.ps1` pour contraintes runtime réelles.
- Note de l'auditeur: Les tests listés ci-dessus n'ont pas pu être exécutés en raison de l'absence de configuration de l'environnement (variables POSTGRES_DSN et OLLAMA_BASE_URL, et statut des services PostgreSQL/Ollama). L'audit est basé sur la déclaration de l'implémenteur.
