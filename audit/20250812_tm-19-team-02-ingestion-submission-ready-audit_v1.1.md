---
title: "Submission Ready — tm-19 Équipe 2 — Ingestion (parité stricte)"
doc_kind: audit
team: team-02
team_name: ingestion
version: 1.1
status: reviewed
author: AI-Implementateur
tm_ids: [19]
scope: ingestion
related_files:
  - orchestrator/src/app.ts
  - orchestrator/src/services/document.ts
  - orchestrator/src/services/storage.ts
  - docs/spec/process-document.yaml
  - docs/spec/process-additional-sources.yaml
  - docs/spec/openapi.yaml
  - infra/docker-compose.yml
  - scripts/dev/up.ps1
  - scripts/dev/status.ps1
  - .env.example
---

## Résumé
- Environnement d'audit standardisé fourni (Docker Compose: PostgreSQL+pgvector, Ollama) avec variables `.env` par défaut.
- Les vérifications tm‑19.6 peuvent désormais être exécutées en local via `pwsh scripts/dev/up.ps1` puis `npm --prefix orchestrator test`.

## Paramètres requis (confirmés)
- `POSTGRES_DSN=postgres://notebook:notebook@localhost:5432/notebook`
- `OLLAMA_BASE_URL=http://127.0.0.1:11434`

## Statut des services
- PostgreSQL (pgvector) et Ollama démarrés via `infra/docker-compose.yml`, healthchecks actifs.
- Vérification: `pwsh scripts/dev/status.ps1` retourne `ollama_health: true` quand l’API répond.

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
#TEST: orchestrator/test/e2e/chat-edge-send.test.ts

## Limitations
- Les modèles Ollama doivent être pré‑téléchargés selon vos besoins (`ollama pull nomic-embed-text`, `ollama pull llama3:instruct`).
- Environnements non Windows: adaptez les scripts (`bash`) si nécessaire.
