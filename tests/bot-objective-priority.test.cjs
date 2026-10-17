'use strict';
// Run with node tests/bot-objective-priority.test.cjs [candidate.html].
// Exact mission fragments followed by the complete existing buddy CPU adapter.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {make,patient,step,v,clone,html,sha,fragment,helperRaw,crankRaw,fuelRaw,timerRaw}=require('./bot-objective-model.cjs');
const {withoutBotObjectivePriority23}=require('./runtime-scope.cjs');
const checks=[];
function test(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const parentSha256='2df704d882c5df5404ca880e1e4623ce63877846047de1f7349f3996d4b34f70';
const radius=90/64;
function charge(c,chapter,id){if(chapter===1)c.S.relay.y=4.199;else c.S.botPour15[id]=2.099;}
function unchangedResources(c){return JSON.stringify({hp:c.S.team7.map(a=>a.p.w),human:c.S.pos.w,kits:c.S.team7.map(a=>a.pack.w),items:c.S.botItems13.map(a=>Array.from(a)),mag:c.S.botMag13.map(a=>Array.from(a)),reserve:c.S.botReserve13.map(a=>Array.from(a)),fuel:Array.from(c.S.botFuel15),c74:c.C[74],c75:c.C[75]});}
function blocked(c,chapter,id){assert.equal(c.P[0].data.y,1);assert.equal(c.S.relay.z,0);assert.equal(c.S.relay.x,0);assert.equal(c.S.relay.w,0);assert.equal(c.S.botFuel15[id],1);assert.equal(c.waves.length,0);assert.equal(chapter===1?c.S.relay.y:c.S.botPour15[id],chapter===1?4.199:0);}
function committed(c,chapter,id){if(chapter===1){assert.equal(c.P[0].data.y,0);assert.equal(c.P[0].p.y,3.4);assert.equal(c.S.relay.z,1);assert.equal(c.S.orders.x,0);assert.equal(c.waves.length,1);}else{assert.equal(c.S.botFuel15[id],0);assert.equal(c.S.botPour15[id],0);assert.equal(c.S.relay.w,1);assert.equal(c.S.relay.x,0);assert.equal(c.waves.length,0);}}
function setOperatorX(c,id,x){c.S.team7[id].p.x=x;if(id===0)c.S.buddy=clone(c.S.team7[id].p);}

test('strict inverse recovers exact reviewed parent including prior five-fix stack',()=>assert.equal(sha(withoutBotObjectivePriority23(html)),parentSha256));
for(const chapter of [1,2])for(let id=0;id<3;id++)for(const pid of [-1,0,1,2].filter(p=>p!==id)){
 test(`nearby downed patient blocks near-complete objective Ch${chapter} operator${id} patient${pid}`,()=>{
  const c=make({chapter,id});charge(c,chapter,id);patient(c,pid);const before=unchangedResources(c);step(c,3);blocked(c,chapter,id);assert.equal(unchangedResources(c),before);
 });
 for(const [label,x,blocks] of [['inside',radius-1e-5,true],['exact',radius,false],['outside',radius+1e-5,false]])test(`strict revive radius ${label} Ch${chapter} operator${id} patient${pid}`,()=>{
  const c=make({chapter,id});charge(c,chapter,id);patient(c,pid,{x});step(c);if(blocks)blocked(c,chapter,id);else committed(c,chapter,id);
 });
}
for(const chapter of [1,2])for(let id=0;id<3;id++){
 for(const kind of ['healthy-human','zero-hp-human-no-down-timer','revived-bot','dead-bot','dead-bot-positive-hp','dragged-bot','positive-hp-bot-with-stale-down-timer'])test(`ineligible patient permits operation ${kind} Ch${chapter} operator${id}`,()=>{
  const c=make({chapter,id}),pid=(id+1)%3;charge(c,chapter,id);
  if(kind==='healthy-human')patient(c,-1,{hp:100,down:0});
  if(kind==='zero-hp-human-no-down-timer')patient(c,-1,{hp:0,down:0});
  if(kind==='revived-bot')patient(c,pid,{hp:35,down:0});
  if(kind==='dead-bot')patient(c,pid,{dead:true});
  if(kind==='dead-bot-positive-hp')patient(c,pid,{hp:35,dead:true});
  if(kind==='dragged-bot')patient(c,pid,{dragged:true});
  if(kind==='positive-hp-bot-with-stale-down-timer')patient(c,pid,{hp:35,down:40});
  step(c);committed(c,chapter,id);
 });
 test(`human down timer remains authoritative despite mixed positive HP Ch${chapter} operator${id}`,()=>{const c=make({chapter,id});charge(c,chapter,id);patient(c,-1,{hp:35,down:40});step(c);blocked(c,chapter,id);});
 test(`negative bot HP with no bleed timer still blocks Ch${chapter} operator${id}`,()=>{const c=make({chapter,id});charge(c,chapter,id);patient(c,(id+1)%3,{hp:-1,down:0});step(c);blocked(c,chapter,id);});
 test(`selection priority never queries threat or sight Ch${chapter} operator${id}`,()=>{const c=make({chapter,id});charge(c,chapter,id);patient(c,-1);c.threatNear7=()=>{throw Error('Priority must not test threat');};c.clearSegment7=()=>{throw Error('Priority must not test line of sight');};step(c);blocked(c,chapter,id);});
 for(const transition of ['revived','dead','dragged','out-of-range'])test(`operation resumes after patient becomes ${transition} Ch${chapter} operator${id}`,()=>{
  const c=make({chapter,id}),pid=(id+1)%3;charge(c,chapter,id);patient(c,pid);step(c);blocked(c,chapter,id);
  if(transition==='revived')patient(c,pid,{hp:35,down:0});
  if(transition==='dead')c.S.botLife13[pid].y=1;
  if(transition==='dragged')c.S.squad7.y=pid;
  if(transition==='out-of-range')patient(c,pid,{x:radius});
  step(c);if(chapter===1)committed(c,chapter,id);else{assert.equal(c.S.botPour15[id],1/60);assert.equal(c.S.botFuel15[id],1);step(c,126);committed(c,chapter,id);}
 });
 for(const disabled of ['down','pinned','out-of-objective-range','exact-objective-range'])test(`inherited operator eligibility ${disabled} Ch${chapter} operator${id}`,()=>{
  const c=make({chapter,id});charge(c,chapter,id);
  if(disabled==='down')patient(c,id,{x:0});
  if(disabled==='pinned')c.S.botLife13[id].w=1;
  if(disabled.includes('objective-range'))setOperatorX(c,id,115/64+(disabled==='out-of-objective-range'?1e-5:0));
  step(c);blocked(c,chapter,id);
 });
}
for(let id=0;id<3;id++)test(`priority helper excludes its own downed slot ${id}`,()=>{const c=make({id});patient(c,id,{x:0});assert.equal(c.botReviveFirst23(id),false);patient(c,(id+1)%3);assert.equal(c.botReviveFirst23(id),true);});
for(const kind of ['dead','dragged','healthy'])test(`nearest excluded patient does not hide farther eligible patient: ${kind}`,()=>{const c=make();patient(c,1,{x:.1,hp:kind==='healthy'?35:0,dead:kind==='dead',dragged:kind==='dragged'});patient(c,2,{x:1});charge(c,1,0);step(c);blocked(c,1,0);});
test('radius uses XZ Euclidean distance and ignores vertical height',()=>{const c=make();patient(c,-1,{x:1});c.S.pos.z=1;assert.equal(c.botReviveFirst23(0),false);c.S.pos.x=.5;c.S.pos.z=.5;c.S.pos.y=99;assert.equal(c.botReviveFirst23(0),true);});
for(const disabled of ['no-order','different-order-kind','open-gate'])test(`inherited crank guard ${disabled}`,()=>{const c=make();charge(c,1,0);if(disabled==='no-order')c.S.orders.x=0;if(disabled==='different-order-kind')c.S.order13.x=4;if(disabled==='open-gate')c.P[0].data.y=0;step(c);assert.equal(c.S.relay.y,4.199);assert.equal(c.S.relay.x,0);assert.equal(c.waves.length,0);});
for(const disabled of ['no-fuel','different-goal','already-active'])test(`inherited fuel guard resets partial hold: ${disabled}`,()=>{const c=make({chapter:2});charge(c,2,0);if(disabled==='no-fuel')c.S.botFuel15[0]=0;if(disabled==='different-goal')c.S.team7[0].ai.x=0;if(disabled==='already-active')c.S.relay.x=1;step(c);assert.equal(c.S.botPour15[0],0);assert.equal(c.S.relay.w,0);assert.equal(c.waves.length,0);});
test('existing Ch1 order still works with stale AI goal and without fuel',()=>{const c=make();c.S.team7[0].ai.x=0;c.S.botFuel15[0]=0;charge(c,1,0);step(c);committed(c,1,0);});
test('existing autonomous Ch2 fuel delivery does not require a manual order',()=>{const c=make({chapter:2});c.S.orders.x=0;charge(c,2,0);step(c);committed(c,2,0);});
for(let id=0;id<3;id++)test(`near-complete already active crank pauses without requeueing operator${id}`,()=>{const c=make({id});c.S.relay.x=1;c.S.relay.y=4.199;c.S.alarm.z=7;patient(c,-1);step(c,5);assert.equal(c.S.relay.x,1);assert.equal(c.S.relay.y,4.199);assert.equal(c.S.alarm.z,7);assert.equal(c.P[0].data.y,1);assert.equal(c.waves.length,0);patient(c,-1,{hp:35,down:0});step(c);assert.equal(c.P[0].data.y,0);assert.equal(c.S.relay.z,1);assert.equal(c.waves.length,0);});
for(const hz of [30,60,120]){
 test(`Ch1 crank pauses and resumes original 4.2-second total at ${hz}Hz`,()=>{const c=make({dt:1/hz});step(c,hz);const partial=c.S.relay.y;assert(Math.abs(partial-1)<1e-10);assert.equal(c.waves.length,1);patient(c,-1);step(c,hz);assert.equal(c.S.relay.y,partial);assert.equal(c.waves.length,1);patient(c,-1,{hp:35,down:0});let n=0;while(c.P[0].data.y>.5&&n<hz*4){step(c);n++;}assert.equal(c.P[0].data.y,0);assert(n/hz>=3.2-1e-10&&n/hz<=3.2+1/hz+1e-10);step(c,10);assert.equal(c.waves.length,1);});
 test(`Ch2 interrupted pour starts a fresh 2.1-second hold at ${hz}Hz`,()=>{const c=make({chapter:2,dt:1/hz});step(c,hz);assert(Math.abs(c.S.botPour15[0]-1)<1e-10);patient(c,-1);step(c);assert.equal(c.S.botPour15[0],0);assert.equal(c.S.botFuel15[0],1);patient(c,-1,{hp:35,down:0});let n=0;while(c.S.botFuel15[0]>.5&&n<hz*3){step(c);n++;}assert(n/hz>=2.1-1e-10&&n/hz<=2.1+1/hz+1e-10);committed(c,2,0);step(c,10);assert.equal(c.S.relay.w,1);});
}
for(let id=0;id<3;id++)test(`other unaffected operator can finish second can while operator${id} is rescue-blocked`,()=>{const c=make({chapter:2,id}),other=(id+1)%3;setOperatorX(c,id,-1);setOperatorX(c,other,1);patient(c,-1,{x:-1.5});c.S.botFuel15[other]=1;c.S.botPour15[id]=2.099;c.S.botPour15[other]=2.099;c.S.relay.w=1;step(c);assert.equal(c.S.botFuel15[id],1);assert.equal(c.S.botFuel15[other],0);assert.equal(c.S.botPour15[id],0);assert.equal(c.S.relay.w,2);assert.equal(c.S.relay.x,1);assert.equal(c.waves.length,1);step(c,130);assert.equal(c.S.relay.w,2);assert.equal(c.waves.length,1);assert.equal(c.S.botFuel15[id],1);});
for(const hz of [30,60,120])test(`activated Ch2 11-second opening stays autonomous during rescue at ${hz}Hz`,()=>{const c=make({chapter:2,dt:1/hz});c.S.relay.w=1;c.S.botPour15[0]=2.099;step(c,1,{timer:true});assert.equal(c.S.relay.x,1);assert.equal(c.waves.length,1);patient(c,-1);step(c,hz*10,{timer:true});assert.equal(c.P[0].data.y,1);let n=0;while(c.P[0].data.y>.5&&n<hz*2){step(c,1,{timer:true});n++;}assert.equal(c.P[0].data.y,0);assert.equal(c.S.relay.z,1);assert(c.S.relay.y>=11&&c.S.relay.y<=11+1/hz+1e-10);assert.equal(c.S.pos.w,0);assert.equal(c.C[74],0);assert.equal(c.waves.length,1);});
for(const chapter of [1,2])for(const disabled of ['pause','victory','defeat','chooser'])test(`adapter scheduler precondition freezes objective/timer ${disabled} Ch${chapter}`,()=>{const c=make({chapter});charge(c,chapter,0);if(disabled==='pause')c.u.clock.x=0;if(disabled==='victory')c.S.goal.w=1;if(disabled==='defeat')c.S.goal.w=2;if(disabled==='chooser')c.S.chooser.x=1;const before=JSON.stringify({relay:Array.from(c.S.relay),pour:Array.from(c.S.botPour15),fuel:Array.from(c.S.botFuel15)});step(c,2,{timer:true,buddy:true});assert.equal(JSON.stringify({relay:Array.from(c.S.relay),pour:Array.from(c.S.botPour15),fuel:Array.from(c.S.botFuel15)}),before);assert.equal(c.waves.length,0);});
for(const chapter of [3,4,5,6])test(`new objective fragments do not affect Chapter${chapter}`,()=>{const c=make({chapter});charge(c,2,0);patient(c,-1);const before=JSON.stringify({relay:Array.from(c.S.relay),pour:Array.from(c.S.botPour15),fuel:Array.from(c.S.botFuel15)});step(c);assert.equal(JSON.stringify({relay:Array.from(c.S.relay),pour:Array.from(c.S.botPour15),fuel:Array.from(c.S.botFuel15)}),before);assert.equal(c.waves.length,0);});

// Actual buddy update/claims/GOAP bodies, with controlled geometry/threats/movement.
for(const chapter of [1,2])for(let id=0;id<3;id++)for(const pid of [-1,0,1,2].filter(p=>p!==id))test(`mission-before-full-buddy replans stale operation and rescues Ch${chapter} operator${id} patient${pid}`,()=>{
 const c=make({chapter,id});charge(c,chapter,id);patient(c,pid);const kits=c.S.team7.map(a=>a.pack.w);step(c,1,{buddy:true});blocked(c,chapter,id);assert.equal(c.S.team7[id].ai.x,7);assert.equal(c.C[74],0);
 let frames=1;while(c.C[74]===0&&frames<180){step(c,1,{buddy:true});frames++;}
 assert.equal(c.C[74],1);assert.equal(c.C[75],0);assert.equal(pid<0?c.S.pos.w:c.S.team7[pid].p.w,35);assert.deepEqual(c.S.team7.map(a=>a.pack.w),kits);assert.equal(c.S.botFuel15[id],1);assert.equal(c.S.relay.w,0);assert.equal(c.P[0].data.y,1);assert.equal(c.waves.length,0);assert.equal(c.S.team7[id].stats.x,1);assert.equal(c.observedClaims[pid+1],id);
 if(chapter===1){step(c,1,{buddy:true});committed(c,chapter,id);}else{let n=0;while(c.S.botFuel15[id]>.5&&n<200){step(c,1,{buddy:true});n++;}committed(c,chapter,id);}
 assert.equal(c.C[74],1);return{framesUntilRescue:frames};
});
for(const obstruction of ['threat','sight'])test(`full buddy cannot rescue through ${obstruction} and objective remains blocked`,()=>{const c=make({chapter:2});charge(c,2,0);patient(c,-1);if(obstruction==='threat')c.threatNear7=()=>1;else c.clearSegment7=()=>false;step(c,180,{buddy:true});assert.equal(c.C[74],0);assert.equal(c.S.pos.w,0);assert.equal(c.S.botFuel15[0],1);assert.equal(c.S.relay.w,0);assert.equal(c.waves.length,0);});
test('production dispatcher remains begin then mission5 then buddy',()=>{const a=html.indexOf("\n pass(enc,'begin',bindings.begin,1,beginExtra);"),b=html.indexOf("\n pass(enc,'mission5',bindings.mission5[zParity],1);",a),d=html.indexOf("\n pass(enc,'buddy',bindings.buddy[zParity],1);",b);assert(a>0&&b>a&&d>b);});
for(const chapter of [1,2])test(`same behavioral oracle catches parent regression Ch${chapter}`,()=>{
 const parent=withoutBotObjectivePriority23(html),c=make({chapter});charge(c,chapter,0);patient(c,-1);
 const raw=fragment(parent,'if(u.run.x==1.0&&S.orders.x>.5&&S.order13.x==5.0)')+fragment(parent,'if(u.run.x==2.0){for(var id=0u;id<3u;id++)');
 vm.runInContext('function objectiveTick(){const dt=u.clock.x;'+raw.replace(/\b(\d+)u\b/g,'$1').replace(/\bvar\b/g,'let')+'}',c);step(c);
 assert.throws(()=>blocked(c,chapter,0));committed(c,chapter,0);
});
test('strict inverse rejects duplicate helper and guards rather than masking scope drift',()=>{assert.throws(()=>withoutBotObjectivePriority23(html+'\n// Bot machinery must not bypass the source\'s nearby revive interaction priority.\n'+helperRaw+'\n'));assert.throws(()=>withoutBotObjectivePriority23(html+'\n'+crankRaw));assert.throws(()=>withoutBotObjectivePriority23(html+'\n'+fuelRaw));});
const report={method:'Exact Ch1 crank, Ch2 fuel and autonomous opening fragments, optionally followed by complete production buddy update/claims/GOAP mechanically adapted to JavaScript. Geometry, threat and movement are controlled; selected fragment harness omits other mission work including order expiry, demo/config guards, and uses scheduler inactivity preconditions. No full mission/begin shader execution, WGSL compilation, f32 timing, natural gameplay or complete ordering-parity claim.',candidateSha256:sha(html),parentSha256,helperSha256:sha(helperRaw),crankSha256:sha(crankRaw),fuelSha256:sha(fuelRaw),timerSha256:sha(timerRaw),passed:checks.every(x=>x.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
