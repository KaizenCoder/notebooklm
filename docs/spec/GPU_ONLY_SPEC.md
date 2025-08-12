---
id: TM-18.1
title: SPEC — GPU-only Enforcement
scope: gpu-only
version: 1.0
owner: team-01
---

# SPEC — GPU-only

## Règles
- Si GPU_ONLY=1 et OLLAMA_EMBED_MODEL défini → sonde embeddings obligatoire.
- Échec sonde → 503 { code: GPU_REQUIRED } sur webhooks.

## Endpoints
- POST /webhook/chat, /webhook/process-document, /webhook/process-additional-sources.

## Tests requis
- #TEST: orchestrator/test/contract/gpu-runtime-guard.test.ts

## Limitations
- Cache de probe (~15s) peut retarder la détection d’état.
