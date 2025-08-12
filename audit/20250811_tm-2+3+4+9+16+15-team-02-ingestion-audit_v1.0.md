---
title: "Audit du Claim — Équipe 2 (Ingestion)"
doc_kind: audit
team: team-02
team_name: ingestion
tm_ids: [2, 3, 4, 9, 16, 15]
scope: process-document|additional-sources|chunking|pdf-bridge|idempotency
status: draft
version: 1.0
author: ia
related_files:
  - "../claims/20250811_tm-2+9+16+15-team-02-ingestion-claim_v1.0.md"
---

# Audit du Claim — Équipe 2 (Ingestion)

#TEST: orchestrator/test/contract/health.test.ts
#TEST: orchestrator/test/contract/ready.test.ts
#TEST: orchestrator/test/contract/ready-failures.test.ts
#TEST: orchestrator/test/contract/auth.test.ts
#TEST: orchestrator/test/contract/webhooks.test.ts
#TEST: orchestrator/test/contract/chat-integration.test.ts
#TEST: orchestrator/test/contract/chat-persist.test.ts
#TEST: orchestrator/test/contract/generate-notebook-job.test.ts
#TEST: orchestrator/test/contract/process-document-job.test.ts
#TEST: orchestrator/test/contract/document-embeddings.test.ts
#TEST: orchestrator/test/contract/process-document-status.test.ts

#SIMULATION

## Objet
Audit de la soumission `claims/equipe2_ingestion_claim.md` et vérification de la couverture par rapport aux écarts identifiés dans `audit/equipe2_ingestion_audit.md`.

## Constat
- Les tests listés dans le claim sont effectivement verts sur l’environnement local (PowerShell, Node 22) — exécution `npm test` dans `orchestrator/`.
- Le claim documente correctement les changements réalisés (payload normalisé côté `process-document`, callback best‑effort, embeddings par chunk, statut `indexing -> ready`, placeholders pour additional-sources et generate-audio).
- Points encore non couverts par implémentation/tests (restent à faire, en ligne avec l’audit):
  - Contrat OpenAPI `process-document` complet (extraction `file_url/file_path` selon `source_type`, callback avec `title/summary/content`).
  - Implémentation complète `process-additional-sources` (`copied-text`/`multiple-websites`) avec stockage `.txt` + indexation.
  - Idempotency-Key pour ingestion; modèle d’erreur contractuel; voies d’échec avec `sources.status='failed'` + callback d’échec.
  - Chunking ~200 tokens + overlap; assurance dimension embeddings (p.ex. 768) et batch embeddings.

## Recommandations
- Valider SPEC (Tâches 2, 3, 4, 9, 15, 16) puis implémenter par itérations:
  1) Extraction + callback complet pour `process-document` (PDF/TXT/Audio) avec tests intégration (mocks Storage/Whisper, serveur de capture callback).
  2) `process-additional-sources` complet pour `copied-text` et `multiple-websites` avec stockage `.txt` et indexation.
  3) Idempotency-Key (ingestion) + enforcements embeddings 768 + chunker tokens/overlap.
- Mettre à jour les tests contractuels en conséquence (contrat strict OpenAPI + callbacks + idempotence).

## Décision d’audit
- Claim accepté partiellement: conforme pour la phase actuelle (placeholders et normalisations) mais non suffisant pour clôturer l’épopée ingestion en parité stricte.
- Passage recommandé: laisser la tâche `19 — Équipe 2 — Ingestion gap closure` en `pending` et ouvrir les sous‑tâches `SPEC` puis `IMPL` correspondantes en `in-progress`.

## Limitations
- Cet audit n’inclut pas d’E2E réel avec Supabase local/Whisper/Coqui; résultats fondés sur la suite de tests contractuels et l’inspection du code. 