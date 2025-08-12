param(
  [Parameter(Mandatory=$true)][string]$BaseUrl,
  [Parameter(Mandatory=$true)][string]$SessionId,
  [Parameter(Mandatory=$true)][string]$Message,
  [string]$Auth = 'Bearer test'
)
$ErrorActionPreference = 'Stop'
$headers = @{ Authorization = $Auth }
$body = @{ session_id = $SessionId; message = $Message } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri ("$BaseUrl/webhook/chat") -Method POST -Headers $headers -Body $body -ContentType 'application/json' | ConvertTo-Json -Depth 10
