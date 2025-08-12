param(
  [string]$OllamaBaseUrl = "http://127.0.0.1:11434",
  [string]$Auth = "Bearer test",
  [string]$Llmmodel = "qwen3:8b-q4_K_M",
  [string]$EmbedModel = "nomic-embed-text"
)
$ErrorActionPreference = 'Stop'

Write-Host "[MOV-GPU] Initialisation environnement"
$env:NOTEBOOK_GENERATION_AUTH = $Auth
$env:OLLAMA_BASE_URL = $OllamaBaseUrl
$env:OLLAMA_LLM_MODEL = $Llmmodel
$env:OLLAMA_EMBED_MODEL = $EmbedModel
$env:NO_MOCKS = '1'
$env:GPU_ONLY = '1'

# Conseils d'optimisation Ollama (si supportés)
if (-not $env:OLLAMA_KEEP_ALIVE) { $env:OLLAMA_KEEP_ALIVE = '24h' }

Write-Host "[MOV-GPU] Build orchestrator"
pushd $PSScriptRoot
try {
  cd ..\orchestrator
  npm run -s build
  if ($LASTEXITCODE -ne 0) { throw "build failed" }
  Write-Host "[MOV-GPU] Lancement orchestrator (GPU_ONLY=1)"
  Write-Host "[MOV-GPU] URL: http://localhost:8000"
  node dist/index.js
} finally {
  popd
}
