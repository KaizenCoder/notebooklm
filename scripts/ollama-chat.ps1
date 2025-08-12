param(
  [string]$BaseUrl = 'http://127.0.0.1:11434',
  [Parameter(Mandatory=$true)][string]$Model,
  [string]$Prompt = 'Dis bonjour en une phrase.',
  [switch]$WithSystem
)
$ErrorActionPreference = 'Stop'
$messages = @()
if ($WithSystem) {
  $messages += @{ role = 'system'; content = 'You are a helpful assistant. Reply in one short sentence.' }
}
$messages += @{ role = 'user'; content = $Prompt }
$payload = @{ model = $Model; messages = $messages; stream = $false } | ConvertTo-Json -Depth 6
$response = Invoke-RestMethod -Uri ("$BaseUrl/api/chat") -Method POST -Body $payload -ContentType 'application/json'
# Affiche un résumé simple
$text = ''
if ($response -and $response.message -and $response.message.content) { $text = [string]$response.message.content }
$len = $text.Length
Write-Host (ConvertTo-Json @{ model=$Model; content_length=$len; sample=$text.Substring(0, [Math]::Min(160, $len)) })
