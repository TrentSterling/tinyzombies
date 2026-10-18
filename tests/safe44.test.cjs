'use strict';
// Style pass 2: Maple Street supply caches are armory tables; the start shelter is dressed as a safe room. Render-only.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutSafe44}=require('./safe44.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8'),h=loadHost(file,{plain:true}),src=Object.values(h.sources).find(s=>s.includes('fn shelterDecor44('));
check('caches draw as supply tables on Maple Street only; the chapter crate path is unchanged',()=>{
 assert(src.includes('if(pr.p.w==7.0&&pr.aux.x!=7.0&&u.run.x>5.0&&u.run.y<.5){supplyTable44(p,pr.data.x>0.0);}\n  else if(pr.p.w==7.0&&pr.aux.x!=7.0){\n   let unopened=pr.data.x>0.0;'));
 assert(src.includes('if(unopened){gunFlat44(')&&src.includes('vec3f(.15,1,.85),1,1.4);}'),'loaded table keeps the floating cache marker');
});
check('the shelter decor is drawn once per frame, Maple Street only, at the fixed V9 start',()=>{
 assert(src.includes(' if(i==0u){\n  if(u.run.x>5.0&&u.run.y<.5){shelterDecor44();'));assert.deepEqual(h.json('[makeWorld().start[0],makeWorld().start[1]]'),[-64,52]);
});
check('decor stays inside the shelter interior and clear of the door and the squad spawn spots',()=>{
 // Footprints (x0,x1,z0,z1) mirrored from shelterDecor44 relative to the start.
 const o=[-64,52],fp=[[-3.44,-3.32,-2.25,.25],[-1.95,-.05,-3.2,-2.4],[1.45,2.9,-3.28,-2.72],[-2.55,-.65,2.52,3.28]].map(([a,b,c,d])=>[o[0]+a,o[0]+b,o[1]+c,o[1]+d]);
 for(const [x0,x1,z0,z1] of fp){assert(x0>-67.5&&x1<-60.5&&z0>48.5&&z1<55.5,'inside');assert(!(x1>-61.5&&z1>50.25&&z0<53.75),'clear of the east door');}
 const spawns=[[-64,52],[-65.2,51],[-64.5,53],[-63.8,51]];for(const [x,z] of spawns)for(const [x0,x1,z0,z1] of fp)assert(!(x>x0-.4&&x<x1+.4&&z>z0-.4&&z<z1+.4),'spawn '+x+','+z);
});
check('exact inverse restores the immutable pre-safe-room runtime',()=>{assert.equal(sha(withoutSafe44(html)),delta.parentSha256);});
const report={method:'Source fragments and footprint arithmetic; frames were rendered on SwiftShader for the PR.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
