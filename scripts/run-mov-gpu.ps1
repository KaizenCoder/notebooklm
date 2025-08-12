param(
  [string]$OllamaBaseUrl = "http://127.0.0.1:11434",
  [string]$Auth = "Bearer test",
  [string]$Llmmodel = "qwen3:8b-q4_K_M",
  [string]$EmbedModel = "nomic-embed-text",
  [string]$PostgresDsn = "postgres://postgres:postgres@localhost:5432/notebooklm"
)
$ErrorActionPreference = 'Stop'
Write-Host "--- Démarrage Orchestrator MOV (GPU_ONLY=1, NO_MOCKS=1) ---"
$env:NOTEBOOK_GENERATION_AUTH=$Auth
$env:OLLAMA_BASE_URL=$OllamaBaseUrl
$env:OLLAMA_LLM_MODEL=$Llmmodel
$env:OLLAMA_EMBED_MODEL=$EmbedModel
$env:NO_MOCKS="1"
$env:GPU_ONLY="1"
$env:POSTGRES_DSN=$PostgresDsn
$orchestratorDir = Join-Path $PSScriptRoot '..\orchestrator'
pushd $orchestratorDir
try {
  npm run build
  node dist/index.js
} finally {
  popd
}
