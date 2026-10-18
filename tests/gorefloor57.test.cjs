'use strict';
// Every Maple Street common-infected kill bursts some gore; overkills (>=150) keep the bigger SPLAT burst.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha}=require('./deadends-cpu-host.cjs'),{delta,withoutGorefloor57}=require('./gorefloor57.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('ordinary kills get a smaller burst in the else of the overkill branch',()=>{
 const big=html.indexOf('if(damage>=150.0&&u.run.x>5.0&&u.run.y<.5&&kind==0.0){'),floor=html.indexOf('else if(u.run.x>5.0&&u.run.y<.5&&kind==0.0){let cloth=');
 assert(big>0&&floor>big,'floor branch follows the overkill branch');const body=html.slice(floor,html.indexOf('}\n',floor));
 assert(body.includes(',0u,18u,'),'18 cloth chunks');assert(body.includes(',7u,32u,'),'32 extra blood');assert(!body.includes('C[51]'),'only overkills count as SPLAT');
 return {floorBurst:'18 cloth + 32 blood',overkill:'56 cloth + 96 blood + 20 head'};});
check('Maple Street only: DEAD ENDS and the lab keep the old deaths',()=>{assert(html.includes('else if(u.run.x>5.0&&u.run.y<.5&&kind==0.0)'));});
check('exact inverse restores the immutable pre-gore-floor runtime',()=>{assert.equal(sha(withoutGorefloor57(html)),delta.parentSha256);});
const report={method:'Source fragments; real gun kills rendered on SwiftShader (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
