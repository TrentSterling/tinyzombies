'use strict';
// ZAMN events 2: cheese wheels (prop 32). Kicked, shoved or blasted, they roll, bounce off walls and crush infected in their path.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutCheese49}=require('./cheese49.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8'),parent=path.join(__dirname,'.cheese49-parent.html');fs.writeFileSync(parent,withoutCheese49(html));
const W=(f,seed)=>loadHost(f,{seed}).json('(()=>{const w=makeWorld();return {b:w.buildings,civ:w.civilians30,count:w.count,cheese:w.cheese48||[],props:Array.from(w.props.slice(0,w.propCount*16)),n:w.propCount}})()');
check('every street gets up to 8 wheels, appended after the existing props, with the layout untouched',()=>{
 const out={};for(const s of ['4242&sandbox','73129&sandbox','99&sandbox']){const a=W(file,s),b=W(parent,s);assert.deepEqual(a.b,b.b);assert.deepEqual(a.civ,b.civ);assert.equal(a.count,b.count);
  assert.deepEqual(a.props.slice(0,b.n*16),b.props,'existing props unchanged');assert.equal(a.n,b.n+a.cheese.length);assert(a.cheese.length>=5&&a.cheese.length<=8);assert(a.n<=loadHost(file).json('CIV_BASE30'));
  for(const c of a.cheese){assert.deepEqual(a.props.slice(c.index*16,c.index*16+4),[Math.fround(c.x),Math.fround(.45),Math.fround(c.z),32]);}out[s]=a.cheese.length;}
 const c=W(file,73129);assert.equal(c.cheese.length,0,'no wheels in the chapters');return out;
});
check('kick, shove and blast set the velocity; walls bounce at 55%; light friction; kicks counted in C[48]',()=>{
 const p=loadHost(file).sources.props;for(const f of ['if(length(v)<3.0&&near<1.0&&length(S.motion.xy)>.3){kick=9.5;}','if(meleeInside8(c.p.xyz,vec3f(.5),S.melee8,S.meleeDir8)){kick=12.0;}','atomicAdd(&C[48],1u);','v.x=-v.x*.55;','v*=exp(-dt*.30);','if(pr.p.w==32.0){P[i]=cheese48(pr);continue;}'])assert(p.includes(f),f);
 assert(html.includes('bindings.props=bg(compute.props,[[0,U],[1,S],[2,C],[3,Props],[4,Events],[5,Groups],[6,O]]);'));
 let v=9.5,x=0;for(let i=0;i<60*12;i++){x+=v/60;v*=Math.exp(-.3/60);if(v<.25)break;}assert(x>25&&x<35,'rolls about 30 m: '+x.toFixed(1));
});
check('a fast wheel marks the crush bit under its footprint, which the zombie pass already turns into a crush kill',()=>{
 const s=loadHost(file).sources;assert(s.dynamic.includes('if(pr.p.w==32.0){if(length(pr.aux.xy)>2.0){'));assert(s.dynamic.includes('0x10000000u'));assert(s.zombies.includes('&0x10000000u)!=0u){damage+=200.0;atomicAdd(&C[34],1u);}'));
});
check('HUD: SAY CHEESE! on each kick, and a fourth house rule',()=>{
 const h=loadHost(file,{plain:true});h.run('reset();glyphCount=0;counters[48]=0;time=5;calloutsHUD30(1);counters[48]=1;glyphCount=0;calloutsHUD30(1)');assert(h.json('glyphCount')>10);assert.equal(h.json('cheeseSeen48'),1);
 assert(html.includes("'Walk into a cheese wheel. It flattens everything in its path.'"));
});
check('exact inverse restores the immutable pre-cheese runtime',()=>{assert.equal(sha(withoutCheese49(html)),delta.parentSha256);});
fs.unlinkSync(parent);
const report={method:'World builder and HUD in the CPU host against the exact parent; rolling and crushing ran on SwiftShader with the real props, dynamic, zombie and crowd shaders (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
