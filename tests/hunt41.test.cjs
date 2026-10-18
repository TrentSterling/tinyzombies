'use strict';
// Behaviour pass 8: waiting neighbors seed the heard lane (80 = 8 m behind real noises); infected after a neighbor follow that lane.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutHunt41}=require('./hunt41.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8'),src=loadHost(file).sources;
check('waiting (and panicking) neighbors seed the heard lane at 80; followers, saved and lost ones do not',()=>{
 assert(src.navInit.includes('for(var k=0u;k<12u;k++){let nb=S.civ34[k];if(nb.z>.5&&nb.z<1.5&&navcell(nb.xy)==i){heard=min(heard,80u);}}'));
 const seeds=st=>st>.5&&st<1.5;assert.deepEqual([1,1.25,2,3,4,0].map(seeds),[true,true,false,false,false,false]);
});
check('infected after a neighbor (victim 5) path on the heard lane, falling back to the squad lane when it has no route',()=>{
 assert(src.zombies.includes('var dir=flowDirection(z.p.xz,direct,z.v.xy,i,select(NAV_OFFSET,HEARD_OFFSET,heard||victim==5u));'));
 assert(src.zombies.includes('if((heard||victim==5u)&&all(dir==vec2f(0))&&targetDistance>1.2){dir=flowDirection(z.p.xz,direct,z.v.xy,i,NAV_OFFSET);}'));
});
check('exact inverse restores the immutable pre-hunt runtime',()=>{assert.equal(sha(withoutHunt41(html)),delta.parentSha256);});
const report={method:'Source fragments; GPU runs in the PR notes (SwiftShader).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
