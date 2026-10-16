import fs from 'node:fs';
import assert from 'node:assert/strict';
export async function run(h){
 const {variant,evaluate,state,shot,key,pointer,page,beginPhase,sleep,freeze}=h;
 const scenario=process.argv[4]||'lifecycle',label=variant+'-'+scenario;
 await page('Page.addScriptToEvaluateOnNewDocument',{source:`window.__nativeRAF??=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;window.__validation={lost:null,deviceErrors:[],phase:null};if(globalThis.GPUAdapter){const request=GPUAdapter.prototype.requestDevice;GPUAdapter.prototype.requestDevice=async function(...args){const d=await request.apply(this,args);d.lost.then(v=>{__validation.lost={reason:v.reason,message:v.message,utc:new Date().toISOString()};console.error('VALIDATION DEVICE LOST '+JSON.stringify(__validation.lost));});d.addEventListener('uncapturederror',e=>{__validation.deviceErrors.push(e.error.message);});return d;};}`});
 const checkpoint={version:5,stage:3,seed:88967,mods:[2,3,1,1,1,0,1,1],upgrades:[1,1,0]};
 const report={variant,sha256:h.expectedHash,scenario,cases:[],startedUtc:new Date().toISOString()};
 const peek=()=>evaluate(`({stage,runSeed,carryMods:[...carryMods],upgrades:[...upgrades],savedCheckpoint,stored:localStorage.getItem(checkpointKey),unrelated:localStorage.getItem('checkpoint-test-unrelated'),started:settings.started,paused:settings.paused,seedRequested,advanceRequested,goal:playerValues[67],hp:playerValues[3],notes:[...diagnostics.notes],errors:[...diagnostics.errors]})`);
 const press=async code=>{await key(code,true);await key(code,false);};
 const frame=async()=>{await evaluate(`(async()=>{requestAnimationFrame=()=>0;const drain=async()=>{const until=performance.now()+5000;await device.queue.onSubmittedWorkDone();while(inFlight>0||readBusy){if(performance.now()>until)throw Error('Frame drain timed out');await new Promise(r=>setTimeout(r,5));}};await drain();drawFrame(performance.now());await drain();if(seedRequested||advanceRequested)throw Error('Frame did not consume pending transition');const s=new Float32Array(await readBuffer(S));playerValues.set(s.slice(0,playerValues.length));return true;})()`,15000);await state();};
 const waitReady=async()=>{const until=Date.now()+45000;while(Date.now()<until){try{const ready=await evaluate(`window.__TINY_READY__===true&&!window.__checkpointOldDocument`);if(ready){await state();await evaluate(freeze);return;}}catch(e){if(!/context|navigation|defined/.test(e.message))throw e;}await sleep(120);}throw Error('Reload boot timeout');};
 const reload=async()=>{await evaluate(freeze);await evaluate('window.__checkpointOldDocument=true');await page('Page.reload',{ignoreCache:true});await sleep(200);await waitReady();};
 const load=async(cp=checkpoint)=>{await evaluate(`localStorage.setItem(checkpointKey,${JSON.stringify(JSON.stringify(cp))});localStorage.setItem('checkpoint-test-unrelated','keep')`);await reload();assert.equal((await peek()).savedCheckpoint.stage,cp.stage);await press('Enter');await frame();assert.equal((await peek()).stage,cp.stage);};
 const completed=async(goal=1)=>{await evaluate(`(async()=>{settings.paused=true;const s=new Float32Array(await readBuffer(S));s[67]=${goal};if(${goal}===2)s[3]=0;device.queue.writeBuffer(S,0,s);playerValues.set(s.slice(0,playerValues.length));await device.queue.onSubmittedWorkDone();return true;})()`);};
 const record=async(name,extra={})=>{const p=await peek();assert(!p.errors.length);report.cases.push({name,...extra,state:p});fs.writeFileSync(label+'.json',JSON.stringify(report,null,2));return p;};
 const cleared=p=>{assert.equal(p.stage,1);assert.equal(p.savedCheckpoint,null);assert.equal(p.stored,null);assert.deepEqual(p.carryMods,[0,0,0,0,0,0,0,0]);assert.deepEqual(p.upgrades,[0,0,0]);assert.equal(p.advanceRequested,0);assert.equal(p.unrelated,'keep');};
 await evaluate(freeze);
 if(scenario==='lifecycle'){
  report.method='Real isolated Chrome, WebGPU initialization/reset and frame execution, normal keyboard/pointer events, actual reload and localStorage. Saved checkpoints and completion/death readbacks are explicit fixtures; this does not claim naturally completed campaigns.';
  await load();await record('continue-leg3');await completed();await press('KeyN');const immediate=await record('N-before-next-frame');
  if(variant==='baseline'){
   assert.equal(immediate.stage,1);assert.equal(immediate.savedCheckpoint.stage,3);await frame();await reload();await press('Enter');await frame();assert.equal((await record('reload-resumes-old-leg3')).stage,3);
   await completed();await press('Digit1');await press('KeyN');await frame();assert.equal((await record('queued-choice-starts-wrong-leg2')).stage,2);report.reproduced=true;
  }else{
   cleared(immediate);await reload();const interrupted=await record('reload-before-reset-frame');assert.equal(interrupted.savedCheckpoint,null);await press('Enter');assert.equal((await peek()).stage,1);assert.equal((await peek()).seedRequested,false);await frame();await shot(label+'-fresh-title.png');
   await load();await completed(2);const oldStored=(await peek()).stored;await press('Backspace');await frame();const retry=await record('death-retry');assert.equal(retry.stage,3);assert.equal(retry.hp,100);assert.equal(retry.stored,oldStored);await reload();await press('Enter');await frame();assert.equal((await record('reload-continue-after-retry')).stage,3);
   await completed();await press('Digit2');await press('KeyN');await press('Digit3');await pointer(640,360,'left',true);await pointer(640,360,'left',false);cleared(await record('stale-choice-and-pointer-cancelled'));await frame();cleared(await record('fresh-leg1-after-input-race'));
   await load();await evaluate('settings.paused=true');await press('KeyN');await press('KeyN');await press('KeyN');const repeated=await record('repeated-N-while-paused');cleared(repeated);assert.equal(repeated.runSeed,88967+3*104729);await frame();cleared(await record('repeated-N-applied-once'));
   await reload();await frame();let priorSeed=(await peek()).runSeed;
   for(const leg of [2,3]){
    await completed();await evaluate('playerValues.set([1,2,0,1,0,0,1,0],432)');await press('Digit2');await frame();const moved=await record('advance-leg'+leg);assert.equal(moved.stage,leg);assert.equal(moved.runSeed,(priorSeed+7919)>>>0);assert.equal(JSON.parse(moved.stored).stage,leg);priorSeed=moved.runSeed;
    await reload();await press('Enter');await frame();const continued=await record('reload-continue-leg'+leg);assert.equal(continued.stage,leg);assert.equal(continued.runSeed,priorSeed);assert.equal(continued.upgrades[1],leg-1);
   }
   await completed();const finalSave=(await peek()).stored;await record('final-completion-preserves-retry-until-new-run');await shot(label+'-final.png');await press('Backspace');await frame();assert.equal((await peek()).stored,finalSave);
   await completed();await press('KeyN');cleared(await record('N-after-final-completion'));await frame();await reload();assert.equal((await record('final-reload-has-no-continue')).savedCheckpoint,null);
   await load();await completed();await press('Digit1');await frame();cleared(await record('final-advance-also-clears-checkpoint'));
   await load({...checkpoint,stage:2});await completed();await press('Digit1');await reload();await press('Enter');await frame();assert.equal((await record('interrupted-advance-retains-last-leg')).stage,2);
   await load();await reload();await press('Enter');await press('KeyN');await press('Enter');cleared(await record('interrupted-continue-N-Enter'));await frame();cleared(await peek());
  }
  report.passed=true;
 }else if(scenario==='play'){
  report.method='Normal play through original input handlers after a clean URL-seed reset. No position, HP, actor or objective writes. Route steering is automated; completion is not assumed. All approved populations remain active.';
  await evaluate(`localStorage.removeItem(checkpointKey)`);await reload();await pointer(640,360,'left',true);await pointer(640,360,'left',false);await frame();
  const read=async()=>{await state();return evaluate(`(async()=>{const p=new Float32Array(await readBuffer(S)),c=new Uint32Array(await readBuffer(C));return {frame,t:p[24],stage,seed:runSeed,position:Array.from(p.slice(0,4)),goal:p[67],mission:Array.from(p.slice(448,452)),relay:Array.from(p.slice(440,444)),objective:Array.from(p.slice(488,492)),objectiveText:shortObjective9(),phase:p[452],intensity:p[2184],down:p[2180],team:Array.from({length:3},(_,i)=>({hp:p[L7.team7+i*128+3],active:p[L7.team7+i*128+42]})),ammo:p[100],chooser:p[464],counters:Array.from(c),fps,gpuMs};})()`)};
  const held=new Set();const hold=async codes=>{const set=new Set(codes);for(const k of [...held])if(!set.has(k)){await key(k,false);held.delete(k);}for(const k of set)if(!held.has(k)){await key(k,true);held.add(k);}};
  const basis=await evaluate('({right:[right[0],right[2]],forward:(()=>{const f=norm([up[0],0,up[2]]);return [f[0],f[2]]})()})');
  const options=[['KeyD',1,0],['KeyA',-1,0],['KeyW',0,1],['KeyS',0,-1],['KeyD,KeyW',1,1],['KeyD,KeyS',1,-1],['KeyA,KeyW',-1,1],['KeyA,KeyS',-1,-1]].map(([keys,x,z])=>{const v=[basis.right[0]*x+basis.forward[0]*z,basis.right[1]*x+basis.forward[1]*z],l=Math.hypot(...v);return{keys:keys.split(','),v:v.map(n=>n/l)}});
  const route=[[-60.8,52,0],[-59,52,0],[-54,52,0],[-54,48,0],[-40.8,48,3500],[-52,48,0],[-52,8,0],[-48.8,8,2500],[-48,0,0],[1,0,0],[1,-8,0],[-4,-8,2500],[1,-8,0],[1,-28,0],[11.2,-28,2500],[48,-28,0],[48,24,0],[40,24,0],[40,32,0],[48,32,15000]];
  report.before=await read();report.telemetry=[];report.waypoints=[];await h.startVideo(label);await beginPhase(210000,label);const deadline=Date.now()+205000;let lastBomb=0,lastDash=0,abort=null;
  for(const [x,z,wait] of route){let best=Infinity,progress=Date.now(),arrived=false;const began=Date.now();
   while(Date.now()<deadline&&Date.now()-began<30000){const s=await read();report.telemetry.push(s);if(s.goal||s.down>0){abort='Player downed or run ended';break;}if(s.chooser>.5){await press('Digit1');await sleep(150);continue;}const dx=x-s.position[0],dz=z-s.position[2],distance=Math.hypot(dx,dz);if(distance<.65){arrived=true;break;}if(distance<best-.1){best=distance;progress=Date.now();}if(Date.now()-progress>6000){abort='No route progress for six seconds';break;}
    const move=options.reduce((a,b)=>a.v[0]*dx+a.v[1]*dz>b.v[0]*dx+b.v[1]*dz?a:b);await hold([...move.keys,'KeyE']);
    const target=await evaluate(`(async()=>{const a=new Float32Array(await readBuffer(zParity?zB:zA,0,settings.zombies*64));let best=null;for(let i=0;i<settings.zombies;i++){const o=i*16;if(a[o+3]<=0)continue;const d=Math.hypot(a[o]-playerValues[0],a[o+2]-playerValues[2]);if(d<14&&(!best||d<best.d))best={d,p:screenPoint(a[o],a[o+2],.45)};}return best;})()`);
    if(target)await pointer(Math.max(2,Math.min(1278,target.p[0])),Math.max(2,Math.min(718,target.p[1])),'left',true);else await pointer(640,360,'left',false);
    if(target?.d<6&&Date.now()-lastBomb>5000){await press('Space');lastBomb=Date.now();}if(distance>3&&Date.now()-lastDash>1400){await press('ShiftLeft');lastDash=Date.now();}await sleep(130);
   }
   await hold(arrived&&wait?['KeyE']:[]);if(arrived&&wait){const until=Math.min(Date.now()+wait,deadline);while(Date.now()<until){report.telemetry.push(await read());await sleep(160);}}
   const s=await read();report.waypoints.push({target:[x,z],arrived,elapsedMs:Date.now()-began,state:s});await shot(label+'-point-'+report.waypoints.length+'.png');if(abort||!arrived||Date.now()>=deadline)break;
  }
  await hold([]);await pointer(640,360,'left',false);await evaluate(freeze);report.frames=await h.stopVideo(label);report.after=await read();report.abort=abort;report.completed=report.waypoints.length===route.length&&report.waypoints.every(w=>w.arrived);await shot(label+'-end.png');report.passed=true;
 }else throw Error('Unknown checkpoint scenario');
 await evaluate(freeze);await state();report.completedUtc=new Date().toISOString();fs.writeFileSync(label+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify({variant,scenario,passed:report.passed,cases:report.cases.length,reproduced:report.reproduced,completed:report.completed,abort:report.abort,after:report.after,waypoints:report.waypoints?.length},null,2));
}
