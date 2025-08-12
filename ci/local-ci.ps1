param()
$ErrorActionPreference = 'Stop'
Write-Host "[local-ci] Anti-mock scan"
pwsh -NoProfile -ExecutionPolicy Bypass -File ci\anti-mock-scan.ps1
if ($LASTEXITCODE -ne 0) { exit 1 }
Write-Host "[local-ci] No-mocks E2E"
pwsh -NoProfile -ExecutionPolicy Bypass -File ci\no-mocks-check.ps1
if ($LASTEXITCODE -ne 0) { exit 1 }
Write-Host "[local-ci] Tests complets"
cd orchestrator
npm run -s test
