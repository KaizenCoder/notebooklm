param(
  [string]$Url = 'http://127.0.0.1:8000/ready',
  [int]$TimeoutSec = 120
)
$ErrorActionPreference = 'SilentlyContinue'
$deadline = (Get-Date).AddSeconds($TimeoutSec)
$r = $null
while ((Get-Date) -lt $deadline) {
  try {
    $r = Invoke-RestMethod -Uri $Url -TimeoutSec 2
    if ($r) { Write-Host ('READY: ' + ($r | ConvertTo-Json -Depth 6)); break }
  } catch {}
  Start-Sleep -Seconds 1
}
if (-not $r) { Write-Error 'NOT_READY'; exit 1 }
