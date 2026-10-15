'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const {loadHost,sha}=require('./cpu_game_host.cjs');
const oldFile=process.argv[2],newFile=process.argv[3]||path.join(__dirname,'../index.html'),out=process.argv[4];
if(!oldFile)throw Error('Usage: node tools/check_crawler_pose_alignment.cjs crawl-before-ray-fix.html [candidate.html] [report.json]');
const old=loadHost(oldFile),now=loadHost(newFile);assert.equal(old.sha256,'4a670f4ac344b810f20864923760828a7aa23f2e752741fb5d5e7f45631ede62');
function fn(s,name){const start=s.indexOf('fn '+name+'('),open=s.indexOf('{',start);assert(start>=0);let n=1,i=open+1;for(;n;i++){if(s[i]==='{')n++;if(s[i]==='}')n--;}return s.slice(start,i)}
const a=fn(old.html,'zombie3'),b=fn(now.html,'zombie3');assert.equal(old.html.replace(a,'RAY'),now.html.replace(b,'RAY'),'Only zombie3 ray geometry changes');
assert(b.includes('let crawler=z.extraData.z==4.0;'));assert(b.includes('select(zScale(z.extraData.z),vec3f(1),crawler)'));
assert(b.includes('if(crawler){local=vec3f(local.x,.32-local.z,local.y-.50);half=half.xzy;}'));
const part=fn(now.html,'part');assert(part.includes('posed=vec3f(posed.x,.32-modelProne*posed.z,modelProne*(posed.y-.50));extent=extent.xzy;'));
const boxes=[...now.run('COMMON').matchAll(/ArtBox6\(vec4f\(([^)]+)\),vec4f\(([^)]+)\)\)/g)].map(m=>({p:m[1].split(',').map(Number),h:m[2].split(',').map(Number)})).slice(182,224);assert.equal(boxes.length,42);
const rotate=(v,f)=>f===1?[v[2],v[1],-v[0]]:f===2?[-v[0],v[1],-v[2]]:f===3?[-v[2],v[1],v[0]]:v;
let cases=0,minFloor=Infinity;
// Conservative full vertex containment across the unchanged authored motion ranges.
for(const box of boxes)for(let face=0;face<4;face++)for(let k=0;k<24;k++)for(const moving of [0,.5,1])for(const hit of [0,.5,1]){
 const phase=k*Math.PI/12,stride=Math.sin(phase)*.10*moving,bob=(.5-.5*Math.cos(phase*2))*.022*moving;let motion=[0,bob,-hit*.045];
 if(box.h[3]===1)motion=motion.map((v,i)=>v+[Math.sin(phase)*.009*moving,.009*Math.sin(phase*2)*moving,-.012*moving][i]);
 if(box.h[3]===2||box.h[3]===3){motion[1]+=Math.abs(stride)*.25;motion[2]+=(box.h[3]===2?-1:1)*stride*.55;}
 if(box.h[3]===4)motion=[0,Math.max(0,Math.sin(phase))*.07*moving,-stride];
 if(box.h[3]===5)motion=[0,Math.max(0,-Math.sin(phase))*.07*moving,stride];
 const local=box.p.slice(0,3).map((v,i)=>v+motion[i]),p=rotate([local[0],.32-local[2],local[1]-.50],face),h=rotate([box.h[0],box.h[2],box.h[1]],face).map(Math.abs);
 for(let i=0;i<3;i++)assert(Math.abs(p[i]-[0,.32,0][i])+h[i]<=[.65,.40,.65][i]+1e-9,'Broad phase contains all crawler vertices');
 minFloor=Math.min(minFloor,p[1]-h[1]);cases++;
}
assert(minFloor>=0,'Rigid crawler pose stays above ground');
const report={method:'CPU source isolation and conservative crawler ray broad-phase containment across authored motion ranges. Compiled GPU ray probes are recorded separately.',beforeSha256:old.sha256,candidateSha256:now.sha256,changedModules:Object.keys(old.sources).filter(k=>old.sources[k]!==now.sources[k]),onlyZombieRayFunctionChanged:true,renderShaderExact:old.sources.boxes===now.sources.boxes,movementCollisionExact:old.run('SOLID')===now.run('SOLID'),artAndDamageHelpersExact:old.run('COMMON')===now.run('COMMON'),cases,minFloor,passed:true,completedUtc:new Date().toISOString()};if(out)fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
