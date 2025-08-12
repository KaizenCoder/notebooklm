param()
$ErrorActionPreference = 'Stop'
Write-Host "[hook pre-push] start"
# Enforcer: activer le mode NO_MOCKS bloquant
$env:NO_MOCKS = '1'

# Résoudre la racine du repo depuis l'emplacement du script
# - Si exécuté depuis .git/hooks → deux niveaux au-dessus
# - Si exécuté depuis scripts/git-hooks → deux niveaux au-dessus également
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$anti = Join-Path $repoRoot 'ci\anti-mock-scan.ps1'
$noMocks = Join-Path $repoRoot 'ci\no-mocks-check.ps1'

if (-not (Test-Path $anti)) { Write-Host "[hook pre-push] anti-mock introuvable: $anti" }
if (-not (Test-Path $noMocks)) { Write-Host "[hook pre-push] no-mocks introuvable: $noMocks" }

if (Test-Path $anti) {
  Write-Host "[hook pre-push] anti-mock scan..."
  & pwsh -NoProfile -ExecutionPolicy Bypass -File $anti
  if ($LASTEXITCODE -ne 0) { Write-Host "[hook pre-push] ECHEC anti-mock"; exit 1 }
}

if (Test-Path $noMocks) {
  Write-Host "[hook pre-push] NO_MOCKS check..."
  & pwsh -NoProfile -ExecutionPolicy Bypass -File $noMocks
  if ($LASTEXITCODE -ne 0) { Write-Host "[hook pre-push] ECHEC no-mocks"; exit 1 }
}

Write-Host "[hook pre-push] OK"
exit 0
