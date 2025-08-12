param(
  [string]$Auth = "Bearer test",
  [string]$BaseUrl = "http://localhost:8000"
)
$ErrorActionPreference = 'Stop'
$headers = @{ Authorization=$Auth }
Write-Host "--- Smoke Test MOV (GPU_ONLY=1, NO_MOCKS=1) ---"
Write-Host "\n--- Health Check ---"
irm "$BaseUrl/health" -Method GET
Write-Host "\n--- Ready Check ---"
irm "$BaseUrl/ready" -Method GET
Write-Host "\n--- Chat Endpoint ---"
$chatBody = @{ message = "Bonjour" } | ConvertTo-Json
irm "$BaseUrl/webhook/chat" -Method POST -Headers $headers -Body $chatBody -ContentType 'application/json'
Write-Host "\n--- Ingestion Texte ---"
$ingestBody = @{ source_id = "s_demo"; text = "Texte de test pour MOV."; source_type = "txt"; notebook_id = "nb_demo" } | ConvertTo-Json
irm "$BaseUrl/webhook/process-document" -Method POST -Headers $headers -Body $ingestBody -ContentType 'application/json'
Write-Host "\n--- Additional Sources (Copied Text) ---"
$additionalBody = @{ type = "copied-text"; notebookId = "nb_demo"; content = "Contenu collé"; sourceId = "s_demo_2" } | ConvertTo-Json
irm "$BaseUrl/webhook/process-additional-sources" -Method POST -Headers $headers -Body $additionalBody -ContentType 'application/json'
Write-Host "\n--- Idempotency Test (Process Document) ---"
$idemHeaders = @{ 'Idempotency-Key' = 'k-demo-1'; Authorization = $Auth }
irm "$BaseUrl/webhook/process-document" -Method POST -Headers $idemHeaders -Body $ingestBody -ContentType 'application/json'
irm "$BaseUrl/webhook/process-document" -Method POST -Headers $idemHeaders -Body $ingestBody -ContentType 'application/json'
Write-Host "\n--- Smoke Test MOV Terminé ---"
