'use strict';
// Kill combo: quick kills chain into a multiplier that pays bonus score and announces new tiers; a pause breaks the chain.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha,loadHost}=require('./deadends-cpu-host.cjs'),{delta,withoutCombo82}=require('./combo82.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
const host=()=>{const h=loadHost(file,{plain:true});h.run('reset();settings.started=true;window.__said=[];announce65=s=>__said.push(s);time=10;counters[0]=0;comboTick69()');return h;};
check('ten quick kills reach x3 and pay the bonus',()=>{const h=host();h.run('for(let i=1;i<=10;i++){time+=.5;counters[0]=i;comboTick69()}');const [c,m,b,said]=h.json('[combo69.chain,combo69.mult,combo69.bonus,__said]');assert.equal(c,10);assert.equal(m,3);assert.equal(b,10*(0+0+0+0+1+1+1+1+1+2));assert.deepEqual(said,['Neighborly!','Block party!']);});
check('a 3 s pause breaks the chain and keeps banked bonus',()=>{const h=host();h.run('for(let i=1;i<=6;i++){time+=.3;counters[0]=i;comboTick69()}time+=3;comboTick69();');const [c,m,b]=h.json('[combo69.chain,combo69.mult,combo69.bonus]');assert.equal(c,0);assert.equal(m,1);assert.equal(b,20);});
check('a new run (kills drop) resets the combo',()=>{const h=host();h.run('for(let i=1;i<=6;i++){time+=.3;counters[0]=i;comboTick69()}counters[0]=0;comboTick69()');assert.equal(h.json('combo69.bonus'),0);});
check('exact inverse restores the immutable pre-combo runtime',()=>{assert.equal(sha(withoutCombo82(html)),delta.parentSha256);});
const report={method:'CPU host driving the kill counter.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
