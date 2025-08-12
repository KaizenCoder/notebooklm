---
title: "Task 18 — GPU-only Enforcement — Audit (implementation)"
doc_kind: audit
team: team-01
team_name: foundations
tm_ids: [18]
scope: gpu-enforcement
status: passed
version: 1.1
author: AI-Auditeur
related_files:
  - orchestrator/src/app.ts
  - orchestrator/src/services/ollama.ts
  - orchestrator/test/contract/gpu-required.test.ts
  - orchestrator/test/contract/gpu-runtime-guard.test.ts
  - orchestrator/test/e2e/chat-edge-send.test.ts
---

#TEST: orchestrator/test/contract/gpu-required.test.ts
#TEST: orchestrator/test/contract/gpu-runtime-guard.test.ts
#TEST: orchestrator/test/e2e/chat-edge-send.test.ts

## Résumé
- Enforcement GPU-only au boot et à l'exécution: sondes `checkGpu()` + garde sur routes.

## Points de parité clés
- `/webhook/*` retourne `503 GPU_REQUIRED` si GPU indisponible et `GPU_ONLY=1`.
- Intégration readiness: validation des modèles et de la sonde GPU.

## Preuves (#TEST)
- `#TEST: orchestrator/test/contract/gpu-required.test.ts`
- `#TEST: orchestrator/test/contract/gpu-runtime-guard.test.ts`
- `#TEST: orchestrator/test/e2e/chat-edge-send.test.ts` (mode NO_MOCKS)
- Code: `orchestrator/src/app.ts`, `orchestrator/src/services/ollama.ts`

## Limitations
- Sondage GPU mis en cache 15s; peut retarder la détection d'un changement d'état.

## Recommandations
- Ajouter un endpoint d'admin pour invalider le cache de sonde si nécessaire.

## Historique des versions
- v1.1: Consolidation des tests runtime/contract; exécution NO_MOCKS validée.
