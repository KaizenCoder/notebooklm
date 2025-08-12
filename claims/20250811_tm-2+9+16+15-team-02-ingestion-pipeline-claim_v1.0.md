---
title: "Équipe 2 — Ingestion (process-document, chunking, PDF bridge, idempotence)"
doc_kind: claim
team: team-02
team_name: ingestion
tm_ids: [2, 9, 16, 15]
scope: process-document|additional-sources|chunking|pdf-bridge|idempotency
status: draft
version: 1.0
author: ia
related_files: []
---

# Claim — Équipe 2 (Ingestion) — Soumission à Audit

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

## Contexte
- Objectif: adresser les écarts relevés dans `audit/equipe2_ingestion_audit.md` en maintenant la **parité stricte** avec l’original et en respectant la méthodologie Task‑Master (SPEC → IMPL → TEST → AUDIT).
- Périmètre Équipe 2: ingestion/indexation — `process-document` (Tâche 2), chunking/embeddings (Tâche 9), pont PDF (Tâche 16).

## Analyse (écarts vs implémentation)
- Contrat `process-document` (OpenAPI):
  - Ajout d’une normalisation du payload pour accepter à la fois l’ancien shape (legacy: `{ notebookId, sourceId, text }`) et le shape OpenAPI (`{ source_id, file_url, file_path, source_type, callback_url }`).
  - Callback sortant best‑effort vers `callback_url` (succès/échec) — à enrichir avec payload complet (title/summary/content) lors de l’implémentation extraction.
- `process-additional-sources`:
  - Placeholder enrichi minimal (message selon `type`). L’implémentation complète (websites/copied‑text + stockage `.txt` + indexation) est planifiée (Tâches 3/4).
- Chunking & embeddings:
  - Embeddings via `ollama.embeddings(model, chunk)` ajoutés. Chunker actuel par lignes (~500 chars). Passage à ~200 tokens + overlap et `metadata.loc.lines.from/to` planifié (Tâche 9).
- Statuts & échecs:
  - Mise à jour `sources.status`: `indexing -> ready`; voie d’échec `failed` ajoutée côté callback `process-document`.
- Generate‑audio:
  - Job asynchrone + callback (succès/échec) ajoutés avec URL audio simulée; pipeline complet (Coqui + upload) à venir (Tâche 6).

## Résultats des tests (contrat/intégration)
- Exécution locale (Node 22, PowerShell) — `npm test` dans `orchestrator/`.
- Synthèse:
  - health: PASS
  - ready (+failures): PASS
  - auth: PASS
  - webhooks (chat, process-document 202, generate-audio 202, additional-sources 200): PASS
  - chat integration/persist: PASS
  - generate-notebook-job: PASS
  - process-document-job: PASS
  - document-embeddings: PASS (embedding array présent)
  - process-document-status: PASS (indexing -> ready)

## Méthodologie
- Test‑First:
  - Lecture des specs `docs/spec/*.yaml` et mapping `docs/WEBHOOKS_MAPPING.md`.
  - Exécution systématique de la suite `test/contract/*` avant/après chaque changement.
- Sécurité d’édition:
  - Sauvegarde préalable des fichiers modifiés (`.bak`), remplacement intégral, vérification d’écriture, run tests, suppression/revert en cas d’échec.
- Parité stricte:
  - Aucune sémantique nouvelle côté Edge. Compat legacy maintenue transitoirement pour les tests locaux.
- Observabilité/robustesse (en cours):
  - Retry/timeouts côté Ollama déjà présents; idempotence et modèle d’erreur unifié à implémenter.

## Détails des changements (code)
- `orchestrator/src/services/ollama.ts`: ajout de `embeddings(model, prompt)` avec retry/timeout.
- `orchestrator/src/services/document.ts`: génération d’embeddings par chunk; MAJ statut source `indexing -> ready`; voie d’échec.
- `orchestrator/src/app.ts`:
  - `/webhook/process-document`: normalisation payload (OpenAPI + legacy), exécution immédiate + job async, callback best‑effort (succès/échec).
  - `/webhook/generate-audio`: job async + statut/URL + callback (succès/échec).
  - `/webhook/process-additional-sources`: placeholder enrichi.
- Aucun changement de contrats publics non documenté; compatibilité tests assurée.

## Décisions & Tâches Task‑Master
- Tâche 2 (process-document): SPEC en cours; IMPL partielle (contrat accepté + callback minimal); TEST: contrat/intégration actuels verts.
- Tâche 9 (chunking + embeddings 768 + metadata loc.lines): à implémenter (tokens ~200 + overlap, batch embeddings 768d, `loc.lines.from/to`).
- Tâche 16 (PDF bridge): extraction PDF/ASR à ajouter (PyMuPDF/pdfminer, Whisper) + payload complet callback (title/summary/content).
- Tâche 15 (Idempotency‑Key): middleware + stockage (TTL, fingerprint) + tests replays.

## Plan d’actions (prochaines itérations)
1) Extraction selon `source_type` (pdf/txt/audio) via `file_url` (mocks Storage/Whisper en tests).
2) Chunker tokens ~200 + overlap; calcul/propagation `loc.lines` jusqu’aux citations chat.
3) Implémentation complète `process-additional-sources` (websites/copied-text) + stockage `.txt`.
4) Idempotency‑Key (ingestion/génération) + modèle d’erreurs unifié avec `correlation_id`.

## Limitations

- Ce document n’introduit aucune exigence hors parité avec l’original.
- Les métriques chiffrées sont indicatives et non contractuelles. 