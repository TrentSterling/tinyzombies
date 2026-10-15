$ErrorActionPreference='Stop'
$testRoot=(Resolve-Path -LiteralPath $PSScriptRoot).Path
$owned=Get-Content -LiteralPath (Join-Path $testRoot 'owned-processes.json') | ConvertFrom-Json
$p=Get-CimInstance Win32_Process -Filter "ProcessId = $($owned.server)"
$port=[int](Get-Content -LiteralPath (Join-Path $testRoot 'server-port.txt'))
$listener=Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if($p -and $p.CommandLine -match 'node.exe.*server.mjs' -and $listener.OwningProcess -eq $owned.server){
  Stop-Process -Id $owned.server -ErrorAction Stop
  Wait-Process -Id $owned.server -Timeout 3 -ErrorAction SilentlyContinue
}
$start=[datetimeoffset]::Parse($owned.started)
$events=@(Get-WinEvent -FilterHashtable @{LogName='System';StartTime=$start.LocalDateTime} -MaxEvents 500 -ErrorAction SilentlyContinue | Where-Object {$_.ProviderName -match 'nvlddmkm|Dxg|WHEA' -or ($_.ProviderName -eq 'Display' -and $_.Id -eq 4101)} | Select-Object TimeCreated,ProviderName,Id,Message)
$remaining=@(Get-CimInstance Win32_Process | Where-Object {$_.ProcessId -in @($owned.browser,$owned.server,$owned.monitor)} | Select-Object ProcessId,Name)
$profileChildren=@(Get-CimInstance Win32_Process | Where-Object {$_.Name -eq 'chrome.exe' -and $_.CommandLine -and $_.CommandLine.Contains($testRoot)} | Select-Object ProcessId,Name)
$result=@{start=$owned.started;end=[datetimeoffset]::UtcNow.ToString('o');gpuFaults=$events;remainingOwnedProcesses=$remaining;remainingProfileProcesses=$profileChildren}
$result | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $testRoot 'session-close.json') -Encoding utf8
$result | ConvertTo-Json -Depth 8
if($events.Count -or $remaining.Count -or $profileChildren.Count){throw 'Cleanup or fault check requires inspection'}
