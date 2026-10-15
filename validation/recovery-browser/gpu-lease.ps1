param([ValidateSet('acquire','heartbeat','release')][string]$Action='acquire')
$ErrorActionPreference='Stop'
$owner='codex-tiny-recovery-20261015-task8'
$store='C:\trontstack\.agentcoord'
$lease=Join-Path $store 'claims\gpu-game-validation.json'
if(Test-Path -LiteralPath $lease){
 $current=Get-Content -Raw -LiteralPath $lease | ConvertFrom-Json
 if($current.owner -ne $owner){throw "GPU resource belongs to $($current.owner); refusing to change it"}
}elseif($Action -ne 'acquire'){throw 'Owned GPU lease is missing'}
$record=@{owner=$owner;repoPath='RTX 5070 Ti desktop browser';heartbeatUtc=[DateTime]::UtcNow.ToString('o');ttlMinutes=40;task='Bounded Tiny Zombies PR8 recovery pacing qualification'}
if($Action -eq 'release'){
 $destination=$lease+'.released-'+[DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfff')
 Move-Item -LiteralPath $lease -Destination $destination
}elseif(Test-Path -LiteralPath $lease){[IO.File]::WriteAllText($lease,($record|ConvertTo-Json))}
else{
 $stream=[IO.File]::Open($lease,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
 try{$bytes=[Text.Encoding]::UTF8.GetBytes(($record|ConvertTo-Json));$stream.Write($bytes,0,$bytes.Length)}finally{$stream.Dispose()}
}
$record.event=$Action
[IO.File]::AppendAllText((Join-Path $store 'journal.ndjson'),($record|ConvertTo-Json -Compress)+[Environment]::NewLine)
$record|ConvertTo-Json
