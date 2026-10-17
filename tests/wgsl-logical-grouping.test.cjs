'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {loadHost,sha}=require('./deadends-cpu-host.cjs');
const {before,after,withoutLogicalGrouping,mixedShortCircuit}=require('./wgsl-logical-grouping.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html'),h=loadHost(file),checks=[];
function test(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
for(const expression of ['a&&b||c','a||b&&c','(a&&b||c)','f(a&&b||c)','a[b&&c||d]'])test('guard rejects ungrouped operators: '+expression,()=>assert(mixedShortCircuit('let x='+expression+';').length>0));
for(const expression of ['(a&&b)||c','a&&(b||c)','(a||b)&&(c||d)','f(a&&b,c||d)','a[b&&c]||d','a&&b;let y=c||d','a==b&&c!=d','a&&b/* || ignored */','a&&b// || ignored\n'])test('guard accepts independent/grouped expressions: '+expression,()=>assert.deepEqual(mixedShortCircuit('let x='+expression+';'),[]));
test('reported prior expression fails even though JavaScript accepts its precedence',()=>{assert(mixedShortCircuit(before).length>0);new Function('u','S','a','distance','f32','id',before+'return busy;');});
test('exact two-character grouping is present once and legacy expression is absent',()=>{assert.equal(h.html.split(after).length,2);assert.equal(h.html.includes(before),false);assert.equal(after.length-before.length,2);assert.equal(after.replace('let busy=(','let busy=').replace('S.order13.x==5.0)||','S.order13.x==5.0||'),before);});
const names=[...h.script.matchAll(/const ([A-Za-z_][A-Za-z_0-9]*Shader)\s*=/g)].map(m=>m[1]);
test('all evaluated WGSL strings have grouped mixed short-circuit operators',()=>{assert.equal(names.length,42);const failures=names.flatMap(name=>mixedShortCircuit(h.run(name)).map(error=>({shader:name,...error})));assert.deepEqual(failures,[]);return{shadersChecked:names.length};});
test('one exact inverse recovers the unchanged main or candidate runtime',()=>{const expected=h.html.includes('fn botReviveFirst23(')?'bae0595bd9e851593b0800df7fb2d19c01afaa65ade725750c2d5a713c17dde2':'e035eca088efe289cad54707d8eec9ef758444b6eeba6ff063663f96a104450f';assert.equal(sha(withoutLogicalGrouping(require('./mercer-restoration-scope.cjs').withoutMercerRestoration24(h.html))),expected);return{parentSha256:expected};});
test('all command, activity, fuel and strict radius combinations preserve intended busy semantics',()=>{
 const fixed=new Function('u','S','a','distance','f32','id',after+'return busy;');
 const prior=new Function('u','S','a','distance','f32','id',before+'return busy;');
 let combinations=0;
 for(const chapter of [1,2,3,4,5,6])for(const pouring of [0,1])for(const goal of [0,7])for(const orderDistance of [0,100/64,2])for(const fuelDistance of [0,115/64,2])for(const ordered of [0,1])for(const owner of [0,1])for(const kind of [4,5])for(const action of [0,4,5,6,7])for(const fuel of [0,1]){
  const u={run:{x:chapter},goals:{xy:{distance:fuelDistance}}},S={botPour15:[pouring],orders:{x:ordered,yz:{distance:orderDistance}},order13:{z:owner,x:kind},botFuel15:[fuel]},a={ai:{x:goal,y:action},p:{xz:{}}},distance=(_,target)=>target.distance;
  const chapterOperation=(chapter===3&&pouring>0)||([4,5].includes(chapter)&&goal===7&&orderDistance<100/64);
  const ownedOperation=chapterOperation&&ordered>.5&&owner===0&&kind===5;
  const activeInteraction=[4,5,6,7].includes(action);
  const fuelDelivery=fuel>.5&&goal===7&&fuelDistance<115/64;
  const expected=ownedOperation||activeInteraction||fuelDelivery;
  assert.equal(fixed(u,S,a,distance,Number,0),expected);assert.equal(prior(u,S,a,distance,Number,0),expected);combinations++;
 }
 return{combinations};
});
const report={method:'WGSL mixed-short-circuit lexical grouping guard over all evaluated shader strings, exact two-character inverse, and exhaustive CPU truth table for this expression. Not WGSL compilation, pipeline creation, GPU execution or browser startup.',grammarSource:'https://www.w3.org/TR/WGSL/#operator-precedence-associativity',candidateSha256:h.sha256,passed:checks.every(c=>c.passed),checks};console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
