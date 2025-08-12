param(
  [Parameter(Mandatory = $true)][string]$Id,
  [Parameter(Mandatory = $true)][ValidateSet('pending','in-progress','review','done','blocked','deferred','cancelled')][string]$Status
)

$ErrorActionPreference = 'Stop'

function Write-Info($msg) { Write-Host "[INFO] $msg" }
function Write-Err($msg) { Write-Host "[ERROR] $msg"; exit 1 }

# Parse id like "7" or "7.2"
$mainId = $null
$subId = $null
if ($Id -match '^(\d+)(?:\.(\d+))?$') {
  $mainId = [int]$Matches[1]
  if ($Matches[2]) { $subId = [int]$Matches[2] }
} else {
  Write-Err "Format d'ID invalide: $Id (attendu: N ou N.M)"
}

$tasksFile = Join-Path -Path (Resolve-Path ".\").Path -ChildPath ".taskmaster/tasks/tasks.json"
if (!(Test-Path $tasksFile)) {
  Write-Err "Fichier non trouvé: $tasksFile"
}

# Sauvegarde
$backupFile = "$tasksFile.bak"
Copy-Item -Path $tasksFile -Destination $backupFile -Force
Write-Info "Backup créé: $backupFile"

try {
  $jsonRaw = Get-Content -Path $tasksFile -Raw -Encoding UTF8
  $data = $jsonRaw | ConvertFrom-Json -ErrorAction Stop

  if (-not $data.master -or -not $data.master.tasks) {
    Write-Err "Structure inattendue dans tasks.json"
  }

  $task = $data.master.tasks | Where-Object { $_.id -eq $mainId }
  if (-not $task) { Write-Err "Tâche $mainId introuvable" }

  if ($null -ne $subId) {
    $sub = $task.subtasks | Where-Object { $_.id -eq $subId }
    if (-not $sub) { Write-Err "Sous-tâche $mainId.$subId introuvable" }
    $old = $sub.status
    $sub.status = $Status
    Write-Info "Mise à jour $mainId.$subId`: $old -> $Status"
  } else {
    $old = $task.status
    $task.status = $Status
    Write-Info "Mise à jour $mainId`: $old -> $Status"
  }

  # Ecriture sécurisée
  $tmpFile = "$tasksFile.tmp"
  $data | ConvertTo-Json -Depth 100 | Out-File -FilePath $tmpFile -Encoding UTF8 -NoNewline
  if ((Get-Item $tmpFile).Length -eq 0) { Write-Err "Écriture échouée: fichier temporaire vide" }
  Move-Item -Force -Path $tmpFile -Destination $tasksFile
  Write-Info "Statut appliqué dans $tasksFile"
  Write-Host "OK"
} catch {
  Write-Err $_.Exception.Message
}
