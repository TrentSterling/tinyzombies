'use strict';
// Hotfix: every storage-buffer binding with an offset must start on a 256-byte boundary (WebGPU minStorageBufferOffsetAlignment).
// The crush pass bound the wreck pieces at byte 1,097,792 (64 past a boundary); every browser rejected the bind group and the game stopped on frame 1.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutAlign38}=require('./align38.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8'),h=loadHost(file);
check('every buffer binding offset in the runtime evaluates to a multiple of 256',()=>{
 const exprs=[...html.matchAll(/resource:\{buffer:\w+,offset:([^,}]+)/g)].map(m=>m[1]);assert(exprs.length>=1,'found offset bindings');
 const vals=exprs.map(e=>[e,h.json(`(${e})`)]);for(const [e,v] of vals){assert(Number.isInteger(v)&&v%256===0,e+' = '+v);}return {offsets:Object.fromEntries(vals)};
});
check('the crush view skips exactly the lead, so element 0 is still the first wreck piece',()=>{
 const lead=h.json('CRUSH_LEAD30'),pieces=h.json('F8.pieces*4'),stride=h.json('F8.stride*4');
 assert.equal((pieces-lead)%256,0);assert.equal(lead%16,0,'lead is whole vec4s');assert.equal(stride,336,'Wreck8 is 5 vec4 + 64 u32');
 const src=h.sources.crush30;assert(src.includes(`struct CrushView30 { lead:array<vec4f,${lead/16}>, w:array<Wreck8,256> }`));assert(src.includes('let w=Wr.w[i];'));
 assert(html.includes('{binding:1,resource:{buffer:Fracture,offset:F8.pieces*4-CRUSH_LEAD30,size:CRUSH_LEAD30+WRECK_MAX8*F8.stride*4}}'),'same end byte as before');
 return {lead,boundOffset:pieces-lead};
});
check('exact inverse restores the immutable pre-alignment-fix runtime',()=>{assert.equal(sha(withoutAlign38(html)),delta.parentSha256);});
const report={method:'Offsets evaluated in the CPU host; the real main() was also run on SwiftShader WebGPU (see PR).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
