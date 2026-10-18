'use strict';
// Soda cans: on Maple Street the pipe bomb is a shaken soda can (same lure and blast) with its own model, foam and labels.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutSoda53}=require('./soda53.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('labels say soda on Maple Street and pipe bomb in the chapters',()=>{
 assert.equal(loadHost(file,{plain:true}).json('gearLabel14(3)'),'SODA CAN');assert.equal(loadHost(file).json('gearLabel14(3)'),'PIPE BOMB');
 assert(html.includes("SANDBOX25?'SODA':'PIPE'"));assert(html.includes("9:'Soda cans earned. Shake well before throwing.'"));assert(html.includes("'+2 SODA CANS'"));
});
check('the can model and foam are Maple-only; the pipe model is kept for the chapters; behaviour untouched',()=>{
 const src=Object.values(loadHost(file).sources).find(s=>s.includes('for(var bi=0u;bi<16u;bi++){let pipe=S.pipes12[bi];'));const i=src.indexOf('if(u.run.x>5.0&&u.run.y<.5){let fuse=1.0-pipe.z/3.15;');
 assert(i>0&&src.indexOf('else{box(p,vec3f(.42,.13,.13)',i)>i);assert(html.includes('if(pipe.z<=.00001&&S.aux.w<.5){S.blast=vec4f(pipe.xy,.45,250.0/64.0);'),'same blast');
});
check('exact inverse restores the immutable pre-soda runtime',()=>{assert.equal(sha(withoutSoda53(html)),delta.parentSha256);});
const report={method:'Source fragments and labels in the CPU host; the can was rendered on SwiftShader for the PR.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
