'use strict';
// ZAMN events 1: neighbor types (Pool Guy in the pool, BBQ Dad and Trampoline Timmy in the front yard, Tiffany indoors) with their own
// props, quips that name the neighbor who changed state, and a banner for typed rescues.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutVictims47}=require('./victims47.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('types follow the fixed order, fall back indoors without a pool or a clear yard, and every name on a street is unique',()=>{
 const seen={};for(let s=1;s<=16;s++){const h=loadHost(file,{seed:(s*7919)+'&sandbox'});const r=h.json('(()=>{const w=makeWorld();return w.civilians30.map((c,i)=>({i,type:c.type,name:c.name,x:c.x,z:c.z,more:Array.from(w.props.slice(c.slot*16+12,c.slot*16+15)),pool:(w.pools45||[]).some(p=>c.x>p.x&&c.x<p.x+p.w&&c.z>p.z&&c.z<p.z+p.d)}))})()');
  for(const c of r){assert([0,[0,2,1,3,4,1,2,4][c.i]].includes(c.type),'order');assert.deepEqual(c.more,[Math.fround(c.x),Math.fround(c.z),c.type],'type and home in more');if(c.type===1)assert(c.pool,'pool guy is in a pool');seen[c.type]=(seen[c.type]||0)+1;}
  assert.equal(new Set(r.map(c=>c.name)).size,r.length,'unique names');}
 for(const t of [0,1,2,3,4])assert(seen[t]>0,'type '+t+' appears');return {typeCounts:seen};
});
check('a quip names the neighbor who joined, and saving a typed neighbor shows a banner',()=>{
 const h=loadHost(file,{seed:'99&sandbox'});h.run('reset();glyphBuffer={name:"glyphBuffer"};settings.started=true;playerValues[3]=100;for(let c=0;c<world.civilians30.length;c++)playerValues[CIV_STATE30+c*4+2]=1;hud();');
 const names=h.json('world.civilians30.map(c=>c.name)'),bbq=h.json('world.civilians30.findIndex(c=>c.type===2)');
 h.run(`playerValues[CIV_STATE30+${bbq}*4+2]=2;hud()`);assert(h.json('civNote30').includes(names[bbq]),h.json('civNote30'));
 h.run(`playerValues[CIV_STATE30+${bbq}*4+2]=3;hud()`);assert.equal(h.json('civBanner47'),names[bbq].toUpperCase()+' RESCUED!');assert(h.json('civNote30').includes(names[bbq]));
 h.run('playerValues[CIV_STATE30+2]=4;hud()');assert(h.json('civNote30').includes(names[0]),'lost note names the right neighbor');
});
check('type props and poses are drawn from more.z; quips exist for every type and outcome',()=>{
 const src=Object.values(loadHost(file).sources).find(s=>s.includes('fn civilian30('));assert(src.includes('let kind30=u32(c.more.z);'));for(const t of [1,2,3,4])assert(src.includes(`if(kind30==${t}u){`),'props for '+t);
 const lines=loadHost(file).json('CIV_TYPE_LINES47');for(let t=1;t<=4;t++)for(const k of ['join','saved','lost'])assert(lines[t][k].length>=2);
});
check('exact inverse restores the immutable pre-neighbor-types runtime',()=>{assert.equal(sha(withoutVictims47(html)),delta.parentSha256);});
const report={method:'World builder and HUD in the CPU host; frames rendered on SwiftShader for the PR.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
