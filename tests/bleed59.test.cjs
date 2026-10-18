'use strict';
// Bites on the player spurt blood on Maple Street: the props pass reads this frame's hit from S.pace7.w (written by begin()).
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha}=require('./deadends-cpu-host.cjs'),{delta,withoutBleed59}=require('./bleed59.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('begin keeps the hit in pace7.w below 256',()=>{assert(html.includes('S.pace7.w=f32(hit)+min(1000.0,f32(atomicLoad(&C[53])))*256.0;'));assert(html.includes('fn infectedDamage13(kind:f32)->u32 {return array<u32,7>(7u,8u,25u,8u,7u,6u,25u)'),'hits stay under 256');});
check('props pass spurts blood scaled by the hit, Maple only',()=>{const a=html.indexOf('{let bite=u32(S.pace7.w)%256u;if(bite>0u&&S.pos.w>0.0){event(');const props=html.indexOf('const propsShader=');
 assert(a>html.indexOf('if(u.run.x<=5.0&&u.run.y<.5){sourceProps15();return;}',props));assert(html.slice(a,a+260).includes(',7u,12u+bite*2u,'));
 const order=html.indexOf("pass(enc,'begin'"),pp=html.indexOf("pass(enc,'props'"),prep=html.indexOf("pass(enc,'prepare'");assert(order<pp&&pp<prep,'begin, then props, then prepare');});
check('exact inverse restores the immutable pre-bleed runtime',()=>{assert.equal(sha(withoutBleed59(html)),delta.parentSha256);});
const report={method:'Source fragments and pass order; bites on the player rendered on SwiftShader (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
