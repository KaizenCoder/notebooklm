param()
$ErrorActionPreference = 'Stop'
Write-Host "[hook pre-push] start"
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$anti = Join-Path $root 'ci\anti-mock-scan.ps1'
$noMocks = Join-Path $root 'ci\no-mocks-check.ps1'
if (Test-Path $anti) {
  Write-Host "[hook pre-push] anti-mock scan..."
  & pwsh -NoProfile -ExecutionPolicy Bypass -File $anti
  if ($LASTEXITCODE -ne 0) { Write-Host "[hook pre-push] ECHEC anti-mock"; exit 1 }
} else {
  Write-Host "[hook pre-push] anti-mock absent, skip"
}
if (Test-Path $noMocks) {
  Write-Host "[hook pre-push] NO_MOCKS check..."
  & pwsh -NoProfile -ExecutionPolicy Bypass -File $noMocks
  if ($LASTEXITCODE -ne 0) { Write-Host "[hook pre-push] ECHEC no-mocks"; exit 1 }
} else {
  Write-Host "[hook pre-push] no-mocks absent, skip"
}
Write-Host "[hook pre-push] OK"
exit 0
