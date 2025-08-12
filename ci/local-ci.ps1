param()
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$anti = Join-Path $PSScriptRoot 'anti-mock-scan.ps1'
$nomocks = Join-Path $PSScriptRoot 'no-mocks-check.ps1'
$orc = Join-Path $root 'orchestrator'

Write-Host "[local-ci] Anti-mock scan"
pwsh -NoProfile -ExecutionPolicy Bypass -File $anti
if ($LASTEXITCODE -ne 0) { Write-Host "[local-ci] ECHEC anti-mock"; exit 1 }

Write-Host "[local-ci] No-mocks E2E"
pwsh -NoProfile -ExecutionPolicy Bypass -File $nomocks
if ($LASTEXITCODE -ne 0) { Write-Host "[local-ci] ECHEC no-mocks"; exit 1 }

Write-Host "[local-ci] Tests complets"
pushd $orc
try {
  npm run -s test
  if ($LASTEXITCODE -ne 0) { exit 1 }
} finally {
  popd
}

Write-Host "[local-ci] OK"
exit 0
