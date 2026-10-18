'use strict';
// Milestone 2b: falling wreckage crushes infected, breakage is a noise, CRUSHED / CHAIN callouts.
// Source fragments and exact host functions; GPU execution evidence is described in the PR, not run here.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutCrush31}=require('./crush31.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const h=loadHost(file),src=h.sources;

check('crush30 marks cells under falling heavy wreckage with a bit no mask can see',()=>{
 const s=src.crush30;assert(s.includes('if(w.p.w<.5||w.extent.w<6.0||w.misc.x>=.7){return;}'),'active, heavy, not settled');assert(s.includes('let falling=w.v.y< -1.5||length(w.v.xyz)>4.0;if(!falling||w.p.y-w.extent.y>1.2){return;}'));
 assert(s.includes('atomicOr(&O[DYNAMIC_OFFSET+u32(x+DYNAMIC_GRID*z)],0x10000000u);'));
 // blocked() masks cover layers 0-11 and the door copy 16-27; bit 28 is invisible to collision, sight and nav.
 const maxMask=((1<<12)-1)|(((1<<12)-1)<<16);assert.equal(maxMask&0x10000000,0);
 assert(h.script.includes("pass(enc,'dynamic',bindings.dynamic,Math.ceil(world.propCount/64));pass(enc,'crush30',bindings.crush30,4);"),'runs after the per-frame dynamic rebuild, before zombies');
 assert(h.script.includes('offset:F8.pieces*4,size:WRECK_MAX8*F8.stride*4')||h.script.includes('offset:F8.pieces*4-CRUSH_LEAD30,size:CRUSH_LEAD30+WRECK_MAX8*F8.stride*4'),'binds exactly the wreck array (from a 256-aligned offset since align38)');
});
check('infected in a marked cell take the slab crush (200) and count as crushed',()=>{
 assert(src.zombies.includes('if((atomicLoad(&O[DYNAMIC_OFFSET+dynCell(z.p.xz)])&0x10000000u)!=0u){damage+=200.0;atomicAdd(&C[34],1u);}'));
});
check('breakage noise: world pass accumulates, mission turns 10+ voxels into a 10-38 m noise at the centroid (open-town only)',()=>{
 assert(src.world.includes('atomicAdd(&C[37],u32(b.p.x+96.0));atomicAdd(&C[40],u32(b.p.z+96.0));atomicAdd(&C[45],1u);'));
 const m=src.mission5;assert(m.includes('let broke30=atomicExchange(&C[45],0u);let sumX30=atomicExchange(&C[37],0u);let sumZ30=atomicExchange(&C[40],0u);'));
 assert(m.indexOf('let broke30=')<m.indexOf('if(u.run.x<=5.0){chapterMission13(dt);return;}'),'counters reset every frame in every mode');
 assert(m.includes('if(u.run.x>5.0&&u.run.y<.5&&broke30>=10u)'));
 const loud=n=>Math.min(38,Math.max(10,10+n*.12));assert.equal(loud(10),11.2);assert.equal(loud(400),38);
 const at=(n,sx,sz)=>[sx/n-96+.5,sz/n-96+.5];assert.deepEqual(at(2,2*(96+10),2*(96-4)),[10.5,-3.5]);
});
check('barrel explosions are counted cumulatively for CHAIN',()=>{assert(src.props.includes('if(!boom){continue;}atomicAdd(&C[52],1u);atomicAdd(&C[46],1u);'));});
check('callouts fire on bursts of 2+ within 1.5 s and the end card counts crushes',()=>{
 const g=loadHost(file,{seed:'5&sandbox'});g.run('reset();glyphBuffer={name:"glyphBuffer"};settings.started=true;playerValues[3]=100;time=10');
 g.run('glyphCount=0;calloutsHUD30(1)');const quiet=g.json('glyphCount');
 g.run('counters[34]=1;time=10.2;calloutsHUD30(1);counters[34]=4;time=10.6;glyphCount=0;calloutsHUD30(1)');assert.equal(g.json('callout30.crushBurst'),4);assert(g.json('glyphCount')>quiet);
 g.run('time=13;glyphCount=0;calloutsHUD30(1)');assert.equal(g.json('glyphCount'),0,'fades after 1.6 s');
 g.run('counters[34]=5;time=20;calloutsHUD30(1)');assert.equal(g.json('callout30.crushBurst'),1,'a lone crush starts a new burst');
 g.run('counters[46]=2;time=20.1;glyphCount=0;calloutsHUD30(1)');assert.equal(g.json('callout30.chainBurst'),2);
 g.run('playerValues[67]=1;glyphCount=0;hud()');assert(g.json('glyphCount')>30);assert(g.script.includes("' crushed  /  '"));
});
check('exact inverse restores the immutable pre-crush runtime',()=>{assert.equal(sha(withoutCrush31(fs.readFileSync(file,'utf8'))),delta.parentSha256);});
const report={method:'Source fragments and exact host functions; no WGSL execution here.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
