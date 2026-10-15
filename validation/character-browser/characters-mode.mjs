import fs from 'node:fs';
import assert from 'node:assert/strict';
export async function run(h){
 const {variant,evaluate,state,shot,key,pointer,beginPhase,sleep,freeze}=h;
 const scenario=process.argv[4]||'fixtures',label=variant+'-'+scenario;
 await evaluate(freeze);
 const reset=()=>evaluate('(async()=>{reset();await device.queue.onSubmittedWorkDone();settings.started=true;settings.paused=true;return true;})()',10000);
 const sample=()=>evaluate(`(async()=>{const s=new Float32Array(await readBuffer(S)),c=new Uint32Array(await readBuffer(C));return {frame,t:s[24],position:Array.from(s.slice(0,4)),down:s[L7.player7],revive:s[L7.player7+1],goal:s[67],dash:s[7],team:Array.from({length:3},(_,i)=>{const o=L7.team7+i*128;return {p:Array.from(s.slice(o,o+4)),action:s[o+9],revive:s[o+40],active:s[o+42]}}),counters:Array.from(c),fps,gpuMs,errors:diagnostics.errors};})()`,7000);
 const render=()=>evaluate(`(async()=>{settings.paused=true;updateUniforms(0);const e=device.createCommandEncoder();e.clearBuffer(C,32,4);pass(e,'lights',bindings.lights,1);pass(e,'lightTiles',bindings.lightTiles,4);pass(e,'boxes',bindings.boxes[zParity],Math.ceil(Math.max(settings.zombies,settings.pool,world.propCount)/64));pass(e,'wreckBoxes8',bindings.wreckBoxes8,Math.ceil(WRECK_MAX8/64));pass(e,'finalize',bindings.finalize,1);device.queue.submit([e.finish()]);await device.queue.onSubmittedWorkDone();const originalHud=hud;try{hud=()=>{glyphCount=0;};drawFrame(performance.now());}finally{hud=originalHud;}await device.queue.onSubmittedWorkDone();return true;})()`,10000);
 const report={variant,sha256:h.expectedHash,scenario,cases:[]};
 if(scenario==='alignment'){
  await reset();report.method='Compiled current zombie3 ray query tested against all 42 rigid crawler cuboid centres in four facings. Fabricated local Zombie values; no gameplay claim.';
  report.probe=await evaluate(fs.readFileSync('alignment-eval.js','utf8'),10000);if(variant==='candidate')assert.equal(report.probe.hits,168);report.passed=true;
 }else if(scenario==='fixtures'){

  report.method='Explicit GPU state fixtures: real compiled begin/buddy/boxes pipelines and actual world occupancy. No ordinary-play or naturally earned downing claim.';
  const doors=JSON.parse(fs.readFileSync('../tinyzombies-map/validation/downed-crawl-cpu.json','utf8')).authoredDoors;
  for(const name of ['crawl','closed-door','open-door','pause','finished']){
   await state();await reset();const door=doors[0];
   await evaluate(`(async()=>{const s=new Float32Array(await readBuffer(S));s[3]=0;s[L7.player7]=30;s[L7.player7+2]=0;s[7]=.16;s[67]=${name==='finished'?2:0};s[L7.chooser]=0;${(name.includes('door')||name==='crawl')?`s[0]=${door.centre[0]-(door.axis===0?1.5:0)};s[2]=${door.centre[2]-(door.axis===2?1.5:0)};`:''}device.queue.writeBuffer(S,0,s);playerValues.set(s.slice(0,playerValues.length));settings.paused=false;updateUniforms(${name==='pause'?0:1/60});uniformData.set([${(name.includes('door')||name==='crawl')&&door.axis===2?0:1},${(name.includes('door')||name==='crawl')&&door.axis===2?1:0},0,0],36);uniformData[43]=1;uniformData[63]=3;device.queue.writeBuffer(U,0,uniformData);${(name.includes('door')||name==='crawl')?`const p=new Float32Array(await readBuffer(Props));p[${door.index*16+1}]=${name==='closed-door'?1:3.4};p[${door.index*16+5}]=${name==='closed-door'?1:0};device.queue.writeBuffer(Props,0,p);const e=device.createCommandEncoder();e.clearBuffer(O,DYNAMIC_OFFSET*4,DYNAMIC_SIZE*4);pass(e,'dynamic',bindings.dynamic,Math.ceil(world.propCount/64));device.queue.submit([e.finish()]);`:''}await device.queue.onSubmittedWorkDone();return true;})()`,10000);
   const before=await sample(),ticks=name.includes('door')?360:300;
   for(let block=0;block<ticks/30;block++){await state();await evaluate(`(async()=>{const e=device.createCommandEncoder();for(let i=0;i<30;i++)pass(e,'begin',bindings.begin,1);device.queue.submit([e.finish()]);await device.queue.onSubmittedWorkDone();return true;})()`,10000);}
   const after=await sample(),distance=Math.hypot(after.position[0]-before.position[0],after.position[2]-before.position[2]);
   fs.writeFileSync(label+'-'+name+'-raw.json',JSON.stringify({before,after,distance,ticks},null,2));
   if(variant==='candidate'&&name==='crawl')assert(distance>2.98&&distance<3.02,'Crawl speed');else if(variant==='baseline'||['pause','finished'].includes(name))assert(distance<.001,'No unintended movement');
   if(variant==='candidate'&&name==='closed-door')assert(after.position[door.axis]<door.centre[door.axis]-.24,'Closed door blocks');
   if(variant==='candidate'&&name==='open-door')assert(after.position[door.axis]>door.centre[door.axis]+1.2,'Open door passes');
   assert.equal(after.position[3],0);if(name!=='pause')assert.equal(after.dash,0);report.cases.push({name,before,after,distance,ticks});
  }
  await reset();await evaluate(`(async()=>{const s=new Float32Array(await readBuffer(S)),ui=new Uint32Array(s.buffer),o=L7.team7;s[3]=0;s[L7.player7]=30;s[L7.player7+2]=0;s[L7.journey7]=1;s[67]=0;s[o]=s[0]+.5;s[o+2]=s[2];s[o+3]=80;s[o+8]=2;s[o+9]=4;s[o+10]=-1;s[o+11]=10;ui[o+32]=4;ui[o+33]=1;ui[o+34]=0;s[o+40]=0;s[o+42]=1;s[L7.buddy]=s[o];s[L7.buddy+2]=s[o+2];s[L7.buddy+3]=80;s[L7.rescue+2]=1;device.queue.writeBuffer(S,0,s);playerValues.set(s.slice(0,playerValues.length));settings.paused=false;updateUniforms(1/60);return true;})()`);
  const reviveBefore=await sample();for(let block=0;block<5;block++){await state();await evaluate(`(async()=>{const e=device.createCommandEncoder();for(let i=0;i<30;i++)pass(e,'buddy',bindings.buddy[zParity],1);device.queue.submit([e.finish()]);await device.queue.onSubmittedWorkDone();return true;})()`,10000);}const reviveAfter=await sample();assert.equal(reviveAfter.position[3],60);assert.equal(reviveAfter.down,0);report.cases.push({name:'revive',before:reviveBefore,after:reviveAfter});
  report.passed=true;
 }else if(scenario==='poses'){
  report.method='Explicit frozen pose fixtures rendered by the unchanged full presentation pipeline; authored art and default budgets retained. No ordinary-play claim.';
  for(const pose of ['standing','busy','downed','crawler']){
   await reset();await evaluate(`(async()=>{const s=new Float32Array(await readBuffer(S));s[L7.journey7]=1;s[0]=-55.5;s[2]=52;settings.zoom=16;settings.hideUI=true;for(let i=0;i<3;i++){const o=L7.team7+i*128;s[o]=s[0]+(i-1)*1.6;s[o+2]=s[2]+1.8;s[o+3]=${pose==='downed'?0:80};s[o+9]=${pose==='busy'?5:0};s[o+42]=1;}s[L7.buddy]=s[L7.team7];s[L7.buddy+2]=s[L7.team7+2];s[L7.buddy+3]=s[L7.team7+3];${pose==='downed'?'s[3]=0;s[L7.player7]=30;':''}device.queue.writeBuffer(S,0,s);playerValues.set(s.slice(0,playerValues.length));${pose==='crawler'?`for(const buffer of [zA,zB]){const z=new Float32Array(await readBuffer(buffer));for(let i=0;i<4;i++){let o=i*16;z[o]=s[0]+(i-1.5)*1.6;z[o+1]=0;z[o+2]=s[2]-1.8;z[o+3]=1;z[o+12]=z[o];z[o+13]=z[o+2];z[o+10]=i%2===0?0:4;z[o+4]=z[o+5]=z[o+9]=z[o+11]=0;}device.queue.writeBuffer(buffer,0,z);}`:''}await device.queue.onSubmittedWorkDone();return true;})()`);await render();await shot(label+'-'+pose+'.png');report.cases.push({pose,state:await sample()});
  }report.completed=true;
 }else if(scenario.startsWith('natural')){
  await reset();await evaluate('settings.zoom=23;settings.hideUI=false');
  report.method='Normal seeded gameplay through original keyboard/mouse handlers, with no position/HP/actor/objective edits after reset. Counts remain 2048 enemies / 32768 particles. State readback is observational. Capped at 60 simulation seconds.';
  report.before=await sample();report.telemetry=[];report.inputs=[];await h.startVideo(label);await beginPhase(70000,label);let moving=true,firing=false,stoppedMove=false,reloaded=false,nextAim=0,downMove=false,held=['KeyD','KeyS'];await key('KeyE',true);for(const k of held)await key(k,true);let lastFrame=report.before.frame,changedAt=Date.now();const wallStart=Date.now();
  while(Date.now()-wallStart<70000){await state();const r=await sample(),t=r.t-report.before.t;report.telemetry.push(r);if(r.frame!==lastFrame){lastFrame=r.frame;changedAt=Date.now();}else if(Date.now()-changedAt>2500)throw Error('No frame progress');
   if(t>2.1&&moving&&!stoppedMove){for(const k of held)await key(k,false);await key('KeyE',false);moving=false;report.inputs.push({t,event:'leave shelter movement stopped'});}
   if(t>3&&t<20&&r.down===0&&Date.now()>nextAim){const target=await evaluate(`(async()=>{const z=new Float32Array(await readBuffer(zParity?zB:zA,0,settings.zombies*64));let best=null;for(let i=0;i<settings.zombies;i++){const o=i*16,d=Math.hypot(z[o]-playerValues[0],z[o+2]-playerValues[2]);if(z[o+3]>0&&d<22&&(!best||d<best.d)){const p=screenPoint(z[o],z[o+2],.55);if(p[0]>40&&p[0]<width-40&&p[1]>40&&p[1]<height-40)best={d,p};}}return best;})()`);if(target){await pointer(...target.p,'left',true);firing=true;}nextAim=Date.now()+350;}
   if(t>=20&&!stoppedMove){if(firing)await pointer(640,360,'left',false);firing=false;for(const k of held)await key(k,true);moving=true;stoppedMove=true;report.inputs.push({t,event:'advance toward encounter'});}
   if(t>=24&&moving&&r.down===0){for(const k of held)await key(k,false);moving=false;}
   if(t>=25&&!reloaded){await key('KeyR',true);await key('KeyR',false);reloaded=true;}
   if(r.down>0&&!downMove){for(const k of held)await key(k,false);held=['KeyA'];await key('KeyA',true);await key('ShiftLeft',true);await key('ShiftLeft',false);moving=true;downMove=true;report.inputs.push({t,event:'downed crawl toward cover; Shift attempted'});}
   if(t>=60||r.goal!==0)break;await sleep(250);
  }
  await evaluate(freeze);for(const k of ['KeyE','KeyD','KeyS','KeyA'])await key(k,false);await pointer(640,360,'left',false);report.frames=await h.stopVideo(label);report.after=await sample();await shot(label+'.png');report.elapsed=report.after.t-report.before.t;report.observedDowning=report.telemetry.some(s=>s.down>0);report.observedBusy=report.telemetry.some(s=>s.team.some(t=>[4,5,6].includes(t.action)));report.completed=report.elapsed>=59.8||report.after.goal!==0;
 }else throw Error('Unknown character scenario');
 await evaluate(freeze);await state();fs.writeFileSync(label+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,telemetry:report.telemetry?.filter((_,i)=>i%20===0)},null,2));
}
