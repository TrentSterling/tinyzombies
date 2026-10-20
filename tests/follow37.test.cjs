'use strict';
// Behaviour pass 5: following neighbors keep their own place in a loose column, keep pace, and sidestep awake infected.
// Source fragments and a JS mirror of the goal rule; GPU escort runs are in the PR notes (SwiftShader).
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutFollow37}=require('./follow37.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8'),src=loadHost(file).sources;
const civ=Object.values(src).find(s=>s.includes('fn civStep30('));
const norm=v=>{const l=Math.hypot(v[0],v[1]);return l>0?[v[0]/l,v[1]/l]:[0,0];};
// Mirror of the WGSL goal: column slot behind the heading while moving, own bearing (no side slot) while standing.
function goal(player,me,heading,rank){const moving=Math.hypot(...heading)>.3;let back=norm([me[0]-player[0],me[1]-player[1]]);if(moving)back=norm(heading).map(v=>-v);
 const s=(rank&1)?.6:-.6,side=[-back[1]*s*(moving?1:0),back[0]*s*(moving?1:0)],r=1.4+Math.floor(rank/2)*.9;return [player[0]+back[0]*r+side[0],player[1]+back[1]*r+side[1]];}
check('the old one-point follow is gone; followers aim at a per-rank slot and spread from each other',()=>{
 assert(civ,'civilian shader');assert(!civ.includes('stride2=civStep30(me,player.xz)*select(2.1,2.9,d>6.0)'));
 for(const f of ['if(j<k&&o.data.y>1.5){rank++;}','if(od<.9&&od>.001){sep+=(me-o.p.xz)/od*(.9-od);}','var goal=player.xz+back*(1.4+f32(rank/2u)*.9)+side;','if(solid(vec3f(goal.x,.36,goal.y))>0u){goal=player.xz+back*1.4;}','stride2=civStep30(me,goal)*select(2.6,3.6,d>4.0)*clamp(gap/1.2,.35,1.0);'])assert(civ.includes(f),f);
});
check('dodging awake infected never pushes a follower backwards and speed is capped',()=>{
 assert(civ.includes('if(ed<2.2&&ed>.001){away+=(me-e.p.xz)/ed*(2.2-ed)/2.2;}'));assert(civ.includes('let dodge=away-fwd*min(0.0,dot(away,fwd));'));assert(civ.includes('if(sl>3.8){stride2*=3.8/sl;}'));
 for(const [a,f] of [[[-1,0],[1,0]],[[-1,1],[1,0]],[[0,1],[1,0]],[[1,1],[1,0]]]){const d=Math.min(0,a[0]*f[0]+a[1]*f[1]),dodge=[a[0]-f[0]*d,a[1]-f[1]*d];assert(dodge[0]*f[0]+dodge[1]*f[1]>=-1e-9,'no backward component for '+a);}
});
check('walking: four followers get four distinct slots behind the player, two wide',()=>{
 const g=[0,1,2,3].map(r=>goal([0,0],[-2,0],[1,0],r));assert(g.every(p=>p[0]<-1.3));
 for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)assert(Math.hypot(g[i][0]-g[j][0],g[i][1]-g[j][1])>=.89,'slots '+i+','+j);return {slots:g.map(p=>p.map(v=>+v.toFixed(2)))};
});
check('standing: the goal sits on the line from the player to the follower, so nobody orbits',()=>{
 for(const me of [[3,0],[-2,2],[0,-4]])for(let r=0;r<4;r++){const g=goal([0,0],me,[0,0],r);assert(Math.abs(g[0]*me[1]-g[1]*me[0])<1e-9,'collinear');assert(g[0]*me[0]+g[1]*me[1]>0,'same side');}
});
check('joining, bites, loss and saving are unchanged',()=>{
 for(const f of ['if(c.data.y<1.5&&d<2.2&&player.w>0.0){c.data.y=2.0;atomicAdd(&C[96],1u);','c.data.x-=f32(min(bites,6u))*7.0*dt','if(c.data.x<=0.0){c.data.x=0.0;c.data.y=4.0;atomicAdd(&C[97],1u);','if(c.data.y>1.5&&dp.x> -1.75&&dp.x<2.30&&abs(dp.y)<2.25){c.data.y=3.0;atomicAdd(&C[98],1u);}'])assert(civ.includes(f),f);
});
check('exact inverse restores the immutable pre-follow runtime',()=>{assert.equal(sha(withoutFollow37(html)),delta.parentSha256);});
const report={method:'Source fragments and a JS mirror of the follow goal; no WGSL execution here.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
