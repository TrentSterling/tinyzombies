'use strict';
// Execute the production host binding builder against a strict CPU layout fixture.
// This is not WebGPU reflection, shader compilation or GPU startup acceptance.
const path=require('node:path'),assert=require('node:assert/strict');
const {loadHost,sha}=require('./deadends-cpu-host.cjs');
const h=loadHost(process.argv[2]||path.join(__dirname,'../index.html')),checks=[];
const before='bindings.collapse=bg(compute.collapse,[[1,Groups],[2,C]]);';
const after='bindings.collapse=bg(compute.collapse,[[0,U],[1,Groups],[2,C]]);';
function test(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const source=h.run('collapseShader'),builder=h.run('buildComputeBindings.toString()');
test('collapse entry point directly uses the uniform and both storage bindings',()=>{
 assert.match(source,/@group\(0\)\s*@binding\(0\)\s*var<uniform>\s+u:/);
 assert.match(source,/@binding\(1\)\s*var<storage,read_write>\s+G:/);
 assert.match(source,/@binding\(2\)\s*var<storage,read_write>\s+C:/);
 const entry=source.slice(source.indexOf('fn evaluate('));for(const re of [/u\.run\.x/,/u\.run\.y/,/G\[/,/C\[/])assert.match(entry,re);
 assert.equal(h.run('uniformData.byteLength'),400);
});
test('only one host uniform entry differs from the released runtime',()=>{
 assert.equal(h.html.split(after).length,2);assert.equal(h.html.includes(before),false);
 assert.equal(sha(require('./wgsl-swizzle-assignment.cjs').withoutSwizzleAssignmentFix(h.html).replace(after,before)),'1082ae0d4f1ece7dfcf7fd9bc59f480ad745dfcab84a4c1e34702fa93a14d0b4');
});
const pipelineNames=[...new Set([...builder.matchAll(/compute\.([A-Za-z0-9_]+)/g)].map(m=>m[1]))];
const resourceNames=[...new Set([...builder.matchAll(/\[\d+,([A-Za-z0-9_]+)\]/g)].map(m=>m[1]))].filter(n=>!['a','b','z'].includes(n));
for(const n of resourceNames)h.run(`${n}={name:${JSON.stringify(n)},size:${n==='U'?400:16}};`);
for(const n of pipelineNames)h.run(`compute[${JSON.stringify(n)}]={getBindGroupLayout:()=>({name:${JSON.stringify(n)}})};`);
h.run(`device.createBindGroup=({layout,entries})=>{
 if(new Set(entries.map(e=>e.binding)).size!==entries.length)throw Error('duplicate binding');
 if(layout.name==='collapse'){
  if(JSON.stringify(entries.map(e=>e.binding))!=='[0,1,2]')throw Error('collapse layout mismatch: expected bindings 0,1,2');
  if(entries[0].resource.buffer.name!=='U'||entries[0].resource.buffer.size!==400||entries[1].resource.buffer.name!=='Groups'||entries[2].resource.buffer.name!=='C')throw Error('collapse resource mismatch');
 }
 return {layout,entries};
};`);
test('actual buildComputeBindings binds U, Groups and C and repeats safely',()=>{
 h.run('buildComputeBindings();buildComputeBindings();');
 assert.deepEqual(h.json('bindings.collapse.entries.map(e=>[e.binding,e.resource.buffer.name])'),[[0,'U'],[1,'Groups'],[2,'C']]);
 return{computePipelinesConstructed:pipelineNames.length};
});
test('negative control reproduces the reported two-versus-three-entry failure',()=>{
 assert(builder.includes(after));h.run('buildComputeBindings='+builder.replace(after,before)+';');
 assert.throws(()=>h.run('buildComputeBindings()'),/collapse layout mismatch: expected bindings 0,1,2/);
 h.run('buildComputeBindings='+builder+';');h.run('buildComputeBindings();');
});
const report={method:'Exact production host builder with a strict CPU fixture for the collapse layout; source-use guard and old-host negative control. Not GPU reflection, compilation or browser startup.',runtimeSha256:h.sha256,passed:checks.every(x=>x.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
