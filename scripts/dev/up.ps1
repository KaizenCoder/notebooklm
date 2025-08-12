param([switch]$Recreate)
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..' '..' 'infra')
if ($Recreate) { docker compose down -v; }
docker compose up -d
Write-Host 'Waiting for services...'
$max=40
for ($i=0; $i -lt $max; $i++) {
  $pg = docker inspect --format='{{json .State.Health.Status}}' notebooklm_postgres 2>$null
  $ol = docker inspect --format='{{json .State.Health.Status}}' notebooklm_ollama 2>$null
  if ($pg -match 'healthy' -and $ol -match 'healthy') { Write-Host 'Services healthy'; break }
  Start-Sleep -Seconds 3
}
Write-Host 'Hint: to pull a model: docker exec -it notebooklm_ollama ollama pull nomic-embed-text && ollama pull llama3:instruct'
