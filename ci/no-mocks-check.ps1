param(
  [string]$NotebookAuth = "Bearer test",
  [string]$EmbedModel = "nomic-embed-text"
)
$ErrorActionPreference = 'Stop'

Write-Host "[no-mocks] Vérification démarrée"

$env:NO_MOCKS="1"
$env:GPU_ONLY="1"
$env:NOTEBOOK_GENERATION_AUTH=$NotebookAuth
$env:OLLAMA_EMBED_MODEL=$EmbedModel

# Exécuter un E2E minimal qui traverse les webhooks (chat-edge)
pushd ..\orchestrator
try {
  npm run -s build | Out-Null
  npm run -s test:e2e | Out-Null
  Write-Host "[no-mocks] OK: E2E a fonctionné avec NO_MOCKS=1"
  exit 0
} catch {
  Write-Host "[no-mocks] ECHEC: $_"
  exit 1
} finally {
  popd
}
