'use strict';
// CPU-only control-flow checks of the exact WGSL director block. No browser/GPU.
// This restricted transcription supplies scalar/vector builtins and controlled
// intensity inputs; it does not establish WGSL compilation or float32 timing.
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),baselinePath=process.argv[2];
if(!baselinePath)throw Error('Usage: node tools/check_recovery_pacing.cjs baseline.html [candidate.html] [report.json]');
const candidatePath=process.argv[3]||path.join(root,'index.html'),reportPath=process.argv[4];
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function load(file){
 const bytes=fs.readFileSync(file),html=bytes.toString('utf8'),script=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));new vm.Script(script);
 const c={console,URLSearchParams,location:{search:''},document:{getElementById(){return{}}},addEventListener(){},atob:s=>Buffer.from(s,'base64').toString('binary')};c.window=c;vm.createContext(c);vm.runInContext(script.replace('main().catch(fail);',''),c);
 const source=c.__TINY_SOURCES__.mission5,start=source.indexOf(' // Squad intensity,'),end=source.indexOf(' atomicStore(&C[78]',start);assert(start>=0&&end>start);
 const block=source.slice(start,end),guard=source.match(/ if\(dt<=0\.0\|\|S\.goal\.w>0\.0\|\|u\.config\.z<\.5\)\{return;\}/)[0];
 const lab=source.match(/ if\(u\.run\.y>\.5\)\{S\.supplies=vec4f\(8,3,0,0\);return;\}/)[0];
 const translated=(guard+lab+block).replace(/\b(\d+)u\b/g,'$1').replace(/atomicAdd\(&C\[(\d+)\],([^)]*)\)/g,'addCounter(C,$1,$2)');
 const fn=new Function('S','u','C','dt','rnd','clamp','max','floor','select','distance','u32','vec4f','addCounter',translated);
 return {html,block,sha:sha(bytes),blockSha:sha(block),sources:c.__TINY_SOURCES__,run(code){return vm.runInContext(code,c);},step(state,dt,input={}){
  const {S,u,C}=state;u.config.z=input.started===false?0:1;u.run.y=input.lab?1:0;S.goal.w=input.complete?1:0;
  if(input.pressure!==undefined)S.team7[0].memory.y=input.pressure/.085;
  S.alarm.z=input.alarm?1:0;if(input.distance!==undefined)S.pos.x=input.distance;
  if(input.downed!==undefined)S.player7.x=Number(input.downed);
  if(input.damage)S.pos.w=Math.max(0,S.pos.w-input.damage);
  if(input.alerted!==undefined)S.pace7.w=input.alerted*256;
  if(dt>0&&u.config.z&& !S.goal.w)S.aux.x+=dt;
  fn(S,u,C,dt,()=>state.random, (x,a,b)=>Math.min(b,Math.max(a,x)),Math.max,Math.floor,(a,b,c)=>c?b:a,(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),x=>x>>>0,vec,(a,i,n)=>a[i]+=n);
  return {phase:S.director.x,phaseTime:S.director.y,intensity:S.pace7.x,alarm:S.alarm.z,wave:S.wave.x,journey:S.journey7.x,progress:S.journey7.z,relaxFor:S.pace7.z,replenishmentAllowed:S.journey7.x>=.5&&(![0,3].includes(S.director.x)||S.alarm.z>0)};
 }};
}
function vec(x=0,y=0,z=0,w=0){return {x,y,z,w,get xy(){return[this.x,this.y]},get xz(){return[this.x,this.z]}};}
function fixture({phase=3,phaseTime=0,intensity=0,departed=true,progress=30,random=.5}={}){
 return {random,C:new Array(96).fill(0),u:{config:vec(0,0,1),run:vec(1,0),route:vec(0,0,90,90)},S:{pos:vec(progress,0,0,100),goal:vec(),aux:vec(),supplies:vec(),player7:vec(),runStats:vec(),pace7:vec(intensity,progress,17+random*7,0),director:vec(phase,phaseTime,intensity,100),journey7:vec(departed?1:0,0,progress,0),wave:vec(),alarm:vec(),radio7:vec(),team7:Array.from({length:3},(_,i)=>({vital:vec(0,0,i===0?1:0),memory:vec(),p:vec(0,0,0,80)}))}};
}
function run(build,seconds,input,options={},dt=1/60){
 const state=fixture(options),events=[],samples=[];let previous=state.S.director.x;
 for(let n=0;n<Math.ceil(seconds/dt);n++){const t=(n+1)*dt,out=build.step(state,dt,input(t));if(out.phase!==previous){events.push({t,...out});previous=out.phase;}if(n%Math.max(1,Math.round(.5/dt))===0)samples.push({t,...out});}
 return {events,samples,final:{phase:state.S.director.x,time:state.S.director.y,intensity:state.S.pace7.x}};
}
const baseline=load(baselinePath),candidate=load(candidatePath),same=baseline.sha===candidate.sha;
const cases=[
 ['sustained_pressure',60,()=>({pressure:1}),{intensity:1}],
 ['fight_ends_at_40s',80,t=>({pressure:t<40?1:0}),{intensity:1}],
 ['intermittent_calm',18,t=>({pressure:t%4<2.7?.35:0}),{}],
 ['recovery_interrupted',40,t=>({pressure:t>=2&&t<7?.6:0}),{phase:0,phaseTime:8}],
 ['alarm_during_recovery',42,t=>({pressure:0,alarm:t>=2&&t<12}),{phase:0,phaseTime:8}],
 ['quiet_time_exit',28,()=>({pressure:0}),{phase:0}],
 ['movement_exit',12,t=>({pressure:0,distance:t>=2?48:30}),{phase:0}],
 ['preparation',45,()=>({pressure:1,alarm:true,distance:0}),{phase:0,departed:false,progress:0}],
 ['downed_survivor',60,()=>({pressure:0,downed:true}),{}],
 ['alerted_crowd',60,()=>({pressure:0,alerted:80}),{intensity:.5}],
 ['alerted_crowd_clears',80,t=>({pressure:0,alerted:t<40?80:0}),{intensity:.5}],
 ['lab_unchanged',20,()=>({pressure:1,lab:true}),{phase:1}],
 ['completed_run',20,()=>({pressure:1,complete:true}),{phase:1}],
 ['not_started',20,()=>({pressure:1,started:false}),{phase:1}]
];
const results={};for(const [name,seconds,input,options]of cases)results[name]={baseline:run(baseline,seconds,input,options),candidate:run(candidate,seconds,input,options)};
const baselineEarly=results.sustained_pressure.baseline.events.find(e=>e.phase===0);assert(baselineEarly&&baselineEarly.t>=16-1e-8&&baselineEarly.t<16.1&&baselineEarly.intensity===1,'Baseline must reproduce high-pressure RELAX entry');
assert(results.sustained_pressure.baseline.events.some(e=>e.phase===1&&e.t<41),'Baseline must reproduce automatic replenishment resuming during the same fight');
const report={method:'Node VM extracts exact current WGSL mission director block; restricted scalar transcription executes that block with controlled intensity inputs and a fixed RNG sample. CPU control-flow evidence only: no browser, WebGPU execution, perception simulation, float32/atomic timing, or gameplay performance claim.',baselineSha256:baseline.sha,candidateSha256:candidate.sha,baselineBlockSha256:baseline.blockSha,candidateBlockSha256:candidate.blockSha,baselineReproduced:true,candidateImplemented:!same,results,checks:[]};
if(!same){
 const changed=Object.keys(baseline.sources).filter(k=>baseline.sources[k]!==candidate.sources[k]);assert.deepEqual(changed,['mission5']);
 assert.equal(baseline.html.replace(baseline.block,''),candidate.html.replace(candidate.block,''),'Entire HTML outside director block must remain byte-equivalent');
 assert.equal(baseline.run('COMMON'),candidate.run('COMMON'));
 const c=name=>results[name].candidate;
 assert.equal(c('sustained_pressure').events.length,0);assert.equal(c('downed_survivor').events.length,0);
 assert.equal(c('alerted_crowd').events.length,0);const crowdCalm=c('alerted_crowd_clears').events.find(e=>e.phase===0);assert(crowdCalm.t>=43.75&&crowdCalm.t<44);
 assert(c('sustained_pressure').samples.every(x=>!x.replenishmentAllowed));
 const calm=c('fight_ends_at_40s').events.find(e=>e.phase===0),next=c('fight_ends_at_40s').events.find(e=>e.phase===1);assert(calm.t>=46.25&&calm.t<46.5);assert(next.t-calm.t>=20.5&&next.t-calm.t<20.6);
 assert.equal(c('intermittent_calm').events.length,0);
 const interrupted=c('recovery_interrupted').events;assert.equal(interrupted[0].phase,3);assert(interrupted[0].t>=2&&interrupted[0].t<2.1);assert(interrupted.find(e=>e.phase===0).t>=11.25);
 const alarm=c('alarm_during_recovery');assert(alarm.samples.filter(x=>x.alarm).every(x=>x.wave===2&&x.replenishmentAllowed));const relax=alarm.events.find(e=>e.phase===0),build=alarm.events.find(e=>e.phase===1);assert(relax.t>=15&&relax.t<15.1);assert(build.t-relax.t>=20.5);
 for(const name of ['quiet_time_exit','movement_exit','preparation','lab_unchanged','completed_run','not_started'])assert.deepEqual(c(name),results[name].baseline,name+' behavior must remain unchanged');
 assert(c('movement_exit').events[0].t>7&&c('movement_exit').events[0].t<7.1);assert(c('preparation').samples.every(x=>!x.replenishmentAllowed&&x.wave===0));
 const paused=fixture({phase:3,phaseTime:2,intensity:.1});const before=JSON.stringify(paused.S);candidate.step(paused,0,{pressure:0});assert.equal(JSON.stringify(paused.S),before,'Pause must not consume recovery');
 report.sweep=[];
 for(const dt of [1/120,1/60,1/30,.1])for(const random of [0,.5,.999]){
  const r=run(candidate,35,()=>({pressure:0}),{random},dt),start=r.events.find(e=>e.phase===0),end=r.events.find(e=>e.phase===1),desired=17+random*7;
  assert(start.t>3-1e-8&&start.t<=3+dt+1e-7);assert(end.t-start.t>=desired-1e-7&&end.t-start.t<=desired+dt+1e-7);
  report.sweep.push({dt,random,calmGateSeconds:start.t,recoverySeconds:end.t-start.t,desired});
 }
 assert.deepEqual(run(candidate,80,t=>({pressure:t<40?1:0}),{intensity:1}),results.fight_ends_at_40s.candidate,'Identical inputs must be deterministic');
 report.checks=['baseline premature recovery reproduced','persistent pressure and downed survivor hold FADE','existing awake-crowd input holds FADE and can settle','three continuous calm seconds','full recovery after combat ends','pressure interruption returns to FADE','forced alarm behavior preserved without consuming recovery','normal time and movement exits preserved','preparation/lab/not-started/completion/pause preserved','12 timestep/RNG boundary cases','deterministic repeat','only mission director block changed; all other HTML and WGSL exact'];report.passed=true;
}
if(reportPath)fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({baselineSha256:baseline.sha,candidateSha256:candidate.sha,baselineEarlyRecovery:baselineEarly,candidateImplemented:!same,passed:report.passed,checks:report.checks,events:Object.fromEntries(Object.entries(results).map(([n,r])=>[n,{baseline:r.baseline.events,candidate:r.candidate.events}]))},null,2));
