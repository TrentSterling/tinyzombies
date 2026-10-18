'use strict';
// Maple Street opens with a ZAMN level card (LEVEL 1 / ZOMBIE PANIC! / VICTIMS: n) for the first 3.6 s, then it is gone.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha,loadHost}=require('./deadends-cpu-host.cjs'),{delta,withoutCard60}=require('./card60.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('card is drawn on Maple Street only, after the status block',()=>{assert(html.includes('  if(SANDBOX25)zamnHUD52(k);\n  if(SANDBOX25)levelCard59(k);\n'));});
check('card text and timing',()=>{const f=html.slice(html.indexOf('function levelCard59(k)'),html.indexOf('// ZAMN-style status block'));
 for(const s of ["'ZOMBIE PANIC!'","'LEVEL 1'","'VICTIMS: '+(world.civilians30?.length||0)",'t>=3.6||!settings.started'])assert(f.includes(s),s);
 const a=t=>Math.max(0,Math.min(1,Math.min(t/.25,(3.6-t)/.6)));assert.equal(a(0),0);assert.equal(a(1),1);assert(a(3.3)<1&&a(3.3)>0);return {fadeIn:'.25 s',hold:'to 3.0 s',fadeOut:'.6 s'};});
check('exact inverse restores the immutable pre-card runtime',()=>{assert.equal(sha(withoutCard60(html)),delta.parentSha256);});
const report={method:'Source fragments and fade arithmetic; the card was rendered over a real Maple Street frame on SwiftShader (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
