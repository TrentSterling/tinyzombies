'use strict';
// CPU geometry regression only. Does not execute WGSL or establish escort success/performance.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {loadHost,sha}=require('./deadends-cpu-host.cjs');
const file=process.argv[2]||'index.html',html=fs.readFileSync(file,'utf8');
const source=html.slice(html.indexOf('fn civStep30('),html.indexOf('@compute @workgroup_size(16)',html.indexOf('fn civStep30(')));
assert(source.includes('blocked(vec3f(q.x,.36,q.y),vec3f(.2+sweep.x,.29,.2+sweep.y))'));
assert(source.includes('s<=steps'));assert(source.includes('ceil(dist*8.0)'));
const report={runtimeSha256:sha(html),method:'CPU static-geometry reference over generated Maple Street worlds; no GPU execution or earned rescues',seeds:[]};
for(const seed of [1234,73129,42]){
 const h=loadHost(file,{seed,plain:true}),{world,addr,GRID}=h.run('({world,addr:occAddress,GRID})'),occ=world.occ;
 const solid=(x,y,z)=>{const a=addr(Math.floor((x+96)*4),Math.floor(y*4),Math.floor((z+96)*4),occ);return a>=0&&occ[a]>0;};
 const blocked=(x,z,hx=.2,hz=.2)=>{if(Math.abs(x)+hx>95.8||Math.abs(z)+hz>95.8)return true;for(let yy=0;yy<=2;yy++)for(let zz=Math.floor((z-hz+96)*4);zz<=Math.floor((z+hz+96)*4);zz++)for(let xx=Math.floor((x-hx+96)*4);xx<=Math.floor((x+hx+96)*4);xx++){const a=addr(xx,yy,zz,occ);if(a>=0&&occ[a])return true;}return false;};
 function clear(a,b,old){const d=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d>=20)return false;const n=old?Math.ceil(d*2):Math.max(1,Math.ceil(d*8));for(let i=1;old?i<n:i<=n;i++){const t=old?i*.5/d:(i-.5)/n,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;if(old?solid(x,.36,z):blocked(x,z,.2+Math.abs(b[0]-a[0])*.5/n,.2+Math.abs(b[1]-a[1])*.5/n))return false;}return true;}
 let checked=0,falseShortcuts=0;const examples=[];
 for(const c of world.civilians30)for(let off=-2;off<=2;off++)for(let angle=0;angle<32;angle++)for(let r=1;r<=6;r++){
  const a=[c.x+off*.25,c.z],b=[a[0]+Math.cos(angle*Math.PI/16)*r,a[1]+Math.sin(angle*Math.PI/16)*r];if(blocked(...a)||blocked(...b))continue;checked++;
  if(clear(a,b,true)&&!clear(a,b,false)){falseShortcuts++;if(examples.length<3)examples.push({neighbor:c.name,from:a,to:b});}
 }
 assert(falseShortcuts>0,`seed ${seed} should reproduce false point-ray shortcuts`);
 report.seeds.push({seed,checked,falseShortcuts,examples});
}
// Synthetic thin-wall and dynamic obstruction reference: body corners and the last partial segment must be tested.
assert(html.includes('if((O[DYNAMIC_OFFSET+u32(x+DYNAMIC_GRID*z)]&mask)!=0u){return true;}'));
report.passed=true;console.log(JSON.stringify(report,null,2));
