param(
  [string]$OllamaExePath = "C:\\Program Files\\Ollama\\ollama.exe",
  [string]$ModelsDir = "D:\\modeles_llm"
)
$ErrorActionPreference = 'Stop'
# Build candidate paths if provided path doesn't exist
$cands = @()
$cands += $OllamaExePath
$cands += "C:\\Program Files\\Ollama\\ollama.exe"
$cands += "C:\\Program Files (x86)\\Ollama\\ollama.exe"
$cands += (Join-Path $env:LOCALAPPDATA 'Programs\\Ollama\\ollama.exe')
$exe = $null
foreach ($c in $cands) { if (Test-Path $c) { $exe = $c; break } }
if (-not $exe) { Write-Error "ollama.exe introuvable. Fournissez -OllamaExePath."; exit 1 }
$env:OLLAMA_MODELS = $ModelsDir
Write-Host "--- Démarrage Ollama serve ($exe) avec OLLAMA_MODELS=$ModelsDir ---"
Start-Process -FilePath $exe -ArgumentList 'serve' -WindowStyle Hidden
# Attendre que l'API soit dispo
for ($i=0; $i -lt 30; $i++) {
  try { $r = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2; if ($r) { Write-Host 'Ollama API OK'; break } } catch {}
  Start-Sleep -Milliseconds 500
}
