---
title: "Ingestion — process-document (AUDIT v1)"
doc_kind: audit
team: team-02
team_name: ingestion
tm_ids: [2, 9, 16, 15]
scope: process-document
status: draft
version: 1.0
author: ia
related_files:
  - "claims/20250811_tm-2+9+16+15-team-02-ingestion-claim_v1.0.md"
  - "docs/spec/process-document.yaml"
  - "docs/ANNEXES_PAYLOADS.md"
  - "orchestrator/src/app.ts"
  - "orchestrator/src/services/document.ts"
---

# Audit — process-document (Ingestion)

#TEST: orchestrator/test/contract/process-document-job.test.ts
#TEST: orchestrator/test/contract/document-embeddings.test.ts
#TEST: orchestrator/test/contract/process-document-status.test.ts
#TEST: orchestrator/test/contract/webhooks.test.ts

## Résumé (TL;DR)

- Objet de l’audit: vérifier la conformité de `POST /webhook/process-document` (contrat OpenAPI, pipeline extraction→indexation, callbacks) et des effets BD.
- Décision: acceptation partielle (contrat legacy accepté, 202 et indexation basique OK). Non conforme à la parité stricte (extraction `file_url/file_path`, callback complet, idempotence, chunking tokens, embeddings 768).
- Points bloquants: extraction PDF/TXT/Audio manquante, `callback_url` non utilisé, Idempotency-Key absente, chunking non tokenisé, dimension embeddings non garantie.

## Références

- Claim associé: `claims/20250811_tm-2+9+16+15-team-02-ingestion-claim_v1.0.md`
- Spécifications: `docs/spec/process-document.yaml`
- Workflows originaux: `docs/clone/...`
- Annexes payloads: `docs/ANNEXES_PAYLOADS.md`

## Méthodologie

- Jeux d’essai: tests contractuels `test/contract/*` (voir #TEST), payloads issus des annexes.
- Procédure: exécution `npm test` (Node 22, PowerShell), inspection code `app.ts`, `services/document.ts`.
- Environnements/ENVs: `NOTEBOOK_GENERATION_AUTH`, `OLLAMA_*`, `GPU_ONLY`.

## Vérifications de parité

- HTTP (statuts, payloads, entêtes): 202 renvoyé; auth requise. Payload OpenAPI non supporté (legacy seulement).
- Side‑effects DB: upsert `documents` avec `metadata.notebook_id/source_id/loc.lines`; statut `sources`: `indexing -> ready` OK. Pas de voie `failed` vérifiée.
- Stockage (buckets, clés): non couvert (pas de download via `file_url`).
- Logs & erreurs (format contractuel): basiques; pas de `correlation_id` ni modèle d’erreurs unifié.

## Résultats

- Observations: chunking par lignes (~500 chars), embeddings appelés si modèle défini; upsert effectué.
- Écarts détectés:
  - Contrat OpenAPI: champs requis (`source_id`, `file_url`, `file_path`, `source_type`, `callback_url`) non pris en charge.
  - Extraction: PDF/TXT/Audio non implémentée; aucune utilisation de `file_url`.
  - Callback: pas d’appel à `callback_url` avec payload (title/summary/content, statut).
  - Idempotence: pas de prise en charge `Idempotency-Key`.
  - Chunking: pas en tokens (~200) avec overlap; citations à affiner.
  - Embeddings: dimension 768 non garantie/enforcée.
- Captures/logs: voir sortie `npm test` (tous verts; couverture partielle).

## Recommandations & décisions

- Actions requises:
  - Implémenter normalisation payload OpenAPI + legacy; valider champs; retourner 4xx si invalide.
  - Extraction par `source_type` (pdf/txt/audio) depuis `file_url` (mocks Storage/Whisper en tests).
  - Callback vers `callback_url` (success/failed) avec `title/summary/content`.
  - Gérer `Idempotency-Key` (stockage TTL, fingerprint) et tests de replays.
  - Chunker tokens ~200 + overlap; conserver `loc.lines` pour citations.
  - Enforcer embeddings 768; batch embeddings.
- Acceptation conditionnelle / Refus: acceptation partielle pour itération actuelle; refus pour clôture parité stricte tant que les actions ci‑dessus ne sont pas implémentées et testées.

## Limitations

- Cet audit ne modifie pas les contrats; il constate l’écart et s’appuie sur tests simulés, sans E2E Supabase/Whisper/Coqui.

## Suivi Task‑Master

- Tâches liées: 2, 9, 16, 15, 19
- Commandes:
  - `task-master set-status --id=2.7 --status=in-progress`
  - `task-master set-status --id=19.6 --status=pending`

## Historique des versions

- v1.0: création de l’audit 