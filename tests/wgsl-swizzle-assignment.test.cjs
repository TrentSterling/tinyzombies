'use strict';
const path=require('node:path'),assert=require('node:assert/strict');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{changes,withoutSwizzleAssignmentFix,multiComponentAssignments}=require('./wgsl-swizzle-assignment.cjs');
const h=loadHost(process.argv[2]||path.join(__dirname,'../index.html')),checks=[];
function test(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const names=[...h.script.matchAll(/const ([A-Za-z_][A-Za-z_0-9]*Shader)\s*=/g)].map(m=>m[1]);
test('all 41 composed WGSL modules have no multi-component lvalue assignments',()=>{assert.equal(names.length,41);assert.deepEqual(names.flatMap(name=>multiComponentAssignments(h.run(name)).map(hit=>({name,...hit}))),[]);return{shaders:41};});
test('exact six-site inverse recovers the previous runtime without changing JS',()=>{const old=withoutSwizzleAssignmentFix(h.html);assert.equal(sha(old),'85a239175a397c542e388fd876c949bfc38328ad351a54ce364414edaacf6449');assert.equal(changes.reduce((n,c)=>n+c[2],0),6);return{sites:6};});
test('negative control catches every previous illegal write',()=>{assert.equal(multiComponentAssignments(withoutSwizzleAssignmentFix(h.html)).length,6);});
test('guard detects compound/color/parenthesized writes but permits reads and single lanes',()=>{for(const s of ['v.xy=x;','v . rgba += x;','(v.yz) = x;','v.zw<<=x;'])assert.equal(multiComponentAssignments(s).length,1);for(const s of ['v.x=x;','x=v.xy;','v.xy==x;','// v.xy=x;\nx=v.xy;'])assert.equal(multiComponentAssignments(s).length,0);});
function vec(...xs){const a=xs.flat().map(Math.fround);for(const sw of ['xy','xz','zw'])Object.defineProperty(a,sw,{get:()=>[...sw].map(k=>a['xyzw'.indexOf(k)]),set(v){[...sw].forEach((k,i)=>{a['xyzw'.indexOf(k)]=Math.fround(v[i]);});}});return a;}
function fixture(i){return{S:{objectivePoint:vec(i,-i,i+.25,-i-.5)},z:{special13:vec(i,2*i,i+.75,-i-1),sense13:vec(i,-i,i+1.25,-i-1.5)},u:{goals:vec(i+2,-i-3,i+4,-i-5),run:{x:i%5+1}},q:{p:vec(i+6,123,-i-7,456)},gateDone:!!(i%2),direct:vec(i+.125,-i-.25),goalPoint:vec(i+1,i-1),jitter:vec(.25,-.5),chapterDoor16:c=>vec(c*2,-c*3),select:(a,b,t)=>t?b:a,vec4f:vec,add2:(a,b)=>vec(a[0]+b[0],a[1]+b[1])};}
for(const [before,after,count]of changes)test('preserve xy result and untouched zw: '+before,()=>{
 const execute=(statement,c)=>new Function(...Object.keys(c),statement.replace('goalPoint+jitter','add2(goalPoint,jitter)'))(...Object.values(c));
 for(let i=-32;i<32;i++){const a=fixture(i),b=fixture(i);execute(before,a);execute(after,b);for(const [x,y]of [[a.S.objectivePoint,b.S.objectivePoint],[a.z.special13,b.z.special13],[a.z.sense13,b.z.sense13]])assert.deepEqual([...x],[...y]);}
 return{fixtures:64,sourceSites:count};
});
const report={runtimeSha256:h.sha256,method:'Exact-source lexical guard, immutable full-runtime inverse and CPU lane-preservation fixtures. Real Naga parse/validation is recorded separately; this suite is not GPU execution.',passed:checks.every(c=>c.passed),checks};console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
