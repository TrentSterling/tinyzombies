'use strict';
// Closer scare: the 15 s pack (held infected released before 20 s) spawns 22-30 m out (20 m minimum) instead of 34-52 m; still off screen.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha}=require('./deadends-cpu-host.cjs'),{delta,withoutCloser87}=require('./closer87.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('early pack range and minimum distance; everything else unchanged',()=>{for(const s of ['let early=z.special13.w==-2.0&&S.aux.x<20.0;','let range=select(34.0+rnd(sd+7u)*18.0,22.0+rnd(sd+7u)*8.0,early);','length(p-S.pos.xz)>select(25.0,20.0,early)&&length(p-S.buddy.xz)>12.0&&(abs(clip.x)>1.2||abs(clip.y)>1.2)'])assert(html.includes(s),s);
 const r=(early,x)=>early?22+x*8:34+x*18;assert.equal(r(true,0),22);assert.equal(r(true,1),30);assert.equal(r(false,0),34);assert.equal(r(false,1),52);});
check('exact inverse restores the immutable pre-closer runtime',()=>{assert.equal(sha(withoutCloser87(html)),delta.parentSha256);});
const report={method:'Source checks; Tint validates the zombie pass; robot runs motivated the range (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
