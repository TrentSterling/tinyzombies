'use strict';
// Supplementary CPU validation only. Does not execute, compile, or time GPU work.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const repo=path.resolve(__dirname,'..');
const {loadHost,sha}=require(path.join(repo,'tests/deadends-cpu-host.cjs'));
const h=loadHost(process.argv[2]||path.join(repo,'index.html'));
const temp=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'tiny-mercer-parent-'));let parent;
try{const parentFile=path.join(temp,'index.html');fs.writeFileSync(parentFile,require('./mercer-restoration-scope.cjs').withoutMercerRestoration24(h.html));parent=loadHost(parentFile);}finally{fs.rmSync(temp,{recursive:true,force:true});}
const byteHash=a=>sha(Buffer.from(a.buffer,a.byteOffset,a.byteLength));
const limits=h.json('({MAX_Z,MAX_WORLD,MAX_PAGES,MAX_GROUPS,OCC_BASE,CHUNK_CELLS})');
const seeds=[0,1,2,73129,2147483647,2147483648,4294967294,4294967295];
let rand=0x45ca71;while(seeds.length<32){rand=(Math.imul(rand,1664525)+1013904223)>>>0;if(!seeds.includes(rand))seeds.push(rand);}
const budgets=[-1,0,1,184,185,186,245,246,2048,8191,8192,9000];
const checks=[],summaries=[];let builds=0,footprints=0;
function occAt(w,x,y,z){if(x<0||x>=768||z<0||z>=768||y<0||y>=12)return 0;const page=w.occ[(x>>4)+48*(z>>4)];return page?w.occ[limits.OCC_BASE+(page-1)*limits.CHUNK_CELLS+(x&15)+16*(z&15)+256*y]:0;}
function blocked(w,x,z,r=.30){
 for(let yy=0;yy<=2;yy++)for(let zz=Math.floor((z-r+96)*4);zz<=Math.floor((z+r+96)*4);zz++)for(let xx=Math.floor((x-r+96)*4);xx<=Math.floor((x+r+96)*4);xx++)if(occAt(w,xx,yy,zz))return true;
 for(let k=0;k<w.propCount;k++){const p=w.props,o=k*16;if(![4,5,9,10].includes(p[o+3])||p[o+4]<=0)continue;if(.65<p[o+1]-p[o+9]/2||.07>p[o+1]+p[o+9]/2)continue;if(Math.abs(x-p[o])<r+p[o+8]/2&&Math.abs(z-p[o+2])<r+p[o+10]/2)return true;}
 return false;
}
for(const seed of seeds){
 const summary={seed,passed:true};try{
  parent.run(`runSeed=${seed};stage=1;settings.zombies=8192;world=makeWorld();`);const pw=parent.run('world'),sourceCount=pw.source13.infected.length;
  let geometry;
  for(const requested of budgets){
   h.run(`runSeed=${seed};stage=1;settings.zombies=${requested};world=makeWorld();`);builds++;const w=h.run('world'),budget=Math.max(0,Math.min(8192,Math.floor(requested)));
   let alive=0;for(let i=0;i<8192;i++)if(w.initialZ13[i*28+3]>0)alive++;
   assert.equal(alive,budget,'exact live actor budget');assert.equal(w.mercer24.population,budget);
   assert.equal(byteHash(w.initialZ13.subarray(0,Math.min(sourceCount,budget)*28)),byteHash(pw.initialZ13.subarray(0,Math.min(sourceCount,budget)*28)),'authored actor prefix');
   assert(w.initialZ13.subarray(budget*28).every(x=>x===0),'unused slots must be zero');
   const hashes=['blocks','occ','props','groups','navSeed','walk'].map(k=>byteHash(w[k]));if(geometry)assert.deepEqual(hashes,geometry,'changing budget cannot change geometry');else geometry=hashes;
   assert(w.count<limits.MAX_WORLD);assert(w.occupiedPages<=limits.MAX_PAGES);assert(w.groupCount<limits.MAX_GROUPS);
   if(requested===8192){
    const unique=new Set();for(let i=sourceCount;i<budget;i++){
     const o=i*28,x=w.initialZ13[o],z=w.initialZ13[o+2],key=x+','+z,cell=Math.floor(x+96)+192*Math.floor(z+96);
     assert(Number.isFinite(x)&&Number.isFinite(z));assert(!unique.has(key),'duplicate supplemental spawn');unique.add(key);
     assert(Math.abs(x)>=43||Math.abs(z)>=28);assert(Math.hypot(x-w.start[0],z-w.start[1])>=15);assert(w.navSeed[cell]<1073741800);assert.equal(w.walk[cell],0);
     assert(!blocked(w,x,z),'blocked supplemental spawn at '+key);footprints++;
    }
    const groupSizes=new Map(),addresses=new Set();let structural=0;
    for(let i=0;i<w.count;i++){const o=i*8,g=w.blocks[o+7],a=w.blocks[o+5];assert(!addresses.has(a),'duplicate occupied address');addresses.add(a);assert.equal(w.occ[a],i+1,'occupancy-to-block backlink');if(g>0)groupSizes.set(g,(groupSizes.get(g)||0)+1);else structural++;}
    assert(Math.max(...groupSizes.values())<=128);assert(structural>0);
    let connected=0;for(const d of w.navSeed)if(d<1073741800)connected++;
    assert(connected>18000);for(const [x,z,width,depth]of w.mercer24.buildings)assert(w.navSeed[Math.floor(x+width/2+96)+192*Math.floor(z+depth/2+96)]<1073741800,'building interior disconnected');
    for(const [x0,z0,x1,z1]of w.mercer24.passages){const c=[(x0+x1)/2,(z0+z1)/2],axis=x1-x0<z1-z0?0:1;for(let n=-8;n<=8;n++){const p=c.slice();p[axis]+=n*.125;assert(!blocked(w,...p,.24),'blocked passage');}}
    Object.assign(summary,{voxels:w.count,pages:w.occupiedPages,groups:w.groupCount,maxGroupVoxels:Math.max(...groupSizes.values()),connected,spawnFootprints:unique.size});
    const first=byteHash(w.initialZ13);h.run('world=makeWorld();');builds++;assert.equal(byteHash(h.run('world.initialZ13')),first,'same seed determinism');
   }
  }
 }catch(e){summary.passed=false;summary.error=e.stack;}
 summaries.push(summary);
}
const report={runtimeSha256:h.sha256,method:'32 deterministic seeds × 12 boundary budgets, exact production host buffers; independent voxel/prop footprint checks at maximum population. Parent actor prefixes, zero unused slots, geometry independence, all occupancy backlinks, group capacities, all nine building interiors, five passages and repeat determinism. CPU only: no shader compilation/execution, dynamic fracture, GPU ordering or gameplay/performance.',passed:summaries.every(x=>x.passed),seedCount:seeds.length,budgets,worldBuilds:builds,maximumBudgetSupplementalFootprints:footprints,summaries};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
