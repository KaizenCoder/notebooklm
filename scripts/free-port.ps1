param([int]$Port=8000)
$ErrorActionPreference='SilentlyContinue'
$pids = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if($pids){
  Write-Host ("KILL {0}" -f ($pids -join ','))
  foreach($pid in $pids){ Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue }
}else{ Write-Host 'FREE' }
