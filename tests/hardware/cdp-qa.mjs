// Requires an already approved, separately launched fresh test Chrome profile.
// Connects only to the explicit loopback CDP endpoint; closes only its own tab.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const manifest=JSON.parse(fs.readFileSync(new URL('./candidate.json',import.meta.url),'utf8'));
const expected=manifest.runtimeSha256;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const endpoint=process.env.TINY_CDP_URL,url=process.env.TINY_QA_URL||'http://127.0.0.1:8080/index.html';
for(const [name,value]of [['TINY_CDP_URL',endpoint],['TINY_QA_URL',url]]){if(!value||!/^http:\/\/127\.0\.0\.1:\d+(?:\/.*)?$/.test(value))throw Error(name+' must be an explicit loopback HTTP URL');}
if(hash(fs.readFileSync(process.env.TINY_QA_INPUT||'index.html'))!==expected)throw Error('Local candidate hash mismatch');
if(!process.env.TINY_QA_OUTPUT)throw Error('TINY_QA_OUTPUT must name a new private evidence directory');
const out=path.resolve(process.env.TINY_QA_OUTPUT);if(fs.existsSync(out)&&fs.readdirSync(out).length)throw Error('Evidence output must be new or empty; prior recordings will not be overwritten');fs.mkdirSync(out,{recursive:true});process.env.TINY_QA_OUTPUT=out;
const report={candidateSha256:expected,harnessVersion:manifest.harnessVersion,method:'Ordinary keyboard/pointer input and read-only game telemetry; hardware adapter required',started:new Date().toISOString(),errors:[],steps:[]};
const write=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let frameIndex=0,recording=false,documentId,documentEpoch=0;
async function connect(wsUrl,onEvent=()=>{}){
 const ws=new WebSocket(wsUrl),pending=new Map();let seq=0;
 await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
 ws.onmessage=({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}}else onEvent(m);};
 const call=(method,params={},timeout=30000)=>new Promise((resolve,reject)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method));},timeout);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));});
 return {call,close:()=>ws.close()};
}
const version=await(await fetch(endpoint+'/json/version')).json();
const browser=await connect(version.webSocketDebuggerUrl);let targetId,page,heartbeat;
try{
 report.browser=version.Browser;report.gpu=await browser.call('SystemInfo.getInfo');
 ({targetId}=await browser.call('Target.createTarget',{url:'about:blank'}));
 const tabs=await(await fetch(endpoint+'/json/list')).json(),tab=tabs.find(t=>t.id===targetId);if(!tab)throw Error('Fresh test target missing');
 page=await connect(tab.webSocketDebuggerUrl,m=>{
  if(m.method==='Page.domContentEventFired')documentEpoch++;
  if(m.method==='Network.responseReceived'&&m.params.type==='Document')documentId=m.params.requestId;
  if(m.method==='Runtime.exceptionThrown'){report.errors.push(m.params.exceptionDetails);write();}
  if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error'){report.errors.push(m.params.args.map(a=>a.value??a.description));write();}
  if(m.method==='Page.screencastFrame'){
   if(recording){const name=String(frameIndex++).padStart(6,'0')+'.jpg';fs.writeFileSync(path.join(out,'frames',name),Buffer.from(m.params.data,'base64'));fs.appendFileSync(path.join(out,'frames.jsonl'),JSON.stringify({name,...m.params.metadata})+'\n');}
   page.call('Page.screencastFrameAck',{sessionId:m.params.sessionId}).catch(()=>{});
  }
 });
 const ev=async expression=>{const r=await page.call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},30000);if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 for(const method of ['Runtime.enable','Page.enable','Network.enable'])await page.call(method);
 await page.call('Network.setBlockedURLs',{urls:['https://*','wss://*','ws://*','http://peerjs*']});
 await page.call('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});
 const state='({ready:!!window.__TINY_READY__,bootText:document.querySelector("#boot p")?.textContent,compiled:typeof compute!=="undefined"?Object.keys(compute):[],diagnostics:typeof diagnostics!=="undefined"?diagnostics:null,allocatedBytes:typeof allocatedBytes!=="undefined"?allocatedBytes:null,stats:window.__tiny?.stats,settings:window.__tiny?.settings,body:document.body?.innerText,failureReport:document.querySelector("textarea")?.value})';
 async function shot(label){const s=await ev(state);if(s.ready){if(s.settings.zombies!==2048||s.settings.pool!==32768||s.settings.practice||s.settings.lab||s.settings.demo)throw Error('Campaign settings changed');const adapter=JSON.stringify(s.diagnostics?.adapter);if(!/nvidia|intel|amd|apple|qualcomm|arm/i.test(adapter)||/swiftshader|llvmpipe|lavapipe/i.test(adapter))throw Error('Hardware adapter changed or is unknown');}report.steps.push({label,state:s});write();fs.writeFileSync(path.join(out,label+'.json'),JSON.stringify(s,null,2));const png=await page.call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,label+'.png'),Buffer.from(png.data,'base64'));console.log('MILESTONE',label);}
 async function verifyDocument(){if(!documentId)throw Error('Document response not captured');const body=await page.call('Network.getResponseBody',{requestId:documentId});const served=hash(body.base64Encoded?Buffer.from(body.body,'base64'):Buffer.from(body.body));(report.servedHashes??=[]).push(served);write();if(served!==expected)throw Error('Served candidate hash mismatch');}
 let buttons=0;const pointer=async(x,y,button,down)=>{buttons=down?1:0;return page.call('Input.dispatchMouseEvent',{type:down?'mousePressed':'mouseReleased',x,y,button,buttons,clickCount:1});};
 const key=async(code,down)=>{const k=/^Key[A-Z]$/.test(code)?code.slice(3).toLowerCase():/^Digit[0-9]$/.test(code)?code.slice(5):({ShiftLeft:'Shift',Space:' '})[code]||code;const vk=({Enter:13,Escape:27,Backspace:8,ShiftLeft:16,Space:32})[code]||k.toUpperCase().charCodeAt(0);return page.call('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',code,key:k,windowsVirtualKeyCode:vk,nativeVirtualKeyCode:vk});};
 const action=async(method,args)=>{if(method==='Input.dispatchMouseEvent')return page.call(method,args);if(method!=='Page.reload')throw Error('Unsupported route action');const previous=documentEpoch,previousId=documentId;await page.call(method,args);const deadline=Date.now()+30000;while(documentEpoch===previous||documentId===previousId){if(Date.now()>=deadline)throw Error('Reload did not reach a new document');await sleep(50);}await verifyDocument();};
 heartbeat=setInterval(()=>ev(state).then(s=>{report.progress=s;write();}).catch(()=>{}),30000);
 await page.call('Page.navigate',{url});const navDeadline=Date.now()+30000;while(!documentEpoch||!documentId){if(Date.now()>navDeadline)throw Error('Initial navigation did not reach a document');await sleep(50);}const bootDeadline=Date.now()+360000;let ready=false;
 while(Date.now()<bootDeadline){const s=await ev(state);if(s.ready){ready=true;break;}if(s.failureReport||s.stats?.stopped)break;await sleep(250);}
 await shot('00-startup');if(!ready)throw Error('Game did not become ready');
 await verifyDocument();
 report.initialSettings=await ev('settings');if(report.initialSettings.zombies!==2048||report.initialSettings.pool!==32768||report.initialSettings.lab||report.initialSettings.practice||report.initialSettings.demo)throw Error('Acceptance requires unchanged campaign counts and modes');
 report.adapter=await ev('diagnostics.adapter');if(!/nvidia|intel|amd|apple|qualcomm|arm/i.test(JSON.stringify(report.adapter)))throw Error('Adapter identity is unknown; hardware acceptance remains unqualified');if(/swiftshader|llvmpipe|lavapipe/i.test(JSON.stringify(report.adapter)))throw Error('Software adapter is not hardware acceptance');
 fs.mkdirSync(path.join(out,'frames'),{recursive:true});recording=true;await page.call('Page.startScreencast',{format:'jpeg',quality:75,maxWidth:960,maxHeight:540,everyNthFrame:6});
 process.env.TINY_ROUTE_WALL_MS??='1200000';const {run}=await import('./deadends-route.mjs');const route=await run({ev,page:action,key,pointer,sleep,shot});
 report.routeReportSha256=hash(fs.readFileSync(path.join(out,'route-report.json')));report.checkpointOrigin=route.checkpointOrigin;report.chapter1TestedThisRun=route.chapter1TestedThisRun;report.burnoutTestedThisRun=route.burnoutTestedThisRun;
 report.route={chapter1:!!route.completed,burnout:!!route.burnoutCompleted,entry:!!route.lastTrainEntryPassed,lastTrain:!!route.lastTrainCompleted,persistence:!!route.lastTrainPersistencePassed,powerContract:route.powerContract,blocked:route.blocked,windowExpired:route.windowExpired};
 const audioDeadline=Date.now()+30000;while(Date.now()<audioDeadline){if(await ev('audioClips9.size===43||diagnostics.audio.bank?.state===\"unavailable\"'))break;await sleep(100);}
 report.audio=await ev('({bank:diagnostics.audio.bank,decoded:audioClips9.size,expected:Object.keys(audioBankAssets9).length})');
 report.allocations=await ev('({settings,allocatedBytes,MAX_Z,MAX_P,MAX_WORLD,MAX_PROPS,MAX_PAGES,FACE_CACHE_CAP,compute:Object.keys(compute),errors:diagnostics.errors,stopped})');
 report.passed=(!route.burnoutTestedThisRun||route.fuelContractPassed)&&!!route.lastTrainEntryPassed&&!!route.lastTrainPersistencePassed&&!!route.powerContractPassed&&!report.errors.length&&report.audio.decoded===43&&report.audio.expected===43&&!Object.keys(report.audio.bank?.failed||{}).length&&report.allocations.settings.zombies===2048&&report.allocations.settings.pool===32768&&!report.allocations.settings.practice&&!report.allocations.settings.lab&&!report.allocations.settings.demo&&report.allocations.compute.length===37&&report.allocations.allocatedBytes===81569020&&report.allocations.MAX_Z===8192&&report.allocations.MAX_P===65536&&report.allocations.MAX_WORLD===131072&&report.allocations.MAX_PROPS===192&&report.allocations.MAX_PAGES===1152&&report.allocations.FACE_CACHE_CAP===786432&&!report.allocations.errors.length&&!report.allocations.stopped;
 if(!report.passed)throw Error('Route acceptance incomplete; inspect route-report.json');
}catch(e){report.failure=String(e);report.passed=false;process.exitCode=1;console.error(e);}
finally{clearInterval(heartbeat);recording=false;if(page){await page.call('Page.stopScreencast').catch(()=>{});page.close();}if(targetId)await browser.call('Target.closeTarget',{targetId}).catch(()=>{});browser.close();report.finished=new Date().toISOString();write();}
