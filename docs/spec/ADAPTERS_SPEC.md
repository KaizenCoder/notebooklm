---
id: TM-8.5
title: SPEC — Adapters Interfaces & Errors
scope: adapters
version: 1.0
owner: team-01
---

# SPEC — Adapters

## Objectif
Interfaces minces, mockables, sans renommage d’ENVs.

## Contrat
- Supabase RPC wrapper, DB client, Ollama chat/embeddings, Whisper ASR, Storage upload/download, Audio synth.
- Modèle d’erreurs: ErrorResponse { code, message, details?, correlation_id }.

## Tests requis
- #TEST: orchestrator/test/contract/webhooks.test.ts
- #TEST: orchestrator/test/contract/chat-integration.test.ts

## Limitations
- Impl concrètes partiellement mockées (Whisper/Coqui/Storage).
