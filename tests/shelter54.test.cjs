'use strict';
// Fallout shelter makeover on Maple Street: radiation sign, hazard stripes, and a FALLOUT SHELTER label within 32 m.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutShelter54}=require('./shelter54.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('the decor is drawn once per frame at u.route.zw, Maple Street only; route.zw carries the exit',()=>{
 assert(html.includes(' if(i==0u){\n  if(u.run.x>5.0&&u.run.y<.5){shelterDecor44();exitDecor54();}'));assert(html.includes('uniformData.set([...world.start,...world.exit],72)'));
 assert(html.includes('route:vec4f'),'route is a uniform field');
});
check('the label shows within 32 m and fades in',()=>{
 const h=loadHost(file,{plain:true});h.run('reset();width=1280;height=720;screenPoint=()=>[640,300];');const e=h.json('world.exit');
 h.run(`playerValues[0]=${e[0]};playerValues[2]=${e[1]+40};glyphCount=0;shelterLabel54(1)`);assert.equal(h.json('glyphCount'),0);
 h.run(`playerValues[2]=${e[1]+10};glyphCount=0;shelterLabel54(1)`);assert(h.json('glyphCount')>10);
});
check('exact inverse restores the immutable pre-shelter runtime',()=>{assert.equal(sha(withoutShelter54(html)),delta.parentSha256);});
const report={method:'Source fragments and HUD in the CPU host; the shelter was rendered on SwiftShader for the PR.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
