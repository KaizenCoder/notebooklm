Orchestrateur
PORT: 8000
ORCHESTRATOR_BASE_URL: http://127.0.0.1:8000
Variables à fournir (alignées src/env.ts)
NOTEBOOK_GENERATION_AUTH: Bearer test
POSTGRES_DSN: postgres://postgres:postgres@127.0.0.1:54322/postgres
OLLAMA_BASE_URL: http://127.0.0.1:11434
OLLAMA_LLM_MODEL: qwen2.5 (ou autre installé sur D:\modeles_llm\)
OLLAMA_EMBED_MODEL: nomic-embed-text
REDIS_URL: redis://127.0.0.1:6379
SUPABASE_URL: http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY: service key locale (à garder côté Edge/serveur)
Modèles Ollama
Stockage/chargement uniquement sur D:\modeles_llm\ (conformément à la règle).
Noms suggérés: LLM qwen2.5, embeddings nomic-embed-text (ou ceux effectivement présents).
Redis (bus multi‑flux)
team: team03
agents: orchestrator, impl_team03, auditor_team03
streams: agents:global, agents:orchestrator, agents:pair:team03
Matrice “secret → endpoint local” (pour Supabase Edge Functions)
NOTEBOOK_GENERATION_AUTH → "Bearer test"
ORCHESTRATOR_BASE_URL → http://127.0.0.1:8000
process-document → {ORCHESTRATOR_BASE_URL}/webhook/process-document
process-additional-sources → {ORCHESTRATOR_BASE_URL}/webhook/process-additional-sources
send-chat-message → {ORCHESTRATOR_BASE_URL}/webhook/chat
generate-audio-overview → {ORCHESTRATOR_BASE_URL}/webhook/generate-audio
refresh-audio-url → {ORCHESTRATOR_BASE_URL}/webhook/refresh-audio-url
POSTGRES_DSN → postgres://postgres:postgres@127.0.0.1:54322/postgres
REDIS_URL → redis://127.0.0.1:6379
OLLAMA_BASE_URL → http://127.0.0.1:11434
Check‑list de validation FE↔BE
Chat: invoke('send-chat-message') → réponses avec citations; logs OK; STATUS_UPDATE sur agents:pair:team03
Ingestion: invoke('process-document') → statut processing→completed; sources/documents OK; messages bus
Additional sources: invoke('process-additional-sources') → sources créées; bus OK
Audio: invoke('generate-audio-overview'), puis 'refresh-audio-url' si expiré → player OK
Observabilité: heartbeats 600s±30s visibles; agents-ready.mjs montre last-seen
Sécurité: aucun secret dans le FE; seulement dans Supabase (Edge/serveur)