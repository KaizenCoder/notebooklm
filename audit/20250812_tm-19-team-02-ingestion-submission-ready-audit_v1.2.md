---
title: "Submission Ready — tm-19 Équipe 2 — Ingestion (parité stricte)"
doc_kind: audit
team: team-02
team_name: ingestion
version: 1.2
status: done
author: AI-Auditeur
tm_ids: [19]
scope: ingestion
related_files:
  - orchestrator/src/app.ts
  - orchestrator/src/services/document.ts
  - orchestrator/src/services/storage.ts
  - orchestrator/src/services/db.ts
  - orchestrator/src/services/ollama.ts
  - docs/spec/process-document.yaml
  - docs/spec/process-additional-sources.yaml
  - docs/spec/openapi.yaml
  - infra/docker-compose.yml
  - scripts/dev/up.ps1
  - scripts/dev/status.ps1
  - .env.example
  - ONBOARDING_AI.md
  - docs/TECHNICAL_GUIDELINES.md
---

## Résumé
- Limitation d'exécution des tests (tm‑19.6) résolue: une infra Docker Compose standard est fournie (PostgreSQL+pgvector, Ollama) avec valeurs `.env` par défaut.
- Exécution locale validée: tests contrat + intégration + E2E verts avec:
  - `POSTGRES_DSN=postgres://notebook:notebook@localhost:5432/notebook`
  - `OLLAMA_BASE_URL=http://127.0.0.1:11434`
- Journaux d'étapes et idempotence conformes aux spécifications; parité stricte atteinte.

## Procédure d'exécution (locale)
1. Démarrer l'infra:
   - `pwsh scripts/dev/up.ps1` (ou `-Recreate`)
   - Vérifier: `pwsh scripts/dev/status.ps1` (PostgreSQL healthy, Ollama API accessible)
2. Variables d'environnement minimales: voir `.env.example`
3. Lancer la suite: `npm --prefix orchestrator test`

## Paramètres confirmés
- `POSTGRES_DSN=postgres://notebook:notebook@localhost:5432/notebook`
- `OLLAMA_BASE_URL=http://127.0.0.1:11434`

## Preuves (tests & exécutions)
- Contrats/Intégration/E2E — verts localement.

#TEST: orchestrator/test/contract/process-document-job.test.ts
#TEST: orchestrator/test/contract/process-document-status.test.ts
#TEST: orchestrator/test/contract/document-embeddings.test.ts
#TEST: orchestrator/test/contract/embeddings-dim-mismatch.test.ts
#TEST: orchestrator/test/contract/payload-validation.test.ts
#TEST: orchestrator/test/contract/additional-sources.test.ts
#TEST: orchestrator/test/contract/idempotency.test.ts
#TEST: orchestrator/test/contract/idempotency-additional-sources.test.ts
#TEST: orchestrator/test/integration/process-document-step-logs.test.ts
#TEST: orchestrator/test/integration/additional-sources-storage-db.test.ts
#TEST: orchestrator/test/integration/generate-audio-step-logs.test.ts
#TEST: orchestrator/test/contract/logging-redaction.test.ts
#TEST: orchestrator/test/contract/logging-sampling.test.ts
#TEST: orchestrator/test/contract/chat-llm-metrics.test.ts
#TEST: orchestrator/test/e2e/chat-edge-send.test.ts

## Limitations
- Les modèles Ollama doivent être présents sur `D:\\modeles_llm\\ollama`. Utiliser:
  - `docker exec -it notebooklm_ollama ollama pull nomic-embed-text`
  - `docker exec -it notebooklm_ollama ollama pull llama3:instruct`
- Le health Docker d'Ollama peut rester "unhealthy" tant que les modèles ne sont pas présents; l'API reste toutefois accessible (`/api/tags`).
- Scripts fournis pour Windows PowerShell; adapter à Bash/WSL si nécessaire.
