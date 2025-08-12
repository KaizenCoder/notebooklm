$ErrorActionPreference = 'Stop'
try {
  $tags = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 5
} catch {
  Write-Error "Impossible de contacter Ollama (http://127.0.0.1:11434). Assurez-vous qu''Ollama est lancé."
  exit 1
}
if (-not $tags -or -not $tags.models) { Write-Host 'Aucun modèle.'; exit 0 }
$tags.models | ForEach-Object { $_.name }
