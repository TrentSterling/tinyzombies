'use strict';
// Behaviour pass 7: waiting neighbors back away from awake infected within 4 m, tethered 3 m to home; the HUD tag panics with them.
// Source fragments and JS mirrors; GPU runs are in the PR notes (SwiftShader).
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutPanic40}=require('./panic40.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8'),src=loadHost(file).sources,civ=Object.values(src).find(s=>s.includes('fn civStep30('));
check('the infected scan covers 4 m (9x9 cells) and builds a flee vector; bites and dodging keep their own ranges',()=>{
 assert(civ.includes('for(var dz=-4;dz<=4;dz++){for(var dx=-4;dx<=4;dx++){'));assert(civ.includes('if(ed<4.0&&ed>.001){flee+=(me-e.p.xz)/ed*(4.0-ed)/4.0;}'));
 assert(civ.includes('if(ed<footprint(e.extraData.z)+.42){bites++;}'));assert(civ.includes('if(ed<2.2&&ed>.001){away+=(me-e.p.xz)/ed*(2.2-ed)/2.2;}'));
});
check('only waiting neighbors panic, at 2 m/s, and never step further than 3 m from home',()=>{
 assert(civ.includes('let panic=c.data.y<1.5&&length(flee)>.001;if(panic){stride2=safe2(flee)*2.0;let out=me-c.more.xy;if(length(out)>3.0){let o=safe2(out);stride2-=o*max(0.0,dot(stride2,o));}}'));
 assert(html.includes('props.set([x,0,z,30,60,1,0,outfit,0,0,0,1,x,z,0,0],slot*16)')||html.includes('props.set([x,0,z,30,60,1,0,outfit,0,0,0,1,x,z,type,0],slot*16)'),'home stored in more.xy at spawn');
 const n=v=>{const l=Math.hypot(...v);return l?v.map(x=>x/l):[0,0];};
 for(const [me,flee] of [[[3.2,0],[1,0]],[[3.2,0],[1,1]],[[0,-3.5],[.2,-1]],[[2.5,2.5],[1,0]]]){let s=n(flee).map(v=>v*2);const out=me,o=n(out);if(Math.hypot(...out)>3){const d=Math.max(0,s[0]*o[0]+s[1]*o[1]);s=[s[0]-o[0]*d,s[1]-o[1]*d];}
  if(Math.hypot(...me)>3)assert(s[0]*o[0]+s[1]*o[1]<=1e-9,'no outward step past the tether');}
});
check('the mirror flags panic with +.25, which every existing reader still rounds to "waiting"',()=>{
 assert(civ.includes('SR[976u+k]=vec4f(c.p.x,c.p.z,c.data.y+select(0.0,.25,panic),c.data.x);'));
 assert.equal(Math.round(1.25),1);assert(1.25<1.5&&1.25>.5,'minimap gold / render filters');assert(html.includes('if(Math.round(playerValues[CIV_STATE30+c*4+2])===1)n++;'),'waiting count rounds');
});
check('the HUD shouts HELP!! in red for a panicking neighbor, HELP! in gold otherwise',()=>{
 assert(html.includes("const panic=playerValues[o+2]-1>.1;if(panic){const px=15*k,j=Math.sin(time*47+c*3)*2*k;text('HELP!!',sx-textWidth9('HELP!!',px)/2+j,sy-3*k,px,COL9.red);continue;}text('HELP!',"));
});
check('exact inverse restores the immutable pre-panic runtime',()=>{assert.equal(sha(withoutPanic40(html)),delta.parentSha256);});
const report={method:'Source fragments and arithmetic mirrors; no WGSL execution here.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
