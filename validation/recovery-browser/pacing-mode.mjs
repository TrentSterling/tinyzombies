import fs from 'node:fs';
import assert from 'node:assert/strict';
export async function run(h){
 const {variant,evaluate,state,shot,beginPhase,sleep,freeze,key,pointer}=h;
 const scenario=process.argv[4]||'director',label=variant+'-'+scenario;
 await evaluate(freeze);
 const reset=()=>evaluate('(async()=>{reset();await device.queue.onSubmittedWorkDone();settings.started=true;settings.paused=true;return true;})()',10000);
 const sample=()=>evaluate(`(async()=>{const s=new Float32Array(await readBuffer(S)),z=new Float32Array(await readBuffer(zParity?zB:zA,0,settings.zombies*64)),c=new Uint32Array(await readBuffer(C));const active=[];for(let i=0;i<settings.zombies;i++){const o=i*16;if(z[o+3]>0&&z[o+7]>0)active.push({i,x:z[o],z:z[o+2],hp:z[o+3],awake:z[o+7],distance:Math.hypot(z[o]-s[0],z[o+2]-s[2])});}return {frame,t:s[24],hp:s[3],player:[s[0],s[2]],phase:s[L7.director],phaseTime:s[L7.director+1],intensity:s[L7.pace7],alarm:s[L7.alarm+2],wave:s[L7.wave],journey:s[L7.journey7],progress:s[L7.journey7+2],relaxFor:s[L7.pace7+2],goal:s[67],mission:s[448],ammo:s[100],reloading:s[101],counters:Array.from(c),active:active.length,farAwake:active.filter(z=>z.distance>40).length,nearAwake:active.filter(z=>z.distance<20).length,targets:active.filter(z=>z.distance<24).sort((a,b)=>a.distance-b.distance).slice(0,5),tracked:window.__pacingTracked?.map(i=>({i,x:z[i*16],z:z[i*16+2],hp:z[i*16+3],awake:z[i*16+7]})),team:Array.from({length:3},(_,i)=>{let o=L7.team7+i*128;return {hp:s[o+3],active:s[o+42],near:s[o+21]}}),gpuMs,cpuMs,fps,audio:diagnostics.audio};})()`,7000);
 const report={variant,sha256:h.expectedHash,scenario,telemetry:[]};
 if(scenario==='director'){
  report.method='Actual compiled mission5 pipeline; one workgroup per tick at 1/30 s with controlled state inputs. Other simulation passes are intentionally not dispatched in these transition fixtures.';
  report.cases={};
  for(const name of ['high','settles','interrupt','alarm','movement']){
   await reset();await evaluate(`(async()=>{const s=new Float32Array(await readBuffer(S));s[L7.journey7]=1;s[L7.journey7+2]=30;s[0]=world.start[0]+30;s[2]=world.start[1];s[L7.director]=${['high','settles'].includes(name)?3:0};s[L7.director+1]=${['interrupt','alarm'].includes(name)?8:0};s[L7.pace7]=${['high','settles'].includes(name)?1:0};s[L7.pace7+1]=30;s[L7.pace7+2]=20.5;for(let i=0;i<3;i++){s[L7.team7+i*128+42]=i===0?1:0;s[L7.team7+i*128+3]=80;}device.queue.writeBuffer(S,0,s);playerValues.set(s.slice(0,3072));settings.paused=false;updateUniforms(1/30);window.__pacingStep=0;return true;})()`);
   const seconds={high:42,settles:70,interrupt:40,alarm:42,movement:12}[name],rows=[];
   for(let block=0;block<seconds*2;block++){
    await state();const r=await evaluate(`(async()=>{const write=(o,v)=>device.queue.writeBuffer(S,o*4,new Float32Array([v]));for(let j=0;j<15;j++){const t=++window.__pacingStep/30;write(L7.aux,t);write(L7.team7+21,(${JSON.stringify(name)}==='high'||(${JSON.stringify(name)}==='settles'&&t<20)?1:${JSON.stringify(name)}==='interrupt'&&t>=2&&t<7?.6:0)/.085);write(L7.alarm+2,${JSON.stringify(name)}==='alarm'&&t>=2&&t<12?1:0);if(${JSON.stringify(name)}==='movement'&&t>=2)write(0,world.start[0]+48);const e=device.createCommandEncoder();pass(e,'mission5',bindings.mission5,1);device.queue.submit([e.finish()]);}const s=new Float32Array(await readBuffer(S));return {t:__pacingStep/30,phase:s[L7.director],phaseTime:s[L7.director+1],intensity:s[L7.pace7],alarm:s[L7.alarm+2],wave:s[L7.wave],relaxFor:s[L7.pace7+2]};})()`,7000);rows.push(r);
   }
   report.cases[name]=rows;
  }
  const c=report.cases;if(variant==='baseline'){assert(c.high.some(s=>s.phase===0&&s.intensity>.99));assert(c.high.some(s=>s.phase===1&&s.intensity>.99));}else{assert(c.high.every(s=>s.phase===3));const calm=c.settles.find(s=>s.phase===0);assert(calm&&calm.t>=26&&calm.t<=27);assert(c.settles.find(s=>s.t>calm.t&&s.phase===1).t-calm.t>=17);assert(c.interrupt.find(s=>s.t>=2).phase===3);assert(c.alarm.filter(s=>s.t>=2&&s.t<12).every(s=>s.wave===2&&s.phase===3));assert(c.alarm.find(s=>s.phase===0&&s.t>12).t>=15);}
  assert(c.movement.find(s=>s.phase===1).t>=7);report.passed=true;
 }else{
  await reset();
  if(scenario==='distant'){
   report.fixture=await evaluate(`(async()=>{const s=new Float32Array(await readBuffer(S));s[L7.journey7]=1;s[L7.director]=3;s[L7.director+1]=0;s[L7.pace7]=.5;device.queue.writeBuffer(S,0,s);const z=new Float32Array(await readBuffer(zA));const picked=[];for(let i=0;i<settings.zombies;i++){const o=i*16;z[o+7]=0;const d=Math.hypot(z[o]-s[0],z[o+2]-s[2]);if(picked.length<80&&d>55&&d<100&&z[o+3]>0){z[o+7]=10;picked.push(i);}}if(picked.length!==80)throw Error('Could not select 80 distant authored enemies');device.queue.writeBuffer(zA,0,z);device.queue.writeBuffer(zB,0,z);window.__pacingTracked=picked;await device.queue.onSubmittedWorkDone();return {count:picked.length,method:'80 existing authored enemies 55-100 m from the player receive normal 10-second threat memory; positions, health, population, squad and full simulation unchanged. Journey and FADE phase are initialized explicitly.'};})()`);
  }else if(scenario==='bench'){
   report.fixture={method:'Matched quiet authored preparation scene, default population, no actor/state edits or input, no video capture; full normal simulation and renderer.'};
  }else if(scenario==='encounter'){
   report.fixture={method:'Authored seeded world and normal keyboard/mouse inputs; no actor/state repositioning. Leave shelter, fire at nearby visible targets, then stop firing. Whole GPU simulation and default population remain active.'};
  }else throw Error('Unknown pacing scenario '+scenario);
  report.before=await sample();if(scenario!=='bench')await h.startVideo(label);const duration=scenario==='distant'?23:scenario==='bench'?10:66;await beginPhase((duration+5)*1000,label);const start=Date.now();let moving=false,endedMove=false,fire=false;let nextAim=0;let reloaded=false;
  while(Date.now()-start<(duration+4)*1000){
   await state();const r=await sample();report.telemetry.push(r);const t=r.t-report.before.t;
   if(scenario==='encounter'){
    if(!moving){await key('KeyE',true);await key('KeyD',true);await key('KeyS',true);moving=true;}
    if(!endedMove&&t>2.1){await key('KeyE',false);await key('KeyD',false);await key('KeyS',false);endedMove=true;}
    if(t<23&&t>2&&Date.now()>nextAim){const target=r.targets[0];if(target){const p=await evaluate(`screenPoint(${target.x},${target.z},.55)`);await pointer(p[0],p[1],'left',true);fire=true;}else if(fire){await pointer(640,360,'left',false);fire=false;}nextAim=Date.now()+250;}
    if(t>=23&&fire){await pointer(640,360,'left',false);fire=false;}
    if(t>=24&&!reloaded){await key('KeyR',true);await key('KeyR',false);reloaded=true;}
   }
   if(t>=duration||r.goal!==0)break;await sleep(250);
  }
  await evaluate(freeze);for(const k of ['KeyE','KeyD','KeyS'])await key(k,false);await pointer(640,360,'left',false);report.after=await sample();await shot(label+'.png');if(scenario!=='bench')report.frames=await h.stopVideo(label);
  report.elapsed=report.after.t-report.before.t;report.state=await state();
  if(scenario==='distant'){assert(report.telemetry.some(s=>s.farAwake>=75));assert(report.after.farAwake===0);if(variant==='candidate')assert(report.telemetry.some(s=>s.phase===0),'Distant memory did not clear into recovery');report.passed=true;}
  else{report.completed=report.elapsed>=duration-.2;report.survived=report.after.hp>0&&report.after.goal===0;}
 }
 await evaluate(freeze);await state();fs.writeFileSync(label+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,telemetry:report.telemetry?.map(s=>({t:s.t,hp:s.hp,phase:s.phase,intensity:s.intensity,active:s.active,far:s.farAwake})).filter((_,i)=>i%12===0),cases:report.cases&&Object.fromEntries(Object.entries(report.cases).map(([n,rs])=>[n,rs.filter((s,i)=>!i||s.phase!==rs[i-1].phase)]))},null,2));
}
