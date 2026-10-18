'use strict';
// Style pass 1: Maple Street in daylight (ground palette, house floors, warm sun, light haze) and ZAMN-dressed common infected.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutSunny43}=require('./sunny43.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('floors42 fills the state buffer exactly from float 3980 to 4096',()=>{
 assert(html.includes('noiseSeen34:vec4f, floors42:array<vec4f,29> };'));assert.equal(3980+29*4,4096);assert(html.includes("S=storage('GPU player and weapons',16384)"));
});
check('house rectangles pack and decode exactly (JS mirror of floorAt42)',()=>{
 const h=loadHost(file,{plain:true});h.run('reset()');const st=h.json('(()=>{const st=new Float32Array(4096);const n=packFloors42(st,world.buildings);return {n,b:world.buildings.slice(0,58),f:Array.from(st.subarray(3980))};})()');
 assert(st.n>=8,'Maple Street has houses: '+st.n);
 const dec=[];for(let k=0;k<29;k++){const f=st.f.slice(k*4,k*4+4);if(f[0]===0)break;for(const h2 of [0,1]){const a=f[h2*2],b=f[h2*2+1];if(a===0)continue;const x0=Math.floor(a/32)-96,z0=Math.floor(b/32)-96;dec.push([x0,z0,a-(x0+96)*32,b-(z0+96)*32]);}}
 assert.equal(dec.length,st.n);dec.forEach((r,i)=>assert.deepEqual(r,[st.b[i].x,st.b[i].z,st.b[i].w,st.b[i].d].map(Math.round)));return {houses:st.n};
});
check('floors are written only on Maple Street, at reset',()=>{assert(html.includes('applyCarry13(st);if(SANDBOX25&&!settings.lab)packFloors42(st,world.buildings);device.queue.writeBuffer(S,0,st);')||html.includes('applyCarry13(st);if(SANDBOX25&&!settings.lab)packFloors42(st,world.buildings,world.pools45||[]);device.queue.writeBuffer(S,0,st);'),'floors (and pools since yard45) written at reset');});
check('daylight ground, sun and haze apply only on Maple Street; wall tops keep their own colour',()=>{
 const r=loadHost(file).sources.render;assert(r.includes('if(u.run.x>5.0&&u.run.y<.5){color=suburb42(p,edge,noise,o.world.y,o.color.xyz);}'));assert(r.includes('if(top>.05){return own;}'));
 assert(r.includes('let sunny=u.run.x>5.0&&u.run.y<.5;'));assert(r.includes('select(vec3f(.075,.14,.18),vec3f(.36,.46,.34),sunny)'));
});
check('only Maple Street common infected change clothes',()=>{
 const s=Object.values(loadHost(file).sources).find(x=>x.includes('fn artColor6('));assert(s.includes('let maple=u.run.x>5.0&&u.run.y<.5&&kind==0.0;'));assert(s.includes('if(maple&&index==4u){return vec3f(.17,.24,.44);}'));
});
check('exact inverse restores the immutable pre-daylight runtime',()=>{assert.equal(sha(withoutSunny43(html)),delta.parentSha256);});
const report={method:'CPU host and source fragments; frames were rendered on SwiftShader for the PR.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
