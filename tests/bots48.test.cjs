'use strict';
// Bots stay with the player on Maple Street. Chapter route and safe-room helpers only cover chapters 1-5 and fell back to Mercer's,
// so stage 6 bots ran to a formation point on Chapter 1's route. The buddy shader hangs SwiftShader, so this is a mirror plus source.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutBots48}=require('./bots48.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8'),b=loadHost(file).sources.buddy;
check('stage 6 formation is a slot beside and behind the player, before any route logic',()=>{
 const f=b.slice(b.indexOf('fn sourceAdvance14('));assert(f.indexOf('if(u.run.x>5.0){')<f.indexOf('routeAhead14'),'Maple branch first');
 assert(f.includes('let dir=select(safe2(S.look.xy),safe2(S.motion.xy),length(S.motion.xy)>.3);let side=select(.95,-.95,id==1u);let back=select(1.2,2.2,id==2u);return walkGoal14(S.pos.xz-dir*back+vec2f(-dir.y,dir.x)*side);'));
});
check('mirror: every slot is within 2.5 m of the player and behind the walking direction (aim when standing)',()=>{
 const n=v=>{const l=Math.hypot(...v);return l?v.map(x=>x/l):[0,0];};
 const slot=(pos,look,motion,id)=>{const dir=Math.hypot(...motion)>.3?n(motion):n(look);const side=id===1?-.95:.95,back=id===2?2.2:1.2;return [pos[0]-dir[0]*back-dir[1]*side,pos[1]-dir[1]*back+dir[0]*side];};
 for(const [look,motion] of [[[1,0],[0,0]],[[1,0],[-1,0]],[[0,1],[.7,.7]],[[-1,0],[0,1]]])for(let id=0;id<3;id++){const p=[10,-4],s=slot(p,look,motion,id),d=[s[0]-p[0],s[1]-p[1]];
  assert(Math.hypot(...d)<2.5);const dir=Math.hypot(...motion)>.3?n(motion):n(look);assert(d[0]*dir[0]+d[1]*dir[1]<0,'behind');}
});
check('Mercer safe-room anchor only in the chapters; local path refinement also on Maple Street',()=>{
 assert(b.includes('let anchorInside=u.run.x<=5.0&&chapterInside16(S.pos.xz,u.run.x);'));
 assert(Object.values(loadHost(file).sources).some(s=>s.includes('if((u.run.x==1.0||u.run.x>5.0)&&count>0u&&d<12.0&&any(nodes[bestID].cell!=finish)')));
});
check('exact inverse restores the immutable pre-bots-fix runtime',()=>{assert.equal(sha(withoutBots48(html)),delta.parentSha256);});
const report={method:'Source fragments and a JS mirror of the stage 6 formation slot.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
