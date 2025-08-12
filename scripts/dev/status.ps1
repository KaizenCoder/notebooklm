$ErrorActionPreference = 'Stop'
function Ping($url) {
  try { (Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 -Uri $url).StatusCode -lt 500 } catch { $false }
}
$pg = docker ps --filter name=notebooklm_postgres --format '{{.Status}}'
$ol = docker ps --filter name=notebooklm_ollama --format '{{.Status}}'
$ollamaOk = Ping 'http://localhost:11434/api/tags'
Write-Output (@{
  postgres = $pg
  ollama = $ol
  ollama_health = $ollamaOk
} | ConvertTo-Json)
