---
title: "Équipe 2 — additional-sources + PDF/ASR (contrats + impl)"
doc_kind: claim
team: team-02
team_name: ingestion
tm_ids: [2, 3, 4, 16]
scope: process-document|additional-sources|pdf-bridge
status: draft
version: 1.0
author: ia
related_files:
  - orchestrator/src/app.ts
  - orchestrator/src/services/document.ts
  - orchestrator/src/services/storage.ts
  - orchestrator/src/services/pdf.ts
  - orchestrator/src/services/whisper.ts
  - docs/spec/openapi.yaml
  - docs/spec/process-document.yaml
  - orchestrator/test/contract/additional-sources.test.ts
  - orchestrator/test/contract/process-document-txt.test.ts
  - orchestrator/test/contract/process-document-pdf-audio.test.ts
---

# Claim — Équipe 2 — additional-sources + PDF/ASR (contrats + impl)

#TEST: orchestrator/test/contract/additional-sources.test.ts
#TEST: orchestrator/test/contract/process-document-txt.test.ts
#TEST: orchestrator/test/contract/process-document-pdf-audio.test.ts
#TEST: orchestrator/test/contract/process-document-job.test.ts
#TEST: orchestrator/test/contract/document-embeddings.test.ts
#TEST: orchestrator/test/contract/process-document-status.test.ts

## Résumé (TL;DR)

- Problème constaté: `process-additional-sources` était placeholder; `process-document` ne couvrait pas PDF/ASR; absence de tests d’intégration pour ces cas.
- Proposition succincte: implémenter additional-sources (copied-text, multiple-websites) avec indexation; introduire services PDF/Whisper mockés et brancher `document.ts` pour `source_type: pdf|audio`; ajouter tests d’intégration.
- Bénéfice attendu: parité fonctionnelle renforcée côté ingestion; préparation pour callbacks complets et E2E.

## Contexte

- Contexte fonctionnel/technique: Parité stricte avec les Edge Functions d’origine; ingestion multi-sources; extraction texte selon type puis chunking/embeddings/upsert.
- Références: `docs/spec/*`, `docs/WEBHOOKS_MAPPING.md`, `docs/ANNEXES_PAYLOADS.md`, `docs/clone...`

## Portée et périmètre (scope)

- Équipe: team-02 / ingestion
- Tâches Task‑Master visées: 2 (process-document), 3 (additional-sources websites), 4 (additional-sources copied-text), 16 (pdf-bridge)
- Endpoints/domaines: process-document, additional-sources, pdf-bridge

## Demande et motivation

- Description détaillée de la revendication:
  - Implémenter `POST /webhook/process-additional-sources` pour:
    - `copied-text`: stockage logique + indexation via `docProc`.
    - `multiple-websites`: boucle `urls[]/sourceIds[]`, indexation placeholder.
  - Étendre `document.ts` pour charger texte selon `source_type`:
    - `txt`: via `storage.fetchText(file_url)`
    - `pdf`: via `pdf.extractText(file_url)` (mock)
    - `audio`: via `whisper.transcribe(file_url)` (mock)
  - Ajouter tests d’intégration dédiés (txt, pdf, audio) validant l’upsert `documents`.
- Justification (parité, bug, dette, conformité, performance, sécurité): Aligne l’ingestion avec les flux amont; réduit la dette technique; prépare les callbacks complets.

## Critères d’acceptation

- [ ] CA1: additional-sources accepte `copied-text` et `multiple-websites` et déclenche indexation.
- [ ] CA2: process-document gère `source_type: pdf|audio|txt` et insère des chunks avec `metadata.loc.lines`.
- [ ] CA3: suite de tests d’intégration verte pour txt/pdf/audio + additional-sources.

## Impacts

- API/Contrats I/O: pas de rupture; note transitoire documentée dans `process-document.yaml`.
- Code & modules: nouveaux services `storage`, `pdf` (mock), `whisper` (mock); appuis sur `document.ts`.
- Schéma/DB/Storage: inchangé; upserts sur `documents` + métadonnées.
- Performance/latences: inchangé (mocks); à instrumenter lors du pont PDF réel.
- Sécurité/compliance: inchangé; auth webhook maintenue; idempotence supportée côté ingestion.

## Risques et alternatives

- Risques: divergence subtile avec l’original tant que les mocks (PDF/ASR) ne sont pas remplacés par le pont réel.
- Atténuations: tests d’intégration couvrants; plan d’évolution vers bridge Python.
- Alternatives évaluées: extraction PDF côté Node (biblios JS) – retenu: bridge Python pour parité.

## Références

- Spécifications: `docs/spec/openapi.yaml`, `docs/spec/process-document.yaml`
- Workflows originaux: `docs/clone/...`
- Annexes payloads: `docs/ANNEXES_PAYLOADS.md`

## Limitations

- Ce document n’introduit aucune exigence hors parité avec l’original.
- Les métriques chiffrées sont indicatives et non contractuelles.

## Suivi Task‑Master

- Tâches liées: 2, 3, 4, 16
- Commandes:
  - `task-master set-status --id=2.5 --status=in-progress`
  - `task-master set-status --id=3.4,4.4 --status=review`

## Historique des versions

- v1.0: création du claim additional-sources + PDF/ASR (impl + tests) 