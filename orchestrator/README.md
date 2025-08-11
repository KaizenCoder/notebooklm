# Orchestrator (squelette) — Epics 7, 8, 14, 18

Contenu
- Fastify + TypeScript
- Middleware d'auth sur /webhook/* (Authorization = NOTEBOOK_GENERATION_AUTH)
- /health (vivacité), /ready (DB + Ollama + modèles présents)
- Adapters: PostgreSQL (pg) et Ollama (undici)
- Tests contrat minimaux (health, ready)

Commandes
- npm install
- npm run dev — démarre en watch sur :8000 (GPU_ONLY=1 par défaut via cross-env)
- npm test — exécute 2 tests rapides

ENV minimales
- NOTEBOOK_GENERATION_AUTH=secret
- OLLAMA_BASE_URL=http://ollama:11434
- (optionnel) POSTGRES_DSN=postgres://user:pass@host:5432/db
- (optionnel) OLLAMA_EMBED_MODEL=nomic-embed-text
- (optionnel) OLLAMA_LLM_MODEL=qwen3:8b-q4_K_M
 - (optionnel) GPU_ONLY=1 (activé par défaut en dev; mettez GPU_ONLY=0 pour désactiver le contrôle GPU)

Notes
- Les routes /webhook/* sont des placeholders; elles seront implémentées selon les specs OpenAPI.
- /ready renvoie 503 si DB ou Ollama indisponibles ou si des modèles requis manquent.
