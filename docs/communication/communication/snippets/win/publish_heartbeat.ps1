param(
  [string]$FromAgent = "impl_bot",
  [string]$Team = "orange",
  [string]$Role = "impl",
  [string]$TmIds = "[\"1\"]",
  [string]$TaskId = "1",
  [string]$Event = "TASK_START",
  [string]$Status = "IN_PROGRESS",
  [string]$Severity = "INFO"
)

$Timestamp = (Get-Date).ToString("o")
$Correlation = [guid]::NewGuid().ToString()

& redis-cli XADD coordination_heartbeat "*" `
  from_agent $FromAgent `
  team $Team `
  role $Role `
  tm_ids $TmIds `
  task_id $TaskId `
  event $Event `
  status $Status `
  severity $Severity `
  timestamp $Timestamp `
  correlation_id $Correlation
