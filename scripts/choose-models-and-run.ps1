param(
  [string]$ReadyUrl = 'http://127.0.0.1:8000/ready',
  [int]$ReadyTimeoutSec = 120
)
$ErrorActionPreference = 'Stop'
function Get-OllamaModels {
  try {
    $tags = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 5
    if ($tags -and $tags.models) { return @($tags.models | ForEach-Object { $_.name }) }
  } catch {}
  return @()
}
$names = Get-OllamaModels
if ($names.Count -eq 0) { Write-Host 'Aucun modèle détecté via Ollama API'; exit 2 }
Write-Host 'Modèles détectés:'
$names | ForEach-Object { Write-Host " - $_" }
# Choix embedding
$preferredEmbeds = @('nomic-embed-text','mxbai-embed-large','snowflake-arctic-embed','bge-m3','bge-base','bge-small','gte-base','gte-large','e5-base')
$embed = ($preferredEmbeds | Where-Object { $names -contains $_ } | Select-Object -First 1)
if (-not $embed) { $embed = ($names | Where-Object { $_ -match 'embed|bge|gte|e5' } | Select-Object -First 1) }
# Choix LLM
$preferredLlms = @('qwen3:8b-q4_K_M','qwen2.5:7b','llama3.1:8b','llama3:8b','mistral:7b','phi3:mini','qwen2:7b','qwen:7b','gemma2:9b','yi:9b')
$llm = ($preferredLlms | Where-Object { $names -contains $_ } | Select-Object -First 1)
if (-not $llm) { $llm = ($names | Where-Object { $_ -match 'qwen|llama|mistral|phi|gemma|yi' } | Select-Object -First 1) }
if (-not $embed -or -not $llm) {
  Write-Error "Impossible de sélectionner un embedding et/ou un LLM parmi les modèles locaux."
  exit 3
}
Write-Host "Sélection: EMBED='$embed' LLM='$llm'"
# Démarrer orchestrateur
& (Join-Path $PSScriptRoot 'run-mov-gpu.ps1') -Llmmodel $llm -EmbedModel $embed &
# Attendre /ready
$deadline = (Get-Date).AddSeconds($ReadyTimeoutSec)
while ((Get-Date) -lt $deadline) {
  try {
    $r = Invoke-RestMethod -Uri $ReadyUrl -TimeoutSec 2
    if ($r) { Write-Host ('READY: ' + ($r | ConvertTo-Json -Depth 8)); break }
  } catch {}
  Start-Sleep -Seconds 1
}
if (-not $r) { Write-Error 'Orchestrateur non prêt dans le temps imparti.'; exit 4 }
# Smoke tests
& (Join-Path $PSScriptRoot 'smoke-mov-gpu.ps1')
