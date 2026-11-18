'use strict';
// Exercises translated scalar gates from the composed WGSL, not GPU or ordinary input.
const assert=require('node:assert/strict'),path=require('node:path'),crypto=require('node:crypto'),fs=require('node:fs');
const file=path.resolve(process.argv[2]||path.join(__dirname,'../index.html'));
const {loadHost}=require(process.argv[3]?path.resolve(process.argv[3]):'./deadends-cpu-host.cjs');
const src=loadHost(file,{plain:true}).sources.mission5;
const section=(start,end)=>{
 const a=src.indexOf(start), b=src.indexOf(end,a);
 assert(a>=0&&b>a,`missing mission block ${start}`);return src.slice(a,b);
};
const intro=src.match(/fn neighborsOutstanding98\(\)->u32 \{[^\n]+/)[0].replace('fn neighborsOutstanding98()->u32','function neighborsOutstanding98()');
const revive=src.match(/for\(var k=0u;k<3u;k\+\+\)\{if\([^\n]+distance\(S\.team7\[k\]\.p\.xz,S\.pos\.xz\)<1\.6[^\n]+/)[0];
const attendance=section('let dp=S.pos.xz-u.route.zw;','if(inside&&S.player7').replace('S.spare5.x=f32(atomicExchange(&C[56],0u));','S.spare5.x=infectedInside;');
const finishing=section('if(inside&&ready&&u.controls.x>.5)','if(distance(S.pos.xz,u.route.zw)<18.0');
const tr=s=>s.replace(/(\d+)u\b/g,'$1').replaceAll('S.pos.xz-u.route.zw','offset(S.pos.xz,u.route.zw)').replaceAll('S.buddy.xz-u.route.zw','offset(S.buddy.xz,u.route.zw)').replaceAll('S.team7[k].p.xz-u.route.zw','offset(S.team7[k].p.xz,u.route.zw)');
const step=new Function('S','P','u','dt','infectedInside',`const CIV_BASE30=180,f32=Number,abs=Math.abs,max=Math.max,min=Math.min,announce=()=>{},offset=(a,b)=>({x:a.x-b.x,y:a.y-b.y}),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
${tr(intro)};${tr(revive)};const reviveTarget=S.mission5.z;${tr(attendance)};${tr(finishing)};return {ready,inside,allInside,reviveTarget}`);
const point=(x=0,y=0)=>({x,z:y,xz:{x,y}});
const props=Array.from({length:192},(_,i)=>({p:{w:i>=180?30:0},data:{y:i%2?3:4}}));
const u={route:{zw:{x:0,y:0}},controls:{x:1},goals:{x:10,y:20,z:30,w:40}};
const create=()=>({pos:{...point(),w:100},team7:Array.from({length:3},()=>({p:{...point(),w:36}})),buddy:{...point(),w:36},botLife13:Array.from({length:3},()=>({y:0})),goal:{x:2.4,y:2.4,z:0,w:0},player7:{x:0},rescue:{x:2,z:1},squad7:{},spare5:{},mission5:{y:0,z:-1},objectivePoint:{},relay:{z:2,w:2},escape:{x:0,y:0},orders:{x:1},cell:{...point(),w:2},stageRecord:{},aux:{x:42}});
function setSlot(s,i,state){
 const outside=state.endsWith('Out'),dead=state.startsWith('dead'),down=state.startsWith('down');
 Object.assign(s.team7[i].p,point(outside?3:i===0?.4:1),{w:dead||down?0:36});
 s.botLife13[i].y=dead?1:0;
 if(i===0){s.buddy={...s.team7[i].p};s.rescue={x:dead||down?0:2,z:dead?0:1};}
}
function tick(s,infected=0,input=1,dt=.025){s.mission5.z=-1;return step(s,props,{...u,controls:{x:input}},dt,infected);}
const statuses=['liveIn','liveOut','downIn','downOut','deadIn','deadOut'];
let permutations=0;
for(const a of statuses)for(const b of statuses)for(const c of statuses){
 const s=create(),states=[a,b,c];states.forEach((state,i)=>setSlot(s,i,state));
 const attend=states.filter(st=>!st.startsWith('dead'));
 const all=attend.every(st=>st.endsWith('In'));
 let r=tick(s);
 assert.equal(r.ready,all,states.join(','));
 assert.equal(r.allInside,all);
 assert.equal(s.squad7.z,attend.filter(st=>st.endsWith('In')).length);
 assert.equal(r.reviveTarget,states.findLastIndex(st=>st==='downIn'));
 if(a.startsWith('dead')){assert.equal(s.mission5.x,4);assert.equal(s.buddy.w,0);}
 for(let n=0;n<300;n++)tick(s);
 assert.equal(s.goal.w,all?1:0);
 if(a.startsWith('dead')){assert.equal(s.buddy.w,0);assert.equal(s.rescue.x,0);}
 if(a==='liveIn'&&all){assert.equal(s.buddy.w,50);assert.equal(s.rescue.x,4);}
 permutations++;
}
const blocked=(edit)=>{const s=create();edit(s);for(let n=0;n<300;n++)tick(s);assert.equal(s.goal.w,0);};
blocked(s=>s.rescue.z=0); blocked(s=>s.pos=point(3));blocked(s=>s.player7.x=1);
blocked(s=>s.goal.x=2.39);blocked(s=>s.goal.y=2.39);
const occupied=create();for(let n=0;n<300;n++)tick(occupied,1);assert.equal(occupied.escape.x,1);assert.equal(occupied.goal.w,0);assert.equal(occupied.escape.y,0);
for(let n=0;n<125;n++)tick(occupied);assert.equal(occupied.goal.w,1);
const interrupted=create();
for(let n=0;n<90;n++)tick(interrupted);assert.equal(interrupted.escape.x,1);
setSlot(interrupted,2,'downOut');for(let n=0;n<160;n++)tick(interrupted);assert.equal(interrupted.goal.w,0);
setSlot(interrupted,2,'deadOut');for(let n=0;n<125;n++)tick(interrupted);assert.equal(interrupted.goal.w,1);
const civilians=create();props[180].data.y=2;for(let n=0;n<300;n++)tick(civilians);assert.equal(civilians.escape.x,0);
props[180].data.y=4;for(let n=0;n<245;n++)tick(civilians);assert.equal(civilians.goal.w,1);
console.log(JSON.stringify({sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),permutations,checks:['intro','relays','player outside/downed','revive targeting','enemy occupancy','mid-seal casualty','civilian terminal vs outstanding','win and lead HP'],method:'Translated scalar branches from real composed WGSL at a fixed shelter; no GPU execution or ordinary playthrough'},null,2));
