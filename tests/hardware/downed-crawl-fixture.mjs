// Prepared, not executed in cloud. Run only in an authorized fresh loopback test page.
// Uses the production begin pipeline with owned buffers. Never writes campaign buffers/storage.
export function fixtureExpression(expectedRuntimeSha256){
 if(!/^[0-9a-f]{64}$/.test(expectedRuntimeSha256))throw Error('Exact runtime SHA-256 required');
 return '('+runOwnedFixture.toString()+')('+JSON.stringify(expectedRuntimeSha256)+')';
}
async function runOwnedFixture(expected){
 const assert=(yes,message)=>{if(!yes)throw Error(message);};
 assert(location.protocol==='http:'&&location.hostname==='127.0.0.1','Dedicated loopback test page required');
 const bytes=await(await fetch(location.href,{cache:'no-store'})).arrayBuffer();
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 assert(digest===expected,'Served runtime mismatch');
 assert(window.__TINY_READY__&&compute.begin&&!settings.started,'Ready, unstarted dedicated test page required');
 assert(S.size===16384&&C.size===384&&U.size===400&&L13.stateFloats===3896&&ZOMBIE_BYTES13===112,'Current layout mismatch');
 const original={zombies:settings.zombies,pool:settings.pool,allocatedBytes};
 assert(original.zombies===2048&&original.pool===32768,'Default production counts required');
 const report={candidateSha256:digest,method:'Controlled production begin-shader fixtures on isolated owned buffers. State initialization is synthetic; no earned gameplay, full-pipeline, natural rescue or performance qualification.',adapter:diagnostics.adapter,layout:{stateBytes:S.size,statePrefixFloats:L13.stateFloats,uniformBytes:U.size,counterBytes:C.size,zombieBytes:ZOMBIE_BYTES13},cases:[],passed:false};
 const owned=[],storage=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC;
 const allocate=(label,size,usage)=>{const b=device.createBuffer({label:'crawl fixture '+label,size,usage});owned.push(b);return b;};
 let mapped=false,readback,scope=true;device.pushErrorScope('validation');
 try{
  const u=allocate('uniforms',U.size,GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST),s=allocate('state',S.size,storage),c=allocate('counters',C.size,storage),o=allocate('empty collision plus synthetic wall',O.size,storage),props=allocate('unused prop',64,storage),claim=allocate('explicit pin claim',4,GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST);
  readback=allocate('state readback',S.size,GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ);
  report.ownedBytes=owned.reduce((n,b)=>n+b.size,0);assert(report.ownedBytes<20*1024*1024,'Fixture memory bound exceeded');
  const bind=device.createBindGroup({layout:compute.begin.getBindGroupLayout(0),entries:[u,s,c,o,props].map((buffer,binding)=>({binding,resource:{buffer}}))});
  device.queue.writeBuffer(claim,0,new Uint32Array([13]));
  async function read(){const e=device.createCommandEncoder();e.copyBufferToBuffer(s,0,readback,0,S.size);device.queue.submit([e.finish()]);await readback.mapAsync(GPUMapMode.READ);mapped=true;const result=new Float32Array(readback.getMappedRange().slice(0));readback.unmap();mapped=false;return result;}
  async function run(name,{dt=1/60,steps=1,input=[1,0],pin=false,shoot=false,down=true,terminal=0,stale=false,fresh=false,wall=false,corner=false}={}){
   const state=new Float32Array(S.size/4),uniform=new Float32Array(U.size/4),counters=new Uint32Array(C.size/4);
   state.set([0,.35,0,down?0:100],L7.pos);state.set([1,0,0,0],L7.look);state.set([down&&!fresh?40:0,0,0,0],L7.player7);state[L7.goal+3]=terminal;state[L7.squad7+1]=stale?0:-1;state[L7.cell+3]=stale?1:0;
   state.set([2,2,0,2],L12.gear);state.set([3,3,15,0],L12.mag);state.set([180,48,9999,0],L12.reserve);state.set([2,1,1,100],L12.items);state[L12.flags+1]=down&&!fresh?1:0;state[L12.flags+2]=stale?1:0;state[L12.flags+3]=pin?13:0;state[L12.heal]=stale?.5:0;state[L7.motion+3]=stale?.16:0;
   uniform.set([dt,0,1,0],32);uniform.set([...input,shoot?1:0,0],36);uniform.set([1,0,0,0],40);uniform.set([2048,32768,1,0],44);uniform.set([1,0,0,0],60);uniform.set([2,0,0,0],84);uniform.set([0,0,stale?1:0,0],88);uniform[95]=0;
   device.queue.writeBuffer(s,0,state);device.queue.writeBuffer(c,0,counters);device.queue.writeBuffer(u,0,uniform);
   const dynamic=new Uint32Array(DYNAMIC_SIZE);if(wall||corner){const line=Math.floor((96+1)*2);for(let k=0;k<DYNAMIC_GRID;k++){dynamic[line+DYNAMIC_GRID*k]=7;if(corner)dynamic[k+DYNAMIC_GRID*line]=7;}}device.queue.writeBuffer(o,DYNAMIC_OFFSET*4,dynamic);
   const enc=device.createCommandEncoder({label:'owned crawl fixture '+name});for(let i=0;i<steps;i++){if(pin)enc.copyBufferToBuffer(claim,0,c,22*4,4);const pass=enc.beginComputePass({label:'production begin / synthetic crawl'});pass.setPipeline(compute.begin);pass.setBindGroup(0,bind);pass.dispatchWorkgroups(1);pass.end();}device.queue.submit([enc.finish()]);const result=await read();
   const n=Math.max(1,Math.hypot(...input)),seconds=dt*steps,expectedDistance=pin||terminal||dt===0?0:.6*seconds;
   if(!wall&&!corner){assert(Math.abs(result[L7.pos]-input[0]/n*expectedDistance)<.0002,name+': x displacement');assert(Math.abs(result[L7.pos+2]-input[1]/n*expectedDistance)<.0002,name+': z displacement');}
   else{assert(result[L7.pos]<.76,name+': wall crossed');if(corner)assert(result[L7.pos+2]<.76,name+': corner crossed');else if(input[1]!==0)assert(result[L7.pos+2]>.5,name+': wall sliding lost');}
   assert(result[L7.pos+3]===0,name+': health changed');assert(result[L7.player7]===40,name+': begin-only bleedout unexpectedly changed');if(pin){assert(result[L12.flags+3]===13,name+': pin latch not fed');assert(result[L7.look]===1&&result[L7.look+1]===0,name+': facing moved');assert(result[L12.events]===0,name+': pinned shot emitted');}
   if(shoot&&!pin&&!terminal){assert(result[L12.events]>0,name+': pistol shot missing');assert(result[L12.gear+3]===2,name+': wrong weapon');}
   if(fresh)assert(result[L7.runStats+3]===1,name+': knockout counted incorrectly');
   report.cases.push({name,dt,steps,seconds,input,pin,shoot,stale,fresh,terminal,position:Array.from(result.slice(L7.pos,L7.pos+4)),down:result[L7.player7],shots:result[L12.events],passed:true});
  }
  for(const hz of [30,60,120])for(const input of [[1,0],[1,1],[.5,0],[9,9],[0,0]])await run('five-second crawl '+hz+'Hz '+input,{dt:1/hz,steps:hz*5,input});
  await run('stale sprint/fuel/drag/heal do not alter crawl',{steps:120,stale:true});
  await run('fresh knockout enters current pistol/down state',{fresh:true});
  await run('crawl and emitted downed pistol shots',{steps:120,shoot:true});
  await run('pin claim wins over crawl and shoot',{steps:120,pin:true,shoot:true});
  await run('pause produces no displacement',{dt:0,steps:10});
  await run('terminal downed actor cannot crawl',{terminal:2,steps:120});
  await run('synthetic wall blocks unchanged footprint',{wall:true,steps:300});
  await run('synthetic wall preserves axis sliding',{wall:true,input:[1,1],steps:300});
  await run('synthetic corner blocks both axes',{corner:true,input:[1,1],steps:300});
  await device.queue.onSubmittedWorkDone();const error=await device.popErrorScope();scope=false;assert(!error,'GPU validation: '+error?.message);
  assert(settings.zombies===original.zombies&&settings.pool===original.pool&&allocatedBytes===original.allocatedBytes,'Production allocation/count mutation');report.productionCountsUnchanged=original;report.passed=true;return report;
 }catch(error){report.error=String(error?.stack||error);return report;}finally{try{if(mapped)readback.unmap();await device.queue.onSubmittedWorkDone();}catch(error){report.cleanupError=String(error);report.passed=false;}if(scope){try{await device.popErrorScope();}catch(error){report.cleanupError=String(error);report.passed=false;}}for(const b of owned)b.destroy();}
}
