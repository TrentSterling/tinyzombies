'use strict';
// Steering pass 3: breach-aware walkability (body-fit cores, edge lanes, portal aim), body-width sight, heard bot gunfire, reachable spawns.
// Source fragments plus a CPU reference of the walk-word rules; GPU execution evidence is described in the PR, not run here.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutSteer29}=require('./steer29.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const h=loadHost(file),src=h.sources;
// CPU mirror of stepOpen30 / portal30, checked against the shader text below.
const stepOpen=(wc,wn,dx,dz,sA,sB)=>{if(wn&1)return false;if(dx&&dz)return (sA&7)===0&&(sB&7)===0&&(wc&6)===0&&(wn&6)===0;if(dx===1)return (wc&2)===0;if(dx===-1)return (wn&2)===0;if(dz===1)return (wc&4)===0;return (wn&4)===0;};

check('walk word: low 3 bits are walls, lane codes live above them, older readers mask &7',()=>{
 const s=src.navInit;assert(s.includes('bits|=select(2u,east<<3u,east>0u);bits|=select(4u,south<<5u,south>0u);'));
 assert(s.includes('let fits=bodyFits30(p)||bodyFits30(p+vec2f(.3,0))||bodyFits30(p-vec2f(.3,0))||bodyFits30(p+vec2f(0,.3))||bodyFits30(p-vec2f(0,.3));'));
 assert(src.squadNav7.includes('if((O[WALK_OFFSET+i]&7u)==0u){return true;}'));assert(src.buddy.includes('(O[WALK_OFFSET+navcell(goal)]&7u)==0u'));
 for(const [name,code] of Object.entries(src))assert(!/O\[WALK_OFFSET[^\]]*\]\)?(==0u|>0u)/.test(code),'unmasked walk read in '+name);
});
check('step rules: a thin wall on an edge blocks only that edge; a lane code alone never blocks',()=>{
 const laneOnly=(2<<3)|(3<<5);assert(stepOpen(laneOnly,0,1,0,0,0)&&stepOpen(0,laneOnly,0,1,0,0),'lane codes are not walls');
 assert(!stepOpen(2,0,1,0,0,0)&&!stepOpen(0,2,-1,0,0,0),'east edge blocks both directions');assert(stepOpen(2,0,0,1,0,0),'south still open');
 assert(!stepOpen(0,1,1,0,0,0),'blocked core never entered');assert(!stepOpen(0,0,1,1,2,0)&&stepOpen(0,0,1,1,laneOnly,laneOnly),'diagonals need clean sides');
 assert(src.zombies.includes('fn stepOpen30(')&&src.navRelax.includes('fn stepOpen30('));
});
check('portal aim lines up with the open lane; diagonal and centre lanes keep the old aim',()=>{
 const p=src.zombies;assert(p.includes('if(a<4u){let gate=portal30(vec2f(c)+.5-HALF,wc,wn,d);if(length(gate-p)>.18){aim=safe2(gate-p);}}'));
 assert(p.includes("let off=select(select(.3,-.3,code==2u),0.0,code<=1u);"));
 assert(src.navInit.includes('let off=array<f32,3>(0.0,-.3,.3)[l];'),'lane 2 is -0.3 m and lane 3 is +0.3 m in both places');
});
check('line of sight needs the body to fit: two edge rays at the footprint',()=>{
 assert(src.zombies.includes('let bodySide=vec2f(-direct.y,direct.x)*footprint(kind);'));assert(src.zombies.includes('solid(vec3f(probe.x+bodySide.x,.36,probe.y+bodySide.y))>0u||solid(vec3f(probe.x-bodySide.x,.36,probe.y-bodySide.y))>0u'));
});
check('squad gunfire is heard at 9 m without drowning out louder noise; spawns need a reachable cell',()=>{
 assert(src.bullet3.includes('if(S.noise.z<=0.0||S.noise.w<=9.5){S.noise=vec4f(o.xz,2.0,9.0);}'));
 assert(src.zombies.includes('&&atomicLoad(&O[NAV_OFFSET+navcell(p)])<1073741800u){found=true;break;}'));assert(src.init.includes('&&O[NAV_OFFSET+navcell(p)]<1073741800u){ok=true;break;}'));
});
check('exact inverse restores the immutable pre-breach runtime',()=>{assert.equal(sha(withoutSteer29(fs.readFileSync(file,'utf8'))),delta.parentSha256);});
const report={method:'Source fragments and a CPU mirror of the walk-word rules; no WGSL execution here.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
