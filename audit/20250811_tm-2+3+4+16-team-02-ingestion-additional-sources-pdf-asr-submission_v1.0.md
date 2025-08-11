---
title: "Soumission — Équipe 2 (additional-sources + PDF/ASR)"
doc_kind: submission
team: team-02
team_name: ingestion
tm_ids: [2, 3, 4, 16]
scope: process-document|additional-sources|pdf-bridge
status: draft
version: 1.0
author: ia
related_files:
  - "claims/20250811_tm-2+3+4+16-team-02-ingestion-additional-sources-pdf-asr-claim_v1.0.md"
---

# Soumission à Audit — Équipe 2 (additional-sources + PDF/ASR)

#TEST: orchestrator/test/contract/additional-sources.test.ts
#TEST: orchestrator/test/contract/process-document-txt.test.ts
#TEST: orchestrator/test/contract/process-document-pdf-audio.test.ts

## Artefacts
- Claim: `claims/20250811_tm-2+3+4+16-team-02-ingestion-additional-sources-pdf-asr-claim_v1.0.md`
- Code: `orchestrator/src/app.ts`, `orchestrator/src/services/{document,storage,pdf,whisper}.ts`
- SPEC: `docs/spec/openapi.yaml`, `docs/spec/process-document.yaml`

## Résumé
- Implémentation additional-sources (copied-text, multiple-websites) avec indexation.
- Mocks PDF/ASR et branchement ingestion pour `source_type: pdf|audio|txt`.
- Suite de tests contrat/intégration PASS.

## Demande
- Revue de parité vs docs/clone et WEBHOOKS_MAPPING sur les flux additional-sources et process-document (pdf/audio/txt).
- Avis sur la note transitoire OpenAPI et la couverture Idempotency-Key. 

## Limitations

- Ce document de soumission ne modifie pas les contrats; il agrège les preuves pour l’audit.
- Les métriques chiffrées sont indicatives et non contractuelles. 