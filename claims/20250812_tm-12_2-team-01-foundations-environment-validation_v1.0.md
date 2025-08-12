---
task_id: "12.2"
title: "IMPL: Validation env + config centralisée"
team: "team-01-foundations"
author: "GitHub Copilot"
version: "v1.0"
date: "2025-08-12"
status: "review"
tags: ["config", "environment", "validation", "startup", "fail-fast"]
---

# Claims: Validation environment + configuration centralisée

## Contexte
Implémentation d'un système de validation centralisé des variables d'environnement avec fail-fast au startup pour éviter les erreurs de configuration en runtime.

## Implémentation

### Configuration centralisée
- **Schema Zod strict**: validation de toutes les variables d'env avec types et contraintes
- **Fail-fast startup**: `process.exit(1)` si configuration invalide avec messages d'erreur détaillés
- **Configuration typée**: type `Environment` exporté pour type safety dans tout le code
- **Cache singleton**: validation unique au startup avec `getEnvironment()` pour réutilisation

### Variables validées
```typescript
// Core application
PORT, NODE_ENV

// Database  
POSTGRES_DSN (required), DB_TIMEOUT_MS, DB_UPSERT_BATCH_SIZE

// Ollama/LLM
OLLAMA_BASE_URL (required URL), OLLAMA_EMBED_MODEL (required), 
OLLAMA_CHAT_MODEL, OLLAMA_TIMEOUT_MS

// Security & Auth
NOTEBOOK_GENERATION_AUTH (min 8 chars), GPU_ONLY (0|1)

// Logging & Observability  
LOG_LEVEL, LOG_SAMPLE_RATE (0-1)

// Resilience
IDEMPOTENCY_TTL_MS, RETRY_* (attempts, delays, backoff)

// Future (Task 11)
RATE_LIMIT_* (optional, prepared)
```

### Validation helpers
- `validateRequiredServices()`: vérifie services critiques
- `validateGpuConfiguration()`: cohérence GPU_ONLY + models
- `validateStartupConfiguration()`: orchestration complète avec logging

### Integration startup
```typescript
// En tête de app.ts
await validateStartupConfiguration();
const env = getEnvironment();
```

## Comportement

### Cas valide
```bash
POSTGRES_DSN=postgresql://...
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBED_MODEL=nomic-embed-text
NOTEBOOK_GENERATION_AUTH=secret-token-123

→ ✅ Configuration summary affiché
→ 🚀 Startup successful
```

### Cas invalide
```bash
OLLAMA_BASE_URL=not-a-url
NOTEBOOK_GENERATION_AUTH=123

→ ❌ Environment validation failed:
→   - OLLAMA_BASE_URL: Invalid url
→   - NOTEBOOK_GENERATION_AUTH: String must contain at least 8 characters
→ process.exit(1)
```

## Preuves

#TEST: orchestrator/test/contract/environment-validation.test.ts → PASS
- Scénario minimal valid: parsing successful + no missing services  
- Scénario missing required: validation throws ZodError avec issues détaillés
- Scénario invalid values: URL malformée + token trop court + port invalide → fails

#TEST: Intégration startup dans app.ts avec validation avant Fastify init
#TEST: npm run test:contract → PASS (suite complète incluant validation env)

## Avantages parité

- **Fail-fast identique**: erreurs de config détectées au startup vs runtime
- **Messages explicites**: aide au debugging des déploiements
- **Type safety**: élimine les erreurs `process.env.UNDEFINED` 
- **Validation stricte**: URLs, ports, tokens conformes aux specs

## Limitations

- Validation uniquement au startup (pas de rechargement runtime des configs)
- Variables optionnelles futures (RATE_LIMIT_*) préparées mais pas utilisées
- Pas de validation des endpoints externes (DB/Ollama) accessibles - couvert par /ready
- Schema Zod ajoute dépendance, mais déjà utilisé ailleurs dans le projet
