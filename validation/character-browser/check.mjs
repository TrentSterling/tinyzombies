import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const cwd=process.cwd(), mode=process.argv[2];
const variant=process.argv[3]||'pipe';const manifest=JSON.parse(fs.readFileSync('manifest.json','utf8'));if(!manifest[variant])throw Error('Invalid variant');const candidate=path.resolve(variant+'.html');const expectedHash=manifest[variant];
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
if(digest(candidate)!==expectedHash)throw Error('Candidate identity mismatch');
const port=fs.readFileSync('chrome-profile/DevToolsActivePort','utf8').split(/\r?\n/)[0];
const version=await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
const targets=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const log=data=>fs.appendFileSync('cdp-events.jsonl',JSON.stringify({utc:new Date().toISOString(),...data})+'\n');
const sockets=[];let fatal=null;let documentRequestId=null;let recording=null;let videoFrames=[];
async function connect(url){
 const ws=new WebSocket(url);sockets.push(ws);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});let id=0;const pending=new Map();
 ws.onmessage=e=>{const msg=JSON.parse(e.data);if(msg.id){const p=pending.get(msg.id);if(p){pending.delete(msg.id);clearTimeout(p.timer);msg.error?p.reject(Error(JSON.stringify(msg.error))):p.resolve(msg.result);}}else{
   if(msg.method==='Network.responseReceived'&&msg.params.type==='Document')documentRequestId=msg.params.requestId;
   if(msg.method==='Page.screencastFrame'){if(recording){const name=recording+'-'+String(videoFrames.length).padStart(5,'0')+'.jpg';fs.writeFileSync(name,Buffer.from(msg.params.data,'base64'));videoFrames.push({name,metadata:msg.params.metadata});}ws.send(JSON.stringify({id:++id,method:'Page.screencastFrameAck',params:{sessionId:msg.params.sessionId}}));return;}log(msg);if(msg.method==='Runtime.consoleAPICalled'&&msg.params.type==='error'){const value=msg.params.args.map(x=>x.value??x.description).join(' ');console.error(value);if(/device.lost|device hung|DXGI_ERROR|mapAsync|GPU stopped/i.test(value))fatal=value;}
   if(msg.method==='Runtime.exceptionThrown'){fatal=msg.params.exceptionDetails?.text||'Runtime exception';console.error(JSON.stringify(msg.params));}
 }};
 return (method,params={},timeout=5000)=>new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>{pending.delete(n);reject(Error('CDP responsiveness timeout: '+method));},timeout);pending.set(n,{resolve,reject,timer});ws.send(JSON.stringify({id:n,method,params}));});
}
const browser=await connect(version.webSocketDebuggerUrl);
const page=await connect(targets.find(x=>x.type==='page').webSocketDebuggerUrl);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const evaluate=async(expression,timeout=5000)=>{const r=await page('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},timeout);if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const freeze=`(()=>{if(typeof settings!=='undefined'){settings.paused=true;keys.clear();mouse.left=mouse.right=mouse.middle=false;cancelAnimationFrame(frameCallback);}if(window.__validation?.timer)clearTimeout(__validation.timer);return true;})()`;
async function monitor(){
 if(fs.existsSync('monitor-error.txt'))throw Error('Windows fault monitor failed: '+fs.readFileSync('monitor-error.txt','utf8'));
 if(fs.existsSync('gpu-faults.jsonl')&&fs.statSync('gpu-faults.jsonl').size>0)throw Error('Windows GPU fault detected: '+fs.readFileSync('gpu-faults.jsonl','utf8'));
 if(fs.existsSync('monitor-heartbeat.txt')&&Date.now()-fs.statSync('monitor-heartbeat.txt').mtimeMs>5000)throw Error('Windows fault monitor is unresponsive');
 if(fatal)throw Error(fatal);
}
const brief=`({url:location.href,secureContext:isSecureContext,ready:window.__TINY_READY__,lost:window.__validation?.lost,stopped:typeof stopped==='undefined'?false:stopped,errors:[...(typeof diagnostics==='undefined'?[]:diagnostics.errors),...(window.__validation?.deviceErrors||[])],notes:typeof diagnostics==='undefined'?[]:diagnostics.notes,frame:typeof frame==='undefined'?0:frame,simTime:typeof time==='undefined'?0:time,settings:typeof settings==='undefined'?null:{...settings},resolution:typeof width==='undefined'?null:[width,height],position:typeof playerValues==='undefined'?null:Array.from(playerValues.slice(0,4)),counters:typeof counters==='undefined'?null:Array.from(counters),fps:typeof fps==='undefined'?null:fps,gpuMs:typeof gpuMs==='undefined'?null:gpuMs})`;
async function state(){await monitor();const s=await evaluate(brief);if(s.lost||s.stopped||s.errors.length)throw Error('GPU/runtime failure: '+JSON.stringify(s));return s;}
async function shot(name){await monitor();const r=await page('Page.captureScreenshot',{format:'png'},5000);fs.writeFileSync(name,Buffer.from(r.data,'base64'));}
async function key(code,down){const named={Space:[' ',32],Escape:['Escape',27],Backspace:['Backspace',8],Tab:['Tab',9],Slash:['/',191],ShiftLeft:['Shift',16],Enter:['Enter',13]};const [keyName,vk]=named[code]||[code.slice(-1).toLowerCase(),code.charCodeAt(code.length-1)];await page('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',key:keyName,code,windowsVirtualKeyCode:vk,nativeVirtualKeyCode:vk});}
async function pointer(x,y,button='none',pressed=false){await page('Input.dispatchMouseEvent',{type:button==='none'?'mouseMoved':pressed?'mousePressed':'mouseReleased',x,y,button,buttons:pressed?(button==='left'?1:2):0,clickCount:button==='none'?0:1});}
async function snapshot(name){await monitor();const data=await evaluate('__tiny.snapshot(128)',6000);fs.writeFileSync(name,JSON.stringify(data,null,2));return data;}
async function wallTarget(){return evaluate(`(()=>{let best=null;for(let i=0;i<world.count;i++){const o=i*8,x=world.blocks[o],y=world.blocks[o+1],z=world.blocks[o+2],hp=world.blocks[o+3],mat=world.blocks[o+4],group=world.blocks[o+7];const d=Math.hypot(x-playerValues[0],z-playerValues[2]);if(hp<=0||y<.35||y>1.1||d<2||d>14||mat!==0)continue;const p=screenPoint(x,z,y);if(p[0]<50||p[0]>width-50||p[1]<50||p[1]>height-50)continue;if(!best||d<best.distance)best={index:i,world:[x,y,z],screen:p,distance:d,hp,group};}return best;})()`);}
async function beginPhase(ms,label){
 const s=await state();
 await evaluate(`(()=>{__validation.phase={label:${JSON.stringify(label)},start:performance.now(),duration:${ms},startFrame:frame};settings.paused=false;settings.started=true;requestAnimationFrame=window.__nativeRAF;last=0;cancelAnimationFrame(frameCallback);frameCallback=requestAnimationFrame(drawFrame);__validation.timer=setTimeout(()=>{__validation.phase.end=performance.now();__validation.phase.endFrame=frame;settings.paused=true;keys.clear();mouse.left=mouse.right=mouse.middle=false;cancelAnimationFrame(frameCallback);},${ms});})()`);
 return {before:s,start:Date.now()};
}
async function runPhase(seconds,label){
 const before=await state(),target=await wallTarget();fs.writeFileSync(label+'-target.json',JSON.stringify(target,null,2));
 const point=target?.screen||[900,260];await pointer(point[0],point[1]);
 const started=await beginPhase(seconds*1000,label);const actions=[];let next=0;let movementDown=false,fireDown=false;
 // Every action goes through the game's normal pointer/keyboard handlers.
 const schedule=seconds<=10?[
  [0,'fire-on'],[2200,'fire-off'],[2500,'move-right'],[3400,'move-stop'],[4000,'retarget-fire'],[7500,'fire-off']
 ]:[
  [0,'retarget-fire'],[6500,'fire-off'],[7000,'grenade'],[10500,'move-up'],[12000,'move-stop'],[13000,'retarget-fire'],[20500,'fire-off'],[21000,'move-left'],[22200,'move-stop'],[23500,'retarget-fire'],[30000,'fire-off'],[31000,'grenade'],[35000,'move-down'],[36200,'move-stop'],[38000,'retarget-fire'],[47000,'fire-off']
 ];
 let heldMovement=null;let lastFrame=before.frame,changedAt=Date.now();const telemetry=[];
 while(Date.now()-started.start<seconds*1000+300){
  await monitor();const elapsed=Date.now()-started.start;
  while(next<schedule.length&&elapsed>=schedule[next][0]){
   const action=schedule[next++][1];actions.push({elapsedMs:elapsed,action});
   if(action==='fire-on'){await pointer(point[0],point[1],'left',true);fireDown=true;}
   else if(action==='retarget-fire'){const t=await wallTarget();const p=t?.screen||point;await pointer(p[0],p[1]);await pointer(p[0],p[1],'left',true);fireDown=true;actions.at(-1).target=t;}
   else if(action==='fire-off'){await pointer(point[0],point[1],'left',false);fireDown=false;}
   else if(action==='grenade'){const t=await wallTarget();const p=t?.screen||point;await pointer(p[0],p[1]);await key('Space',true);await key('Space',false);actions.at(-1).target=t;}
   else if(action==='move-stop'){if(heldMovement)await key(heldMovement,false);heldMovement=null;}
   else {heldMovement={'move-right':'KeyD','move-up':'KeyW','move-left':'KeyA','move-down':'KeyS'}[action];await key(heldMovement,true);}
  }
  const s=await state();telemetry.push({elapsedMs:elapsed,...s});
  if(s.frame!==lastFrame){lastFrame=s.frame;changedAt=Date.now();}else if(!s.settings.paused&&Date.now()-changedAt>2500)throw Error('Unsafe responsiveness: no frame progress for 2.5 seconds');
  if(elapsed>=seconds*1000||s.settings.paused)break;
  await sleep(300);
 }
 await evaluate(freeze);if(heldMovement)await key(heldMovement,false);if(fireDown)await pointer(point[0],point[1],'left',false);
 const after=await state(),gpu=await snapshot(label+'-snapshot.json');await shot(label+'.png');
 const phase=await evaluate('__validation.phase');const result={before,after,phase,actions,telemetry,elapsedMs:phase.end-phase.start,frameDelta:after.frame-before.frame,readback:{frame:gpu.frame,counters:gpu.counters,player:gpu.player,particleValues:gpu.particles}};
 fs.writeFileSync(label+'-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify({label,elapsedMs:result.elapsedMs,frameDelta:result.frameDelta,frame:after.frame,position:after.position,fps:after.fps,gpuMs:after.gpuMs,counters:after.counters,errors:after.errors,lost:after.lost},null,2));
}
try{
 await page('Runtime.enable');await page('Log.enable');await page('Page.enable');await page('Network.enable');
 if(mode!=='close'){await page('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});if(mode!=='boot')await evaluate("if(window.__TINY_READY__)sizeTargets();");}
 if(mode==='boot'){
  fs.writeFileSync(variant+'-browser-system-info.json',JSON.stringify({version,info:await browser('SystemInfo.getInfo')},null,2));
  await page('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});
  await page('Page.addScriptToEvaluateOnNewDocument',{source:`window.__nativeRAF??=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;window.__validation={lost:null,deviceErrors:[],phase:null};if(globalThis.GPUAdapter){const request=GPUAdapter.prototype.requestDevice;GPUAdapter.prototype.requestDevice=async function(...args){const d=await request.apply(this,args);d.lost.then(v=>{__validation.lost={reason:v.reason,message:v.message,utc:new Date().toISOString()};console.error('VALIDATION DEVICE LOST '+JSON.stringify(__validation.lost));});d.addEventListener('uncapturederror',e=>{__validation.deviceErrors.push(e.error.message);});return d;};}`});
  await page('Page.navigate',{url:'http://127.0.0.1:'+fs.readFileSync('server-port.txt','utf8').trim()+'/'+variant+'.html?seed=73129'});
  const deadline=Date.now()+45000;let ready;
  while(Date.now()<deadline){await monitor();ready=await evaluate(brief);if(ready.stopped||ready.errors.length||ready.lost)throw Error('Boot failure '+JSON.stringify(ready));if(ready.ready)break;await sleep(200);}
  if(!ready?.ready)throw Error('Boot timed out');const response=await page('Network.getResponseBody',{requestId:documentRequestId});const loaded=Buffer.from(response.body,response.base64Encoded?'base64':'utf8');const actual=crypto.createHash('sha256').update(loaded).digest('hex');fs.writeFileSync(variant+'-loaded-document-identity.json',JSON.stringify({url:ready.url,sha256:actual,expectedHash,bytes:loaded.length,passed:actual===expectedHash},null,2));if(actual!==expectedHash)throw Error('Loaded document identity mismatch');await evaluate(freeze);await shot(variant+'-boot.png');fs.writeFileSync(variant+'-boot-state.json',JSON.stringify(await state(),null,2));console.log(JSON.stringify(await state(),null,2));
 }else if(mode==='phase1'){await runPhase(6,'hosted-6s');}
 else if(mode==='phase2'){await runPhase(50,'phase2-50s');}
 else if(mode==='controls'){
  const before=await state();const watch=Date.now();await beginPhase(6500,'pause-resume-restart');
  async function observedWait(ms){const end=Date.now()+ms;while(Date.now()<end){await state();await sleep(150);}}
  await observedWait(600);await key('Escape',true);await key('Escape',false);
  const pausedStart=await snapshot('pause-start-snapshot.json');await observedWait(900);const pausedEnd=await snapshot('pause-end-snapshot.json');
  if(!pausedEnd.settings.paused||pausedEnd.counters[18]!==pausedStart.counters[18])throw Error('Pause did not hold the active simulation counter');
  await key('Escape',true);await key('Escape',false);await key('KeyD',true);await observedWait(900);await key('KeyD',false);
  const resumed=await snapshot('resume-snapshot.json');if(resumed.settings.paused||resumed.counters[18]<=pausedEnd.counters[18])throw Error('Resume did not advance simulation');
  await key('Backspace',true);await key('Backspace',false);await observedWait(350);await evaluate(freeze);
  const restarted=await snapshot('restart-snapshot.json');await shot('restart.png');
  const result={before,elapsedMs:Date.now()-watch,pause:{passed:true,startCounter:pausedStart.counters[18],endCounter:pausedEnd.counters[18],startFrame:pausedStart.frame,endFrame:pausedEnd.frame,positionBefore:pausedStart.player.slice(0,4),positionAfter:pausedEnd.player.slice(0,4)},resume:{passed:true,activeCounter:resumed.counters[18],frame:resumed.frame,position:resumed.player.slice(0,4)},restart:{passed:restarted.counters[9]===0&&restarted.counters[41]===0&&restarted.player[3]===100&&Math.abs(restarted.player[0]+64)<.1&&Math.abs(restarted.player[2]-52)<.1,frame:restarted.frame,activeCounter:restarted.counters[18],removedVoxels:restarted.counters[9],rounds:restarted.counters[41],position:restarted.player.slice(0,4),ammo:restarted.player[100],worldVoxels:restarted.counters[17]},after:await state()};
  fs.writeFileSync('controls-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));if(!result.restart.passed)throw Error('Restart did not restore expected seed state');
 }
 else if(mode==='landing'||mode==='death'||mode==='airborne'||mode==='settled'){
 if(mode==='landing'){await evaluate('requestAnimationFrame=()=>0');await evaluate(fs.readFileSync('fixture-eval.js','utf8'),6000);}
 const expr=mode==='landing'?'__stamp.landing()':mode==='death'?'__stamp.death()':mode==='airborne'?'__stamp.advance(6)':'__stamp.advance(120)';
 const result=await evaluate(expr,20000);await state();fs.writeFileSync(variant+'-'+mode+'.json',JSON.stringify(result,null,2));
 if(mode!=='death')await shot(variant+'-'+mode+'.png');
 console.log(JSON.stringify({variant,mode,paintedFloorCells:result.paintedFloorCells,dropletCells:result.dropletCells,goreCells:result.goreCells,particleCount:result.particleCount,particleHash:result.particleHash,impacts:result.counters[13],errors:result.errors}));
 }
 else if(mode==='gate'){
  await evaluate('settings.started=true;settings.paused=false;drawFrame(performance.now());device.queue.onSubmittedWorkDone()',20000);
  await evaluate(freeze);await snapshot(variant+'-single-frame.json');await shot(variant+'-single-frame.png');
  console.log(JSON.stringify(await state(),null,2));
 }
 else if(mode==='blood'){
  await evaluate('requestAnimationFrame=()=>0');await evaluate(fs.readFileSync('fixture-eval.js','utf8'),6000);
  for(const [label,expr] of [['landing','__stamp.landing()'],['death','__stamp.death()'],['airborne','__stamp.advance(6)'],['settled','__stamp.advance(120)']]){
   const r=await evaluate(expr,20000);await state();fs.writeFileSync(variant+'-'+label+'.json',JSON.stringify(r,null,2));if(label!=='death')await shot(variant+'-'+label+'.png');
   console.log(JSON.stringify({variant,label,particleCount:r.particleCount,particleHash:r.particleHash,paintedFloorCells:r.paintedFloorCells,dropletCells:r.dropletCells,goreCells:r.goreCells,impacts:r.counters[13]}));
  }
 }
 else if(mode==='pipe'){
  const fixture=await evaluate(fs.readFileSync('pipe-fixture.js','utf8'),10000);fs.writeFileSync('pipe-fixture-setup.json',JSON.stringify(fixture,null,2));
  const sample=()=>evaluate(`(async()=>{await device.queue.onSubmittedWorkDone();const s=new Float32Array(await readBuffer(S)),c=new Uint32Array(await readBuffer(C)),z=new Float32Array(await readBuffer(zParity?zB:zA,0,4*64));return {clock:s[24],fuse:s[110],cooldown:s[111],target:[s[108],s[109]],ordnance:s[428],thrown:c[63],detonated:c[67],attracted:c[71],grenades:c[81],beeps:diagnostics.audio.pipeBeeps,audioState:audio?.state,zombies:Array.from({length:4},(_,i)=>({x:z[i*16],z:z[i*16+2],hp:z[i*16+3]})),errors:diagnostics.errors};})()`,6000);
  await pointer(fixture.aim[0],fixture.aim[1]);await beginPhase(12000,'pipe-bomb-fixture');
  recording='pipe-proof';videoFrames=[];await page('Page.startScreencast',{format:'jpeg',quality:75,maxWidth:960,maxHeight:540,everyNthFrame:6});
  await key('KeyB',true);
  const telemetry=[];const observed=async(ms)=>{const end=Date.now()+ms;while(Date.now()<end){await state();telemetry.push(await sample());await sleep(120);}};
  await observed(350);await shot('pipe-throw.png');await key('KeyB',false);
  await observed(650);await key('Escape',true);await key('Escape',false);await sleep(160);
  const pauseStart=await sample();await observed(850);const pauseEnd=await sample();
  if(pauseStart.fuse!==pauseEnd.fuse||pauseStart.clock!==pauseEnd.clock||pauseStart.beeps!==pauseEnd.beeps)throw Error('Pipe fuse/audio did not pause');
  await shot('pipe-paused.png');await key('Escape',true);await key('Escape',false);
  await observed(2100);const attracted=await sample();await shot('pipe-attraction.png');
  const until=Date.now()+5000;let after;
  while(Date.now()<until){await observed(150);after=await sample();if(after.detonated>0)break;}
  await observed(130);after=await sample();await shot('pipe-explosion.png');
  await page('Page.stopScreencast');recording=null;fs.writeFileSync('pipe-proof-frames.json',JSON.stringify(videoFrames,null,2));
  await evaluate(freeze);
  if(after.thrown!==1||after.detonated!==1||after.zombies.some(z=>z.hp>0)||attracted.attracted!==4||after.beeps<3||after.audioState!=='running')throw Error('Pipe fixture failed '+JSON.stringify({attracted,after}));
  const avgDist=s=>s.zombies.reduce((n,z)=>n+Math.hypot(z.x-s.target[0],z.z-s.target[1]),0)/4;
  const first=telemetry.find(s=>s.thrown===1);if(!(avgDist(attracted)<avgDist(first)-.8))throw Error('Zombies did not converge on pipe bomb');
  const result={candidate_sha256:expectedHash,method:'Explicit four-zombie lab fixture; all throw, pause and resume actions use normal browser input events. Complete unchanged GPU simulation runs.',fixture,pause:{start:pauseStart,end:pauseEnd,passed:true},attraction:{beforeDistance:avgDist(first),afterDistance:avgDist(attracted),state:attracted,passed:true},after,telemetry,videoFrames:videoFrames.length,audio:'Real running WebAudio context scheduled beeps; isolated Chrome output muted.'};
  fs.writeFileSync('pipe-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify({...result,telemetry:undefined},null,2));
 }
 else if(mode==='ordinary'){
  const before=await state();await beginPhase(14500,variant+'-ordinary');
  const observed=async(ms)=>{const end=Date.now()+ms;while(Date.now()<end){await state();await sleep(120);}};
  await pointer(970,360,'left',true);await observed(1500);await pointer(970,360,'left',false);
  await key('KeyE',true);await key('KeyD',true);await key('KeyS',true);await observed(1800);await key('KeyD',false);await key('KeyS',false);await key('KeyE',false);
  await key('KeyB',true);await key('KeyB',false);await observed(600);await shot(variant+'-ordinary-pipe.png');
  await key('Space',true);await key('Space',false);await observed(500);
  await key('Slash',true);await key('Slash',false);await observed(220);const help=await evaluate('({help:settings.help,paused:settings.paused})');await shot(variant+'-controls.png');
  if(!help.help||!help.paused)throw Error('Controls overlay did not pause');
  await key('Slash',true);await key('Slash',false);await observed(220);
  await key('Tab',true);await observed(220);await shot(variant+'-field-map.png');await key('Tab',false);
  await observed(4000);const action=await snapshot(variant+'-ordinary-actions.json');await shot(variant+'-ordinary-combat.png');
  if(action.counters[63]!==1||action.counters[67]!==1||action.counters[81]!==1||action.counters[41]<1)throw Error('Ordinary bomb/fire controls did not execute '+JSON.stringify(action.counters));
  await key('Escape',true);await key('Escape',false);await observed(200);const paused=await snapshot(variant+'-pause-start.json');await observed(450);const pausedEnd=await snapshot(variant+'-pause-end.json');
  if(!pausedEnd.settings.paused||pausedEnd.counters[18]!==paused.counters[18])throw Error('Ordinary pause did not hold');
  await key('Escape',true);await key('Escape',false);await key('Backspace',true);await key('Backspace',false);await observed(350);const reset=await snapshot(variant+'-restart.json');await shot(variant+'-restart.png');await evaluate(freeze);
  if(reset.counters[63]||reset.counters[67]||reset.counters[81]||reset.player[110]||reset.player[499]||reset.player[3]!==100)throw Error('Restart left bomb state');
  const result={candidate_sha256:expectedHash,before,action:{thrown:action.counters[63],pipeExplosions:action.counters[67],grenades:action.counters[81],rounds:action.counters[41],position:action.player.slice(0,4)},help,pause:{passed:true,counter:pausedEnd.counters[18]},restart:{passed:true,position:reset.player.slice(0,4)},after:await state()};
  fs.writeFileSync(variant+'-ordinary-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 }

 else if(['bench','route','fixture','scene','audio','bank','door','pacing','characters'].includes(mode)){
 const custom=await import(mode==='characters'?'./characters-mode.mjs':mode==='pacing'?'./pacing-mode.mjs':mode==='door'?'./door-mode.mjs':mode==='audio'?'./audio-mode.mjs':mode==='bank'?'./bank-mode.mjs':'./route-modes.mjs');await custom.run({mode,variant,expectedHash,page,evaluate,state,shot,key,pointer,beginPhase,sleep,freeze,
  startVideo:async name=>{recording=name;videoFrames=[];await page('Page.startScreencast',{format:'jpeg',quality:75,maxWidth:960,maxHeight:540,everyNthFrame:6});},
  stopVideo:async name=>{await page('Page.stopScreencast');recording=null;fs.writeFileSync(name+'-frames.json',JSON.stringify(videoFrames,null,2));return videoFrames.length;}
 });
 }
 else if(mode==='identity'){
  const tree=await page('Page.getFrameTree');const f=tree.frameTree.frame;
  const r=await page('Page.getResourceContent',{frameId:f.id,url:f.url});
  const bytes=Buffer.from(r.content,r.base64Encoded?'base64':'utf8');
  const actual=crypto.createHash('sha256').update(bytes).digest('hex');
  const result={url:f.url,bytes:bytes.length,sha256:actual,expectedHash,passed:actual===expectedHash};
  fs.writeFileSync('loaded-resource-identity.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
  if(!result.passed)throw Error('Hosted document identity mismatch');
 }
 else if(mode==='state'){const s=await state();fs.writeFileSync('latest-state.json',JSON.stringify(s,null,2));console.log(JSON.stringify(s,null,2));}
 else if(mode==='close'){fs.writeFileSync('monitor-stop','');console.log(await browser('Browser.close'));}
 else throw Error('Unknown mode');
}catch(e){
 const error={utc:new Date().toISOString(),message:e.stack||String(e),mode};fs.writeFileSync('STOPPED-'+mode+'.json',JSON.stringify(error,null,2));console.error(error.message);
 try{await evaluate(freeze,1500);}catch{}
 try{const s=await evaluate(brief,1500);fs.writeFileSync('failure-state.json',JSON.stringify(s,null,2));}catch{}
 try{await browser('Browser.close',{},1500);}catch{}
 fs.writeFileSync('monitor-stop','');process.exitCode=1;
}finally{for(const ws of sockets)ws.close();}
