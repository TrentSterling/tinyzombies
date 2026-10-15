param([string]$Root)
$ErrorActionPreference='Stop'
$start=[datetimeoffset]::Parse((Get-Content -LiteralPath (Join-Path $Root 'diagnostic-start.txt')))
$deadline=(Get-Date).AddMinutes(20)
$seen=New-Object 'System.Collections.Generic.HashSet[long]'
while((Get-Date) -lt $deadline -and -not(Test-Path -LiteralPath (Join-Path $Root 'monitor-stop'))){
  try {
    $events=@(Get-WinEvent -FilterHashtable @{LogName='System';StartTime=$start.LocalDateTime} -MaxEvents 300 -ErrorAction SilentlyContinue | Where-Object { $_.ProviderName -match 'nvlddmkm|Dxg|WHEA' -or ($_.ProviderName -eq 'Display' -and $_.Id -eq 4101) })
    foreach($event in $events){if($seen.Add($event.RecordId)){
      $record=[pscustomobject]@{TimeCreated=$event.TimeCreated;Id=$event.Id;Provider=$event.ProviderName;RecordId=$event.RecordId;Properties=@($event.Properties | ForEach-Object {$_.Value});Xml=$event.ToXml()}
      $record | ConvertTo-Json -Depth 6 -Compress | Add-Content -LiteralPath (Join-Path $Root 'gpu-faults.jsonl')
    }}
    [datetime]::UtcNow.ToString('o') | Set-Content -LiteralPath (Join-Path $Root 'monitor-heartbeat.txt')
  }catch{ $_.Exception.Message | Set-Content -LiteralPath (Join-Path $Root 'monitor-error.txt'); break }
  Start-Sleep -Milliseconds 750
}
