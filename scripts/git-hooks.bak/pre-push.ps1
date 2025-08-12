param()
$ErrorActionPreference = 'Stop'
Write-Host "[hook pre-push] anti-mock scan..."
$anti = Join-Path (Resolve-Path "..").Path "ci\anti-mock-scan.ps1"
& pwsh -NoProfile -ExecutionPolicy Bypass -File $anti
if ($LASTEXITCODE -ne 0) {
  Write-Host "[hook pre-push] ECHEC anti-mock; push annulé."
  exit 1
}
Write-Host "[hook pre-push] NO_MOCKS check..."
$ps1 = Join-Path (Resolve-Path "..").Path "ci\no-mocks-check.ps1"
& pwsh -NoProfile -ExecutionPolicy Bypass -File $ps1
if ($LASTEXITCODE -ne 0) {
  Write-Host "[hook pre-push] ECHEC no-mocks; push annulé."
  exit 1
}
Write-Host "[hook pre-push] OK"
exit 0
