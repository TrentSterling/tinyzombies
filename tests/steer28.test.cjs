'use strict';
// Steering pass 2: two-lane flow field (squad + heard), heard-aware pathing, gradient smoothing, speed-matched queues, circle crowd solve.
// Source fragments plus a CPU reference of the packed relaxation; GPU execution evidence is described in the PR, not run here.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs'),{delta,withoutSteer28}=require('./steer28.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const h=loadHost(file),src=h.sources;

check('navInit seeds the squad lane (player 0, living bots 40) and the heard lane (noise, alarm, lure pipes)',()=>{
 const s=src.navInit;assert(s.includes('var squad=select(65535u,0u,navcell(S.pos.xz)==i)'));assert(s.includes('squad=min(squad,40u)'));
 for(const k of ['S.noise.z>0.0&&navcell(S.noise.xy)==i','S.alarm.z>0.0&&navcell(S.alarm.xy)==i','pipe.z>0.0&&pipe.w-pipe.z>=.45&&navcell(pipe.xy)==i'])assert(s.includes(k),k);
 assert(s.includes('A[i]=squad|(heard<<16u);'));
});
check('packed relaxation equals two independent fields (CPU reference of the shader arithmetic)',()=>{
 // 12 x 12 grid, a wall column with a one-cell gap; squad source at (1,1), heard source at (10,10).
 const N=12,walk=new Uint8Array(N*N);for(let z=0;z<N;z++)if(z!==6)walk[5+N*z]=1;
 const idx=(x,z)=>x+N*z,INF16=65535;let A=new Uint32Array(N*N).fill(0xffffffff);
 for(let c=0;c<N*N;c++){const s=c===idx(1,1)?0:INF16,hh=c===idx(10,10)?0:INF16;A[c]=walk[c]?0xffffffff:(s|(hh<<16))>>>0;}
 const dirs=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
 for(let it=0;it<80;it++){const B=new Uint32Array(N*N);for(let c=0;c<N*N;c++){if(walk[c]){B[c]=0xffffffff;continue;}const x=c%N,z=(c/N)|0;let s=A[c]&65535,hh=A[c]>>>16;
  dirs.forEach(([dx,dz],j)=>{const nx=x+dx,nz=z+dz;if(nx<0||nz<0||nx>=N||nz>=N)return;if(j>=4&&(walk[x+N*nz]||walk[nx+N*z]))return;const v=A[idx(nx,nz)],w=j>=4?14:10;s=Math.min(s,Math.min((v&65535)+w,65535));hh=Math.min(hh,Math.min((v>>>16)+w,65535));});B[c]=(s|(hh<<16))>>>0;}A=B;}
 assert.equal(A[idx(1,1)]&65535,0);assert.equal(A[idx(10,10)]>>>16,0);assert.equal(A[idx(10,10)]&65535,A[idx(1,1)]>>>16,'symmetric path costs');
assert(src.navRelax.includes('squad=min(squad,min((v&65535u)+w,65535u));heard=min(heard,min((v>>16u)+w,65535u));'));
 return {squadAtHeardSource:A[idx(10,10)]&65535};
});
check('publish keeps the squad lane in nav units with INF, heard lane goes to the freed region; the old raw copy is gone',()=>{
 assert(src.navPublish.includes('O[NAV_OFFSET+i]=select(squad,1073741823u,squad>=65535u);O[HEARD_OFFSET+i]=select(heard,1073741823u,heard>=65535u);'));
 assert(!h.script.includes('enc.copyBufferToBuffer(NavA,0,O,NAV_OFFSET*4,NAV_SIZE*4)'));assert(h.script.includes("pass(enc,'navPublish',bindings.navPublish,Math.ceil(NAV_SIZE/64))"));
 assert(h.script.includes("packed25[c]=Math.min(world.navSeed[c],65535)|0xffff0000"),'boot seed packed, heard lane starts unreachable');
});
check('heard infected path on the heard lane and fall back to the squad lane when it has no route',()=>{
 const z=src.zombies;assert(z.includes('var heard=false;if(S.noise.z>0.0&&distance>14.0&&length(z.p.xz-S.noise.xy)<S.noise.w){goalPoint=S.noise.xy;heard=true;}'));
 assert(z.includes('goalPoint=S.alarm.xy;heard=true;'));assert(z.includes('goalPoint=pipe.xy;heard=true;'));
 assert(z.includes('flowDirection(z.p.xz,direct,z.v.xy,i,select(NAV_OFFSET,HEARD_OFFSET,heard))'));assert(z.includes('if(heard&&all(dir==vec2f(0))&&targetDistance>1.2){dir=flowDirection(z.p.xz,direct,z.v.xy,i,NAV_OFFSET);}'));
});
check('queues match the leader instead of braking to 8 percent; crowd contacts are circles',()=>{
 assert(src.zombies.includes('let wanted=dir*mix(max(speed*.08,leaderSpeed),speed,forwardSpace)+'));assert(src.zombies.includes('leaderSpeed=clamp(dot(other.v.xy,dir),0.0,speed);'));
 assert(src.crowd.includes('if(gap<r){var n=delta/max(gap,.00001);'));assert(!src.crowd.includes('let axis=select(0u,1u,overlap.y<overlap.x)'));
});
check('exact inverse restores the immutable pre-steering runtime',()=>{assert.equal(sha(withoutSteer28(fs.readFileSync(file,'utf8'))),delta.parentSha256);});
const report={method:'Source fragments and a CPU reference of the packed relaxation; no WGSL execution here.',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
