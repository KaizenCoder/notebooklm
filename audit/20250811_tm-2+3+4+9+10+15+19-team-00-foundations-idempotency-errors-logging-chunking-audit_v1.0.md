---
title: "Demande de Généralisation — Idempotency-Key, Erreurs, Correlation, Chunking/Embeddings"
doc_kind: audit
team: team-00
team_name: foundations
tm_ids: [2, 3, 4, 9, 10, 15, 19]
scope: idempotency|errors|logging|chunking
status: draft
version: 1.0
author: ia
related_files:
  - "docs/DECISIONS.md"
  - "docs/spec/openapi.yaml"
---

#TEST: orchestrator/test/contract/*.test.ts

## Objet
Formaliser la généralisation transverse des patterns recommandés: Idempotency-Key pour ingestion, modèle d’erreur contractuel, correlation_id dans logs, chunking tokenisé + embeddings 768.

## Proposition
- Idempotency-Key: middleware + stockage TTL; endpoints cibles: process-document, additional-sources, generate-audio.
- Erreurs contractuelles: utiliser `ErrorResponse` OpenAPI; valider payloads; retourner 400/401/422/500 avec corps standard.
- Correlation/logs: `correlation_id` par requête loggé systématiquement.
- Chunking/Embeddings: passer à tokens (~200) + overlap; embeddings 768 en batch; conserver `loc.lines`.

## Justification
Cohérence et robustesse; parité avec l’original; répond aux recommandations des audits Équipe 2.

## Suivi
- Voir `docs/DECISIONS.md` entrée TM-19/2.7/3.6/4.6 et tâches 15/9/10/2/3/4/19.

## Limitations
- Cette demande ne modifie pas le code; elle cadre les futurs PR et tests. 