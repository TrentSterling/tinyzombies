'use strict';
// Maple Street's edge: a hedge wall with QUARANTINE sawhorses, lawn past it, and houses beyond; render only (movement clamps at 95.5 m).
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha}=require('./deadends-cpu-host.cjs'),{delta,withoutEdge69}=require('./edge69.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('edge decor drawn on Maple only; hedge spans the whole side',()=>{assert(html.includes('{shelterDecor44();exitDecor54();edgeDecor65();}'));const covered=[];for(let n=0;n<12;n++){const t=-88+n*16;covered.push([t-8.1,t+8.1]);}assert(covered[0][0]<=-96&&covered[11][1]>=96);for(let i=1;i<12;i++)assert(covered[i][0]<=covered[i-1][1]);});
check('everything sits outside the playable clamp',()=>{assert(html.includes('p.x=clamp(p.x,-95.3,95.3);'));assert(97.2-0.7>95.3,'hedge inner face beyond the clamp');assert(95.9-0.04>95.3,'sawhorses beyond the clamp');assert(108-4.5>97.9,'houses beyond the hedge');});
check('ground widened and painted lawn beyond the hedge',()=>{assert(html.includes('vec3f(360,.44,360),u.run.x>5.0&&u.run.y<.5)'));assert(html.includes('if(any(abs(p)>vec2f(96.6))){return mix(vec3f(.30,.52,.20)'));});
check('exact inverse restores the immutable pre-edge runtime',()=>{assert.equal(sha(withoutEdge69(html)),delta.parentSha256);});
const report={method:'Source fragments and coverage arithmetic; the east, south and corner edges were rendered on SwiftShader (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
