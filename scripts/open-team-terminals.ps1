# Opens 7 Windows Terminal (pwsh) tabs/panes for the project teams, titled appropriately.
param(
  [string]$ProjectRoot = "${PWD}"
)

# Ensure we run from the project root
Set-Location -Path $ProjectRoot

$wt = (Get-Command wt.exe -ErrorAction SilentlyContinue)
if (-not $wt) {
  Write-Host "wt.exe (Windows Terminal) not found. Open 7 terminals manually and paste prompts from docs/TEAM_LAUNCH_PROMPTS.md"
  exit 0
}

# Build commands for 7 tabs with titles
$tabs = @(
  @{ title = "Coordonateur"; path = $ProjectRoot },
  @{ title = "Impl-01 Fondations"; path = $ProjectRoot },
  @{ title = "Audit-01 Fondations"; path = $ProjectRoot },
  @{ title = "Impl-02 Ingestion"; path = $ProjectRoot },
  @{ title = "Audit-02 Ingestion"; path = $ProjectRoot },
  @{ title = "Impl-03 RAG&Audio"; path = $ProjectRoot },
  @{ title = "Audit-03 RAG&Audio"; path = $ProjectRoot }
)

# Construct wt.exe arguments
$wtArgs = @()
for ($i=0; $i -lt $tabs.Count; $i++) {
  $t = $tabs[$i]
  if ($i -gt 0) { $wtArgs += ';' }
  $wtArgs += @(
    'new-tab', "-p", 'PowerShell', '--title', $t.title, '--startingDirectory', $t.path
  )
}

Start-Process wt.exe -ArgumentList $wtArgs
