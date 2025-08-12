---
id: TM-14.1
title: SPEC — Health & Readiness
scope: health|ready
version: 1.0
owner: team-01
---

# SPEC — Health & Readiness

## Objectif
Définir les exigences /health et /ready (ENVs, dépendances, codes).

## Contrat
- GET /health → 200 { status: ok }
- GET /ready → 200/503 { code, message, details?, correlation_id }
- GPU_ONLY=1 → probe GPU (embeddings) requise; 503 si KO.

## ENVs
- NOTEBOOK_GENERATION_AUTH (pour webhooks, info contexte)
- OLLAMA_BASE_URL (http)
- OLLAMA_EMBED_MODEL, OLLAMA_LLM_MODEL (si GPU_ONLY=1)

## Tests requis
- #TEST: orchestrator/test/contract/ready.test.ts
- #TEST: orchestrator/test/contract/ready-failures.test.ts

## Limitations
- Détails dépendances minimaux; pas d’auth sur /health|/ready.
