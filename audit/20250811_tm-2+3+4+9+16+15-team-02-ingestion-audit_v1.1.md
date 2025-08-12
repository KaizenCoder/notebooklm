---
title: "Audit Équipe 2 — Ingestion (process-document, chunking, PDF Bridge)"
doc_kind: audit
team: team-02
team_name: ingestion
tm_ids: [2, 3, 4, 9, 16, 15]
scope: process-document|additional-sources|chunking|pdf-bridge|idempotency
status: draft
version: 1.1
author: ia
related_files:
  - "../claims/20250811_tm-2+9+16+15-team-02-ingestion-claim_v1.0.md"
---

# Audit Équipe 2 — Ingestion (process-document, chunking, PDF Bridge)

#TEST: orchestrator/test/contract/process-document-job.test.ts
#TEST: orchestrator/test/contract/document-embeddings.test.ts
#TEST: orchestrator/test/contract/process-document-status.test.ts
#TEST: orchestrator/test/contract/webhooks.test.ts

#SIMULATION

## Objet
Audit de la mise en œuvre de l’ingestion par l’Équipe 2, comparaison aux spécifications (OpenAPI, Mapping Webhooks) et au comportement attendu du dépôt original (parité stricte), avec recommandations.

## Résumé exécutif
- Tous les tests actuels passent, mais l’implémentation d’ingestion est minimale et **ne respecte pas encore** le contrat OpenAPI ni la parité complète.
- Écarts majeurs : payload `process-document` non conforme, absence d’extraction PDF/TXT/Audio depuis `file_url`/`file_path`, absence de `callback_url` sortant, `process-additional-sources` placeholder.
- Écarts importants : pas d’Idempotency-Key, pas de voie d’échec (`sources.status='failed'` + callback), chunking non conforme (tokens ~200 + overlap), dimension d’embedding non garantie (768).

## Base de référence
- Spécifications: `docs/spec/openapi.yaml`, `docs/spec/process-document.yaml`, `docs/spec/process-additional-sources.yaml`.
- Exemples de payloads: `docs/ANNEXES_PAYLOADS.md`.
- Implémentation: `orchestrator/src/app.ts`, `orchestrator/src/services/document.ts`, `db.ts`, `ollama.ts`, `supabase.ts`, `jobs.ts`.

## Constat détaillé

### 1) Contrat `process-document` (Bloquant)
- Spec attend: `{ source_id, file_url, file_path, source_type, callback_url }` (401/202/4xx/5xx).
- Impl actuelle: `{ notebookId, sourceId, text }`.
- Manques:
  - Pas d’extraction via `file_url`/`file_path` selon `source_type` (pdf/txt/audio).
  - Pas d’appel `callback_url` en fin de traitement (success/failed).
  - Pas de validation stricte du payload ni de codes d’erreur 4xx en cas d’entrée invalide.

### 2) `process-additional-sources` (Bloquant par parité)
- Spec: `oneOf` `copied-text` | `multiple-websites` avec effets (stockage texte, update sources, indexation).
- Impl: placeholder `{ success: true, message, webhookResponse: {} }` sans traitement.

### 3) Chunking & Citations (Élevé)
- Guideline: ~200 tokens + overlap; `metadata.loc.lines.from/to` pour la précision des citations.
- Impl: chunking par lignes et longueur (~500 chars), pas de notion de tokens/overlap.

### 4) Embeddings (Élevé)
- Parité attendue: embeddings via Ollama (ex. `nomic-embed-text`), dimension cohérente (p.ex. 768) avec pgvector.
- Impl: aucune vérification de dimension; tests utilisent 8 dims simulées.

### 5) Idempotency & Robustesse (Élevé)
- Spec OpenAPI inclut `Idempotency-Key` (paramètre). Non géré dans le code.
- Pas de retry/backoff spécifique côté ingestion; existant côté Ollama pour `chat/embeddings` seulement.

### 6) Statuts & Échecs (Élevé)
- Manque voie d’erreur: `sources.status='failed'` et callback d’échec.
- Actuellement: `indexing` → `ready` uniquement.

### 7) Logs & Traçabilité (Moyen)
- Pas de `correlation_id` par requête ni de mesures de durée par étape (extraction/embeddings/rag) pour ingestion.

## Recommandations

1. Adapter le handler `/webhook/process-document` au contrat OpenAPI (tout en supportant, transitoirement, l’ancien payload pour ne pas casser les tests existants).
2. Implémenter l’extraction:
   - `pdf`: librairie Node (ex: `pdf-parse`) depuis `file_url`/Storage.
   - `txt`: lecture texte directe.
   - `audio`: appel Whisper local (`WHISPER_ASR_URL`) → texte.
3. Générer `title`/`summary` via LLM comme dans l’original; mise à jour `sources`.
4. Appeler `callback_url` avec payload conforme (success/failed) et gérer les erreurs.
5. Implémenter `process-additional-sources` pour `copied-text` et `multiple-websites` (stockage `.txt`, update `sources`, indexation).
6. Gérer `Idempotency-Key` (table ou cache mémoire) pour éviter les doubles traitements.
7. Enforcer dimension embedding (p.ex. 768) et rejeter/logguer si mismatch; batch embeddings.
8. Refactor chunking vers ~200 tokens + overlap; conserver `loc.lines.from/to`.
9. Étendre la suite de tests (contract + intégration):
   - Contrat OpenAPI (payload + 202), callback reçu (server de capture), voies d’échec, idempotency.
   - Cas PDF/audio (mocks) et `process-additional-sources` complet.
10. Conformité Windows/Ollama: valider montage `D:\modeles_llm` via Docker (`OLLAMA_MODELS=/root/.ollama`).

## Points de vigilance
- Ne pas modifier la sémantique des Edge Functions; seules les `*_WEBHOOK_URL` doivent pointer vers l’orchestrateur.
- Toute divergence doit être consignée dans `docs/DECISIONS.md` avec ID de tâche Task‑Master.

## Limitations
- Cet audit s’appuie sur des tests simulés et l’état actuel du code; l’absence d’E2E réels avec Supabase local/Whisper/Coqui peut masquer des écarts.
- Les métriques de performance ne sont pas instrumentées dans la codebase; les objectifs sont indicatifs. 