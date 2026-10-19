'use strict';
// Behaviour pass 6: loud noises stay in the ring longer, and infected search where they heard something instead of homing on the player.
// Source fragments and a JS mirror of the rules; GPU runs are in the PR notes (SwiftShader).
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutSearch39}=require('./search39.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8'),src=loadHost(file).sources;
check('ring memory scales with loudness and never shortens a noise',()=>{
 const m=src.mission5;assert(m.includes('let keep=max(n.z,2.0+n.w*.25);'));assert(m.includes('S.noiseRing34[weakest]=vec4f(n.xy,keep,n.w);'));assert(m.includes('vec4f(n.xy,max(r.z,keep),max(r.w,n.w))'));
 const keep=(t,r)=>Math.max(t,2+r*.25);assert.equal(keep(2,9),4.25);assert.equal(keep(3,38),11.5);assert.equal(keep(3,30),9.5);assert.equal(keep(9,9),9);
});
check('search memory is sandbox-only, set while hearing, cleared when awareness runs out',()=>{
 const z=src.zombies;assert(z.includes('if(u.run.x>5.0&&u.run.y<.5){\n  if(heard){z.sense13=vec4f(z.sense13.xy,goalPoint.x,goalPoint.y+4096.0);}\n  else if(z.v.w<=0.0){z.sense13.w=0.0;}'));
 assert(z.includes('else if(z.sense13.w>2048.0&&distance>18.0&&victim==0u){let spot=vec2f(z.sense13.z,z.sense13.w-4096.0);if(length(spot-z.p.xz)<10.0){'));
});
check('spawn and placement values never read as a search spot (|z| <= 96 m, so only the +4096 offset is above 2048)',()=>{
 assert(html.includes('vec4f(S.pos.xz,24,1)'),'horde spawn writes w=1');assert(html.includes('vec4f(0,0,0,-1),vec4f(p,0,0)'),'placed infected write w=0');
 for(const w of [1,0,24])assert(!(w>2048));for(const zc of [-96,0,96])assert(zc+4096>2048&&zc+4096-4096===zc);
});
check('a searcher is slow, steers straight at its circling point, and its own goal never refreshes awareness',()=>{
 const z=src.zombies;assert(z.includes('if(sight&&!searching&&targetDistance<select(480.0/64.0,780.0/64.0,z.v.w>0.0)){z.v.w=10.0;awake=true;}\n if(searching){dir=direct;}'));assert(z.includes('if(searching){speed*=.55;}'));
 assert(z.includes('goalPoint=spot+vec2f(cos(ang),sin(ang))*(1.5+rnd(i*577u)*3.5);searching=true;'));
});
check('spitters keep their target in sense13.xy',()=>{assert(src.zombies.includes('z.sense13=vec4f(z.sense13.xy,goalPoint.x,goalPoint.y+4096.0)'));});
check('exact inverse restores the immutable pre-search runtime',()=>{assert.equal(sha(withoutSearch39(html)),delta.parentSha256);});
const report={method:'Source fragments and arithmetic mirrors; no WGSL execution here.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
