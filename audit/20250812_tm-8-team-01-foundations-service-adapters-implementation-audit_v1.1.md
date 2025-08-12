---
title: "Task 8 — Service Adapters — Audit (implementation)"
doc_kind: audit
team: team-01
team_name: foundations
tm_ids: [8]
scope: adapters
status: passed
version: 1.1
author: AI-Auditeur
related_files:
  - orchestrator/src/services/ollama.ts
  - orchestrator/src/services/supabase.ts
  - orchestrator/src/services/storage.ts
  - orchestrator/src/services/whisper.ts
  - orchestrator/test/integration/storage-adapter.test.ts
  - orchestrator/test/integration/whisper-adapter.test.ts
  - orchestrator/test/integration/coqui-adapter.test.ts
---

#TEST: orchestrator/test/integration/storage-adapter.test.ts
#TEST: orchestrator/test/integration/whisper-adapter.test.ts
#TEST: orchestrator/test/integration/coqui-adapter.test.ts

## Résumé
- Adapters minces et moquables: Ollama, Supabase, Storage, Whisper, Coqui.
- Résilience intégrée sur Ollama; fallbacks sur Whisper/Coqui.

## Points de parité clés
- **Storage**: `fetchText`, `upload`, `uploadText` avec timeouts.
- **Whisper/Coqui**: retours de secours si indisponibilité API.
- **Supabase**: RPC `match_documents` conforme (si env configuré).

## Preuves (#TEST)
- `#TEST: orchestrator/test/integration/storage-adapter.test.ts`
- `#TEST: orchestrator/test/integration/whisper-adapter.test.ts`
- `#TEST: orchestrator/test/integration/coqui-adapter.test.ts`
- Code: `orchestrator/src/services/{ollama,supabase,storage,whisper}.ts`

## Limitations
- Supabase nécessite variables d'environnement pour des tests bout-en-bout.

## Recommandations
- Ajouter des tests intégrés avec un stub d'API Supabase pour CI offline.

## Historique des versions
- v1.1: Consolidation des tests et fallbacks; passage au vert confirmé.
