param()
$ErrorActionPreference = 'Stop'

Write-Host "[anti-mock] Scan démarré (NO_MOCKS=$env:NO_MOCKS)"

# Ne déclenche en échec que si NO_MOCKS=1 (mode exécution réelle)
$enforce = ($env:NO_MOCKS -eq '1')

$root = Split-Path -Parent $PSScriptRoot
$target = Join-Path $root 'orchestrator\src'
if (-not (Test-Path $target)) {
  Write-Host "[anti-mock] Répertoire introuvable: $target"
  exit 0
}

# Extensions ciblées
$patterns = @('*.ts','*.tsx','*.js','*.mjs')
$files = Get-ChildItem -Path $target -Recurse -Include $patterns | Where-Object { $_.PSIsContainer -eq $false }

# Exclusions de base (tests)
$files = $files | Where-Object { $_.FullName -notmatch "\\test\\|\.test\.|\.spec\." }

# Motifs suspects (mots entiers, insensible à la casse)
$regex = '\b(mock|fake|stub|dummy|placeholder|noop|no-op)\b'

$violations = @()
foreach ($f in $files) {
  $matches = Select-String -Path $f.FullName -Pattern $regex -CaseSensitive:$false
  if ($matches) {
    $violations += $matches | ForEach-Object { [PSCustomObject]@{ File=$_.Path; Line=$_.LineNumber; Text=$_.Line.Trim() } }
  }
}

if ($violations.Count -eq 0) {
  Write-Host "[anti-mock] Aucun motif suspect détecté dans orchestrator/src"
  exit 0
}

Write-Host "[anti-mock] Motifs suspects détectés:" -ForegroundColor Yellow
$violations | ForEach-Object { Write-Host (" - {0}:{1}: {2}" -f $_.File, $_.Line, $_.Text) }

if ($enforce) {
  Write-Host "[anti-mock] ECHEC (NO_MOCKS=1). Supprimez les implémentations simulées dans orchestrator/src ou déplacez-les sous test/." -ForegroundColor Red
  exit 1
} else {
  Write-Host "[anti-mock] AVERTISSEMENT (NO_MOCKS!=1). Le push n'est pas bloqué, mais ceci sera bloquant en mode réel." -ForegroundColor Yellow
  exit 0
}
