$ErrorActionPreference='Stop'
$testRoot=(Resolve-Path -LiteralPath $PSScriptRoot).Path
$lease=Get-Content -Raw -LiteralPath 'C:\trontstack\.agentcoord\claims\gpu-game-validation.json' | ConvertFrom-Json
if($lease.owner -ne 'codex-tiny-recovery-20261015-task8'){throw 'Exclusive GPU lease is not held by this qualification task'}
$chrome='C:\Program Files\Google\Chrome\Application\chrome.exe'
if(!(Test-Path -LiteralPath $chrome)){throw 'Expected Chrome executable not found'}
if(Test-Path -LiteralPath (Join-Path $testRoot 'chrome-profile')){throw 'Use a fresh diagnostic profile; this launch is single-use'}
[datetime]::UtcNow.ToString('o') | Set-Content -LiteralPath (Join-Path $testRoot 'diagnostic-start.txt')
$server=Start-Process -FilePath 'C:\Program Files\nodejs\node.exe' -ArgumentList 'server.mjs' -WorkingDirectory $testRoot -WindowStyle Hidden -PassThru
$monitor=Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile','-File',('"'+(Join-Path $testRoot 'monitor-gpu.ps1')+'"'),'-Root',('"'+$testRoot+'"')) -WindowStyle Hidden -PassThru
$arguments=@('--headless=new','--no-first-run','--no-default-browser-check','--disable-background-networking','--mute-audio','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0',('--user-data-dir="'+(Join-Path $testRoot 'chrome-profile')+'"'),'--window-size=1280,720','--enable-logging',('--log-file="'+(Join-Path $testRoot 'chrome.log')+'"'),'about:blank')
$browser=Start-Process -FilePath $chrome -ArgumentList $arguments -WindowStyle Hidden -PassThru
@{server=$server.Id;monitor=$monitor.Id;browser=$browser.Id;root=$testRoot;started=[datetime]::UtcNow.ToString('o')} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $testRoot 'owned-processes.json')
Get-Content -LiteralPath (Join-Path $testRoot 'owned-processes.json')
