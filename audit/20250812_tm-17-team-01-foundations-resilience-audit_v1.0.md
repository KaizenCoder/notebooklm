---
title: "Audit — tm-17 (Foundations Resilience Framework)"
doc_kind: audit
team: team-01
team_name: foundations
author: AI-Auditeur
version: 1.0
status: reviewed
tm_ids: [17]
scope: resilience
related_files:
  - orchestrator/src/utils/resilience.ts
  - orchestrator/test/integration/resilience.test.ts
---

## Résumé
- Framework de résilience livré: `withRetry` (backoff exponentiel), `withTimeout`, `CircuitBreaker`, wrapper `createResilientOllamaAdapter`.
- Comportements validés par tests d’intégration (réessais, conditions, timeouts, états CB et wrapper Ollama).

## Preuves (#TEST)
#TEST: orchestrator/test/integration/resilience.test.ts

## Constats
- `withRetry`: réessais conditionnels, backoff exponentiel, arrêt sur erreur non‑réessayable.
- `withTimeout`: échec typé `TimeoutError` avec durée incluse.
- `CircuitBreaker`: transitions CLOSED→OPEN→HALF_OPEN→CLOSED selon seuil/temporisation.
- Wrapper Ollama: applique retry+CB aux appels `generateEmbedding` et `chat`.

## Exemples (anonymisés)
```json
{"retry":{"attempts":3,"delay_ms":[100,200],"result":"success"}}
{"timeout":{"timeout_ms":1000,"error":"TimeoutError"}}
{"circuit_breaker":{"state":"OPEN","threshold":3}}
```

## Limitations
- Seuils et délais par défaut à ajuster en prod selon SLOs.
- Pas de télémétrie/export métriques intégrés (peut être ajouté ultérieurement).
