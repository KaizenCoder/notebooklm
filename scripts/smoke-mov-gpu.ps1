param(
  [string]$Auth = "Bearer test"
)
$ErrorActionPreference = 'Stop'

function Json($o) { return ($o | ConvertTo-Json -Compress) }

Write-Host "[SMOKE] /health";    irm http://localhost:8000/health -Method GET
Write-Host "[SMOKE] /ready";     irm http://localhost:8000/ready  -Method GET

Write-Host "[SMOKE] chat"
$chat = @{ message = "Bonjour MOV GPU" } | ConvertTo-Json
irm http://localhost:8000/webhook/chat -Method POST -Headers @{Authorization=$Auth} -Body $chat -ContentType "application/json"

Write-Host "[SMOKE] process-document (txt)"
$pd = @{ source_id = "s_gpu"; text = "Texte GPU"; source_type = "txt"; notebook_id = "nb_gpu" } | ConvertTo-Json
irm http://localhost:8000/webhook/process-document -Method POST -Headers @{Authorization=$Auth} -Body $pd -ContentType "application/json"

Write-Host "[SMOKE] additional-sources (copied-text)"
$as = @{ type="copied-text"; notebookId="nb_gpu"; content="Copié GPU"; sourceId="s_gpu2" } | ConvertTo-Json
irm http://localhost:8000/webhook/process-additional-sources -Method POST -Headers @{Authorization=$Auth} -Body $as -ContentType "application/json"

Write-Host "[SMOKE] idempotency replay"
$headers = @{ Authorization=$Auth; 'Idempotency-Key'='k-gpu-1' }
irm http://localhost:8000/webhook/process-document -Method POST -Headers $headers -Body $pd -ContentType "application/json"
irm http://localhost:8000/webhook/process-document -Method POST -Headers $headers -Body $pd -ContentType "application/json"
