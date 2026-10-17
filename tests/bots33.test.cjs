'use strict';
// Perf pass 2: the bots' five full-horde scans query only the zombie-grid cells inside each scan's radius.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutBots33}=require('./bots33.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const h=loadHost(file),src=h.sources;
check('no bot scan walks the whole horde any more; five grid queries with the original radii',()=>{
 const b=src.buddy;assert(!b.includes('u32(u.config.x)'));
 for(const [n,x,z,r] of [[0,'point.x','point.y','rad'],[1,'p.x','p.y','4.5'],[2,'a.p.x','a.p.z','4.0'],[3,'a.p.x','a.p.z','10.0'],[4,'a.p.x','a.p.z','(760.0/64.0)']])assert(b.includes(`let lx${n}=clamp(i32(floor(${x}-${r}+HALF)),0,191);let lz${n}=clamp(i32(floor(${z}-${r}+HALF)),0,191);let hx${n}=clamp(i32(floor(${x}+${r}+HALF)),0,191);let hz${n}=clamp(i32(floor(${z}+${r}+HALF)),0,191);`),'site '+n);
 assert(b.includes('@group(0) @binding(6) var<storage,read> H:array<u32>;'));assert(h.script.includes('bindings.buddy=[zA,zB].map(z=>bg(compute.buddy,[[0,U],[1,S],[2,C],[3,O],[4,z],[5,Props],[6,zHeads]]));'));
 assert(src.gridZ.includes('if(Z[i].p.w<=0.0){return;}let cell=zcell(Z[i].p.xz);'),'grid holds every living infected');
});
check('grid query visits exactly the living infected within the radius (2,000 random hordes, CPU mirror of gridZ + the query)',()=>{
 let seed=12345;const rnd=()=>(seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;const cellOf=(x,z)=>{const cx=Math.min(191,Math.max(0,Math.floor(x+96))),cz=Math.min(191,Math.max(0,Math.floor(z+96)));return cx+192*cz;};
 for(let t=0;t<2000;t++){const n=1+Math.floor(rnd()*300),cx=(rnd()-.5)*200,cz=(rnd()-.5)*200,R=[4,4.5,10,760/64,rnd()*15][t%5];
  const zs=Array.from({length:n},()=>({x:cx+(rnd()-.5)*40,z:cz+(rnd()-.5)*40,alive:rnd()>.1}));const heads=new Map(),next=new Int32Array(n);
  zs.forEach((z,i)=>{if(!z.alive)return;const c=cellOf(z.x,z.z);next[i]=heads.get(c)??0;heads.set(c,i+1);});
  const center=[cx+(rnd()-.5)*10,cz+(rnd()-.5)*10];const lo=[0,1].map(a=>Math.min(191,Math.max(0,Math.floor(center[a]-R+96)))),hi=[0,1].map(a=>Math.min(191,Math.max(0,Math.floor(center[a]+R+96))));
  const seen=new Set();for(let z=lo[1];z<=hi[1];z++)for(let x=lo[0];x<=hi[0];x++){let it=heads.get(x+192*z)??0;for(let g=0;g<256&&it>0;g++){const j=it-1;it=next[j];if(Math.hypot(zs[j].x-center[0],zs[j].z-center[1])<R)seen.add(j);}}
  const want=new Set(zs.map((z,i)=>z.alive&&Math.hypot(z.x-center[0],z.z-center[1])<R?i:-1).filter(i=>i>=0));
  assert.deepEqual([...seen].sort((a,b)=>a-b),[...want].sort((a,b)=>a-b),'trial '+t);}
});
check('exact inverse restores the immutable pre-bot-scan runtime',()=>{assert.equal(sha(withoutBots33(fs.readFileSync(file,'utf8'))),delta.parentSha256);});
const report={method:'Source fragments and a CPU mirror of gridZ plus the grid query; no WGSL execution here.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
