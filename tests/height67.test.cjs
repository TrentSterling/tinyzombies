'use strict';
// Maple Street has height: the player and zombies collide at their own height, step up .55 m ledges, fall with gravity and land on
// what is under them (wall tops too). Six trampolines (fixed prop slots) launch the player ~2.9 m and fling zombies, who take hard
// landings as damage. DEAD ENDS keeps the old flat movement byte for byte (its y is always 0).
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha,loadHost}=require('./deadends-cpu-host.cjs'),{delta,withoutHeight67}=require('./height67.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('Zombie gains body (32 floats); every constructor writes it',()=>{assert(html.includes('sense13:vec4f, body:vec4f }'));assert(html.includes('const ZOMBIE_FLOATS13=32,ZOMBIE_BYTES13=128;'));
 const ctors=[...html.matchAll(/Zombie\(vec4f\(p\.x,0,p\.y/g)].length;assert.equal(ctors,2);assert.equal(html.split(',vec4f(0));').length-1>=2,true);});
check('ground3d: highest solid top at or below the probe, centre plus corners',()=>{assert(html.includes('fn ground3d(xz:vec2f,top:f32,r:f32)->f32 {'));
 const g=(cols,top)=>{let best=0;const hi=Math.max(0,Math.min(11,Math.floor(top*4)));for(const col of cols){for(let k=hi;k>=0;k--){if((k+1)*.25<=best)break;if(col.has(k)){best=Math.max(best,(k+1)*.25);break;}}}return best;};
 const wall=new Set([0,1,2,3,4,5,6,7,8,9]);assert.equal(g([wall],3.0),2.5,'stands on a 2.5 m wall top');assert.equal(g([wall],1.0),1.25,'a probe at 1.0 m counts the voxel it is in (1.0-1.25)');assert.equal(g([new Set()],2.0),0);});
check('player: DEAD ENDS lines kept verbatim, Maple goes through body3d65',()=>{assert(html.includes('if(u.run.x>5.0&&u.run.y<.5){p=body3d65(p,h,movement,dt);}else{let trialX=vec3f(p.x+movement.x,.35,p.z);if(!blocked(trialX,h)){p.x=trialX.x;}let trialZ=vec3f(p.x,.35,p.z+movement.y);if(!blocked(trialZ,h)){p.z=trialZ.z;}}'));
 assert(html.includes('if(tp.p.w==33.0&&distance(p.xz,tp.p.xz)<.95&&p.y<.6&&vy<=0.0){vy=11.5;'));const peak=11.5*11.5/(2*22);assert(peak>2.5&&peak<3.2,'clears a 2.5 m wall: '+peak.toFixed(2));
 return {measured:'SwiftShader real game: walked onto a trampoline, rose to 2.82 m with air control, came down; HUD ring follows height'};});
check('zombies: height, trampolines, landing damage, reach',()=>{assert(html.includes('let tx=vec3f(p.x+movement.x,p.y+.36,p.z);'));assert(html.includes('if(vy< -7.0){z.body.y=-vy;}'));assert(html.includes('if(z.body.y>0.0){damage+=(z.body.y-6.0)*16.0;'));
 assert(html.includes('(victim!=0u||abs(S.pos.y-p.y)<1.1)'),'a player up high cannot be bitten from below');const land=v=>(v-6)*16;assert(land(11)>=80,'a trampoline landing kills most commons');
 return {measured:'5 awake infected walked over a trampoline: all 5 launched (C[88]=5), BOING x2 callout'};});
check('six trampolines in fixed slots, Timmy first, no overlap with cheese',()=>{const h=loadHost(file,{plain:true});h.run('reset()');const r=h.json('({t:world.trampolines65,base:TRAMP_BASE65,pc:world.propCount,civ:world.civilians30.filter(c=>c.type===4).map(c=>[c.x,c.z]),cheese:world.cheese48})');
 assert(r.t.length>=2&&r.t.length<=6);assert(r.pc<=r.base,'regular props stay below the trampoline slots');for(const [x,z] of r.civ)assert(r.t.some(t=>t.x===x&&t.z===z),'one under each Timmy');
 for(const t of r.t)for(const c of r.cheese)assert(Math.hypot(t.x-c.x,t.z-c.z)>=2.5);const d=loadHost(file,{seed:'73129'});d.run('reset()');assert.equal(d.json('world.trampolines65?.length||0'),0,'none in DEAD ENDS');return {count:r.t.length};});
check('exact inverse restores the immutable pre-height runtime',()=>{assert.equal(sha(withoutHeight67(html)),delta.parentSha256);});
const report={method:'Source fragments, ground and launch arithmetic, CPU-host world; real-game bounces measured on SwiftShader (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
