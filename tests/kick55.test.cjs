'use strict';
// Until the first cheese wheel is kicked, wheels within 7 m wear a KICK ME! tag.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutKick55}=require('./kick55.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('tag near a wheel before the first kick, gone after it or when far',()=>{
 const h=loadHost(file,{plain:true});h.run('reset();width=1280;height=720;screenPoint=()=>[640,300];time=1;');const c=h.json('world.cheese48[0]');
 h.run(`counters[48]=0;playerValues[0]=${c.x+2};playerValues[2]=${c.z};glyphCount=0;cheeseHUD48(1)`);const near=h.json('glyphCount');assert(near>5);
 h.run(`playerValues[0]=${c.x+30};glyphCount=0;cheeseHUD48(1)`);assert.equal(h.json('glyphCount'),0);
 h.run(`playerValues[0]=${c.x+2};counters[48]=1;cheeseSeen48=1;cheeseUntil48=0;glyphCount=0;cheeseHUD48(1)`);assert.equal(h.json('glyphCount'),0);
});
check('exact inverse restores the immutable pre-hint runtime',()=>{assert.equal(sha(withoutKick55(html)),delta.parentSha256);});
const report={method:'HUD in the CPU host.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
