import fs from 'node:fs';
export async function run(h){
 const {variant,evaluate,state,shot,beginPhase,sleep,freeze,key,pointer}=h;
 const scenario=process.argv[4]||'natural',label=variant+'-'+scenario;
 await evaluate(freeze);
 const sample=()=>evaluate(`(async()=>{const s=new Float32Array(await readBuffer(S)),z=new Float32Array(await readBuffer(zParity?zB:zA,0,settings.zombies*64)),p=new Float32Array(await readBuffer(Props));const door=world.doors7.find(d=>d.startDoor),o=door.index*16;return {frame,clock:s[24],hp:s[3],player:[s[0],s[2]],journey:Array.from(s.slice(L7.journey7,L7.journey7+4)),director:Array.from(s.slice(L7.director,L7.director+4)),door:{...door,values:Array.from(p.slice(o,o+16))},zombies:Array.from({length:settings.zombies},(_,i)=>{const o=i*16;return {i,x:z[o],z:z[o+2],hp:z[o+3],awake:z[o+7],kind:z[o+10]};}),counters:Array.from(counters),gpuMs,cpuMs,fps,squad:Array.from(s.slice(L7.team7,L7.team7+384))};})()`,6000);
 const reset=async()=>evaluate('(async()=>{reset();await device.queue.onSubmittedWorkDone();settings.started=true;settings.paused=true;return {doors:world.doors7,start:world.start,zombies:settings.zombies,pool:settings.pool};})()',10000);
 const report={variant,sha256:h.expectedHash,scenario,telemetry:[]};
 if(scenario==='inspect'){console.log(JSON.stringify(await sample()));return;}
 if(scenario==='mask'){
  report.result=await evaluate(`(async()=>{
   reset();await device.queue.onSubmittedWorkDone();const props=new Float32Array(await readBuffer(Props));const door=world.doors7.find(d=>d.startDoor),di=door.index*16;
   const read=async()=>{const a=new Uint32Array(await readBuffer(O,DYNAMIC_OFFSET*4,DYNAMIC_SIZE*4));const x=Math.floor((door.x+96)*2),z=Math.floor((door.z+96)*2);return a[x+384*z];};
   const initial=await read();let pi=-1;for(let i=0;i<world.propCount;i++)if(props[i*16+3]===5){pi=i;break;}if(pi<0)throw Error('No static prop for overlap probe');
   const o=pi*16;props[o]=door.x;props[o+1]=.5;props[o+2]=door.z;props[o+4]=100;props[o+8]=1;props[o+9]=1;props[o+10]=1;
   device.queue.writeBuffer(Props,0,props);const rebuild=async()=>{const e=device.createCommandEncoder();e.clearBuffer(O,DYNAMIC_OFFSET*4,DYNAMIC_SIZE*4);pass(e,'dynamic',bindings.dynamic,Math.ceil(world.propCount/64));device.queue.submit([e.finish()]);await device.queue.onSubmittedWorkDone();return read();};
   const overlap=await rebuild();props[di+1]=3.4;props[di+5]=0;device.queue.writeBuffer(Props,0,props);const openOverlap=await rebuild();
   props[o+4]=0;device.queue.writeBuffer(Props,0,props);const openEmpty=await rebuild();reset();await device.queue.onSubmittedWorkDone();
   return {initial,overlap,openOverlap,openEmpty,passed:(initial&4)!==0&&(initial>>>16)===0&&(overlap&4)!==0&&((overlap>>>16)&4)!==0&&(openOverlap&4)!==0&&((openOverlap>>>16)&4)!==0&&(openEmpty&15)===0&&(openEmpty>>>16)===0};
  })()`,10000);await state();fs.writeFileSync(label+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(!report.result.passed)throw Error('Door/prop overlap occupancy test failed');return;
 }
 if(scenario!=='open'){report.reset=await reset();}
 if(scenario==='closed'||scenario==='combat'){
  report.fixture=await evaluate(`(async()=>{const s=new Float32Array(await readBuffer(S));s[0]=-61;s[2]=52;s[24]=6;
   for(let id=0;id<3;id++){const o=L7.team7+id*128; s[o+16]=0;s[o+18]=999;s[o+60]=1;}
   device.queue.writeBuffer(S,0,s);playerValues.set(s.slice(0,3072));const z=new Float32Array(await readBuffer(zA));
   for(let i=0;i<settings.zombies;i++){const o=i*16;if(Math.hypot(z[o]+61,z[o+2]-52)<25){z[o]=50+i%24;z[o+2]=25+Math.floor(i/24)*.5;}z[o+4]=z[o+5]=z[o+7]=0;z[o+9]=z[o+11]=0;z[o+12]=z[o];z[o+13]=z[o+2];z[o+14]=z[o+15]=0;}
   const spots=[[-55,52],[-56,48],[-56,56]];for(let i=0;i<3;i++){const o=i*16;z.set([spots[i][0],0,spots[i][1],2,0,0,0,0,.2,0,0,0,spots[i][0],spots[i][1],0,0],o);}
   device.queue.writeBuffer(zA,0,z);device.queue.writeBuffer(zB,0,z);await device.queue.onSubmittedWorkDone();return {method:'Three positioned common zombies; nearby authored enemies moved outside the local test; all 2048 enemies and 32768 particles retained. Squad magazines empty with long reload to isolate pursuit. Player stays inside departure radius.',spots};})()`,10000);
 }
 report.before=await sample();
 await h.startVideo(label);
 const seconds=scenario==='natural'?6:scenario==='closed'?5:scenario==='open'?7:5;
 await beginPhase((seconds+4)*1000,label);const start=Date.now();let fired=false,released=false,opened=false;
 while(Date.now()-start<(seconds+3)*1000){
  await state();const t=await sample();report.telemetry.push({...t,zombies:t.zombies.slice(0,3)});
  const elapsed=t.clock-report.before.clock;
  if((scenario==='closed'||scenario==='combat')&&!fired&&elapsed>.35){const aim=await evaluate('screenPoint(-65,52,.55)');await pointer(aim[0],aim[1],'left',true);fired=true;}
  if(fired&&!released&&elapsed>.50){await pointer(400,360,'left',false);released=true;}
  if((scenario==='open'||scenario==='combat')&&!opened&&elapsed>.3){await key('KeyE',true);await sleep(70);await key('KeyE',false);opened=true;}
  if(scenario==='combat'&&elapsed>1){const target=t.zombies.find(z=>z.hp>0&&z.i<3);if(target){const aim=await evaluate(`screenPoint(${target.x},${target.z},.55)`);await pointer(aim[0],aim[1],'left',true);}}
  if(elapsed>=seconds)break;await sleep(240);
 }
 await evaluate(freeze);await pointer(640,360,'left',false);report.after=await sample();await shot(label+'.png');report.frames=await h.stopVideo(label);
 report.moved=report.after.zombies.filter((z,i)=>z.hp>0&&Math.hypot(z.x-report.before.zombies[i].x,z.z-report.before.zombies[i].z)>.05).length;
 report.state=await state();report.elapsed=report.after.clock-report.before.clock;
 report.nav=await evaluate(`(async()=>{const a=new Uint32Array(await readBuffer(O,NAV_OFFSET*4,NAV_SIZE*4)),w=new Uint32Array(await readBuffer(O,WALK_OFFSET*4,NAV_SIZE*4));return [[-61,52],[-59,52],[-56,52],[-56,48]].map(([x,z])=>{const i=Math.floor(x+96)+192*Math.floor(z+96);return {x,z,cost:a[i],wall:w[i]};});})()`);
 fs.writeFileSync(label+'.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({label,elapsed:report.elapsed,moved:report.moved,before:{player:report.before.player,hp:report.before.hp,door:report.before.door,zombies:report.before.zombies.slice(0,3)},after:{player:report.after.player,hp:report.after.hp,door:report.after.door,zombies:report.after.zombies.slice(0,3),journey:report.after.journey,director:report.after.director,counters:report.after.counters},nav:report.nav,frames:report.frames,errors:report.state.errors},null,2));
}
