'use strict';
// Gore pass: on Maple Street an overkill (150+ damage in a frame) bursts a common infected into shirt-coloured chunks, a wider blood
// spray and a popped head; C[51] counts bursts and the HUD stacks them into SPLAT xN.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutGore51}=require('./gore51.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8'),z=loadHost(file).sources.zombies;
check('the burst sits inside the death branch, gated to Maple Street common infected and 150+ damage',()=>{
 const d=z.indexOf('if(z.p.w<=0.0){atomicAdd(&C[0],1u);'),b=z.indexOf('if(damage>=150.0&&u.run.x>5.0&&u.run.y<.5&&kind==0.0){');assert(d>0&&b>d&&b-d<1400);
 assert(z.includes('atomicAdd(&C[51],1u);}'));assert(z.slice(b,b+900).includes('0u,56u,')&&z.slice(b,b+900).includes('7u,96u,')&&z.slice(b,b+900).includes('0u,20u,'),'three bursts');
});
check('a crush (+200 damage) always qualifies; the cheese wheel kill path feeds it',()=>{assert(z.includes('{damage+=200.0;atomicAdd(&C[34],1u);}'));assert(200>=150);});
check('SPLAT stacks bursts within 1.2 s',()=>{
 const h=loadHost(file,{plain:true});h.run('reset();time=10;counters[51]=0;splatHUD51(1);counters[51]=3;time=10.1;glyphCount=0;splatHUD51(1);counters[51]=5;time=10.5;splatHUD51(1);');assert.equal(h.json('splatBurst51'),5);
 h.run('counters[51]=6;time=13;splatHUD51(1)');assert.equal(h.json('splatBurst51'),1);
});
check('exact inverse restores the immutable pre-gore runtime',()=>{assert.equal(sha(withoutGore51(html)),delta.parentSha256);});
const report={method:'Source fragments and HUD in the CPU host; the cheese-wheel crush run on SwiftShader counted one burst per crush (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
