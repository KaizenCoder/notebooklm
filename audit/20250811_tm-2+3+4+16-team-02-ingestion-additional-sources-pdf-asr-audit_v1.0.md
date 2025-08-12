---
title: "Ingestion — additional-sources + PDF/ASR (AUDIT v1)"
doc_kind: audit
team: team-02
team_name: ingestion
tm_ids: [2, 3, 4, 16, 19]
scope: process-document|additional-sources|pdf-bridge
status: draft
version: 1.0
author: ia
related_files:
  - "claims/20250811_tm-2+3+4+16-team-02-ingestion-additional-sources-pdf-asr-claim_v1.0.md"
  - "audit/20250811_tm-2+3+4+16-team-02-ingestion-additional-sources-pdf-asr-submission_v1.0.md"
  - "docs/spec/openapi.yaml"
  - "docs/spec/process-document.yaml"
  - "docs/ANNEXES_PAYLOADS.md"
  - "orchestrator/src/app.ts"
  - "orchestrator/src/services/document.ts"
---

# Audit — additional-sources + PDF/ASR (Ingestion)

#TEST: orchestrator/test/contract/additional-sources.test.ts
#TEST: orchestrator/test/contract/process-document-txt.test.ts
#TEST: orchestrator/test/contract/process-document-pdf-audio.test.ts
#TEST: orchestrator/test/contract/process-document-job.test.ts
#TEST: orchestrator/test/contract/document-embeddings.test.ts
#TEST: orchestrator/test/contract/process-document-status.test.ts

#SIMULATION

## Résumé (TL;DR)

- Objet: vérifier la conformité de `process-additional-sources` (copied-text, multiple-websites) et l’extension `process-document` (txt/pdf/audio) via services mockés PDF/Whisper.
- Décision: acceptation conditionnelle. Les tests sont verts et la couverture d’ingestion progresse nettement; restent à finaliser: strict OpenAPI (payloads/codes erreurs), callbacks complets, Idempotency-Key, chunking tokenisé/overlap, embeddings 768.
- Points bloquants: extraction réelle (pont PDF), callbacks complets, idempotence, enforcements dims/overlap.

## Références

- Claim: `claims/20250811_tm-2+3+4+16-team-02-ingestion-additional-sources-pdf-asr-claim_v1.0.md`
- Soumission: `audit/20250811_tm-2+3+4+16-team-02-ingestion-additional-sources-pdf-asr-submission_v1.0.md`
- Specs: `docs/spec/openapi.yaml`, `docs/spec/process-document.yaml`
- Annexes: `docs/ANNEXES_PAYLOADS.md`
- Workflows originaux: `docs/clone/...`

## Méthodologie

- Jeux d’essai: tests contractuels listés ci‑dessus.
- Procédure: exécution `npm test`, inspection des handlers et services invoqués.
- ENVs: `NOTEBOOK_GENERATION_AUTH`, `OLLAMA_*`, `GPU_ONLY`.

## Vérifications de parité

- HTTP: endpoints répondent (200/202); Auth OK; OpenAPI partiel (normalisation legacy encore présente).
- Side‑effects DB: upsert `documents` avec `metadata.loc.lines`; statut sources partiel (voie failed à étendre).
- Stockage: mocks utilisés; pas d’upload `.txt` réel.
- Logs/erreurs: basiques; pas de `correlation_id`.

## Résultats

- Observations: additional-sources traité côté tests; process-document couvre txt/pdf/audio avec mocks; statut indexing→ready observé; embeddings présents.
- Écarts détectés: mêmes que l’audit précédent (OpenAPI strict, callbacks complets, idempotence, token overlap, dims 768).
- Captures/logs: suite de tests locale PASS.

## Recommandations & décisions

- Actions requises:
  - Finaliser conformité OpenAPI (validation et erreurs 4xx/5xx), normaliser payloads.
  - Implémenter callbacks complets avec `title/summary/content` et voies d’échec.
  - Idempotency-Key: stockage TTL + tests replays.
  - Chunking tokens ~200 + overlap; enforcing embeddings 768 (batch).
  - Remplacer mocks PDF/Whisper par ponts réels (Tâche 16) avec timeouts.
- Acceptation conditionnelle: oui pour intégration continue; non pour clôture parité stricte tant que les points ci‑dessus ne sont pas livrés et testés.

## Limitations

- Audit fondé sur tests simulés; pas d’E2E Supabase/Whisper/Coqui.

## Suivi Task‑Master

- Tâches: 2 (AUDIT en review), 3 (AUDIT websites en review), 4 (AUDIT copied-text en review), 16 (bridge PDF), 19 (gap closure)
- Commandes:
  - `task-master set-status --id=2.7 --status=review`
  - `task-master set-status --id=3.6 --status=review`
  - `task-master set-status --id=4.6 --status=review`

## Historique des versions

- v1.0: création de l’audit 