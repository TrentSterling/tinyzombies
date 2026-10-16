'use strict';
// CPU reference model of existing world, collision and bounded navigation rules.
// This does not compile or execute WGSL and is not an earned gameplay test.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function loadHost(file){
 const html=fs.readFileSync(file,'utf8'),script=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
 const marker='loadAudioBank9();\nmain().catch(fail);';assert.equal(script.split(marker).length,2);
 const forbidden=name=>()=>{throw Error('CPU navigation test forbids '+name);};
 const c={console,URLSearchParams,location:{search:'?seed=73129'},document:{getElementById(){return{}},addEventListener(){}},addEventListener(){},atob:s=>Buffer.from(s,'base64').toString('binary'),localStorage:{getItem(){return null}},innerWidth:1280,innerHeight:720,requestAnimationFrame:forbidden('animation'),fetch:forbidden('network'),navigator:{gpu:{requestAdapter:forbidden('WebGPU')}},performance:{now:()=>0}};
 c.window=c;vm.createContext(c);vm.runInContext(script.replace(marker,''),c);return{html,run:code=>vm.runInContext(code,c)};
}
function makeModel(file,stage=1){
 const host=loadHost(file);if(stage!==1)host.run(`stage=${stage};world=makeWorld();`);
 const {NG,GRID,DYNAMIC_GRID,DYNAMIC_OFFSET,WALK_OFFSET}=host.run('({NG,GRID,DYNAMIC_GRID,DYNAMIC_OFFSET,WALK_OFFSET})');
 const world=host.run('world'),occ=world.occ.slice(),props=world.props.slice(),addr=host.run('occAddress');
 const half=96,clamp=(a,l,h)=>Math.max(l,Math.min(h,a));
 const occAt=(x,y,z)=>{if(x<0||x>=GRID||y<0||y>=12||z<0||z>=GRID)return 0;const a=addr(x,y,z,occ);return a<0?0:occ[a];};
 const solid=(x,y,z)=>occAt(Math.floor((x+half)*4),Math.floor(y*4),Math.floor((z+half)*4));
 function dynamic(){
  occ.fill(0,DYNAMIC_OFFSET);
  for(let i=0;i<world.propCount;i++){const o=i*16,p=props.subarray(o,o+16);if(![4,5,9,10].includes(p[3])||p[4]<=0)continue;
   const lo=[p[0]-p[8]/2+.001,p[1]-p[9]/2+.001,p[2]-p[10]/2+.001],hi=[p[0]+p[8]/2-.001,p[1]+p[9]/2-.001,p[2]+p[10]/2-.001];if(lo[1]>=3||hi[1]<0)continue;
   const y0=clamp(Math.floor(lo[1]*4),0,11),y1=clamp(Math.floor(hi[1]*4),0,11),mask=((1<<(y1+1))-1)^((1<<y0)-1);
   for(let z=clamp(Math.floor((lo[2]+half)*2),0,DYNAMIC_GRID-1);z<=clamp(Math.floor((hi[2]+half)*2),0,DYNAMIC_GRID-1);z++)for(let x=clamp(Math.floor((lo[0]+half)*2),0,DYNAMIC_GRID-1);x<=clamp(Math.floor((hi[0]+half)*2),0,DYNAMIC_GRID-1);x++)occ[DYNAMIC_OFFSET+x+DYNAMIC_GRID*z]|=mask|(p[3]===9?0:mask<<16);
  }
 }
 function blocked(x,z,r=.24,y=.36,hy=.29){
  if(Math.abs(x)+r>half-.2||Math.abs(z)+r>half-.2)return true;
  if(y-hy<3&&y+hy>=0){const low=clamp(Math.floor((y-hy)*4),0,11),high=clamp(Math.floor((y+hy)*4),0,11),mask=((1<<(high+1))-1)^((1<<low)-1);
   for(let zz=clamp(Math.floor((z-r+half)*2),0,DYNAMIC_GRID-1);zz<=clamp(Math.floor((z+r+half)*2),0,DYNAMIC_GRID-1);zz++)for(let xx=clamp(Math.floor((x-r+half)*2),0,DYNAMIC_GRID-1);xx<=clamp(Math.floor((x+r+half)*2),0,DYNAMIC_GRID-1);xx++)if(occ[DYNAMIC_OFFSET+xx+DYNAMIC_GRID*zz]&mask)return true;
  }
  for(let yy=Math.max(0,Math.floor((y-hy)*4));yy<=Math.min(11,Math.floor((y+hy)*4));yy++)for(let zz=Math.max(0,Math.floor((z-r+half)*4));zz<=Math.min(GRID-1,Math.floor((z+r+half)*4));zz++)for(let xx=Math.max(0,Math.floor((x-r+half)*4));xx<=Math.min(GRID-1,Math.floor((x+r+half)*4));xx++)if(occAt(xx,yy,zz))return true;
  return false;
 }
 function passCell(x,z){
  if(x<1||z<1||x>=NG-1||z>=NG-1)return false;const px=x+.5-half,pz=z+.5-half;
  for(const dz of [-.25,.25])for(const dx of [-.25,.25])if(solid(px+dx,.36,pz+dz))return false;
  const g=props.subarray(world.gate13*16,world.gate13*16+16);if(stage<=2&&g[5]>.5&&Math.abs(px-g[0])<g[8]/2+.25&&Math.abs(pz-g[2])<g[10]/2+.25)return false;
  if(!blocked(px,pz,.30))return true;
  for(const d of world.doors7){const p=props.subarray(d.index*16,d.index*16+16);if(p[4]>0&&p[14]<.5&&Math.abs(px-p[0])<p[8]/2+.55&&Math.abs(pz-p[2])<p[10]/2+.55)return true;}
  return false;
 }
 function clear(a,b,spacing=.125){const d=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.min(256,Math.ceil(d/spacing)));for(let k=1;k<=n;k++){const t=k/n;if(blocked(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t))return false;}return true;}
 function coarse(a,b){
  const d=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d<12&&clear(a,b,.4))return{path:[b],expanded:0,direct:true};
  if(d<1)return{path:[],expanded:0};
  const start=a.map(v=>clamp(Math.floor(v+half),1,NG-2)),finish=b.map(v=>clamp(Math.floor(v+half),1,NG-2));
  const nodes=[{c:start,parent:-1,used:false,g:0,f:d}];let bestID=0,nearest=d,expanded=0,reached=false;
  for(let step=0;step<192;step++){
   let at=-1,low=1e8;for(let j=0;j<nodes.length;j++)if(!nodes[j].used&&nodes[j].f<low){low=nodes[j].f;at=j;}if(at<0)break;
   const node=nodes[at],c=node.c;node.used=true;expanded++;const rem=Math.hypot(c[0]-finish[0],c[1]-finish[1]);if(rem<nearest){nearest=rem;bestID=at;}
   if(c[0]===finish[0]&&c[1]===finish[1]){bestID=at;reached=true;break;}
   for(const [k,offset]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]].entries()){
    const cell=[c[0]+offset[0],c[1]+offset[1]];if(!passCell(...cell))continue;if(k>=4&&(!passCell(c[0]+offset[0],c[1])||!passCell(c[0],c[1]+offset[1])))continue;
    const cost=node.g+(k>=4?1.414214:1);let found=nodes.findIndex(v=>v.c[0]===cell[0]&&v.c[1]===cell[1]);if(found>=0&&cost>=nodes[found].g)continue;if(found<0){if(nodes.length>=256)continue;found=nodes.length;}
    nodes[found]={c:cell,parent:at,used:false,g:cost,f:cost+Math.hypot(cell[0]-finish[0],cell[1]-finish[1])};
   }
  }
  const reverse=[];let at=bestID;while(at>0&&reverse.length<128){reverse.push(nodes[at].c);at=nodes[at].parent;}
  return{path:reverse.reverse().slice(0,16).map(p=>p.map(v=>v+.5-half)),expanded,nodes:nodes.length,reached,nearest};
 }
 function openDoor(index){props[index*16+1]=3.4;props[index*16+5]=0;}
 openDoor(world.gate13);openDoor(world.final13);dynamic();return{host,world,props,occ,solid,blocked,passCell,clear,coarse,dynamic,openDoor};
}


const offsets=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
function localEdge(model,a,b){const d=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d>1.25)return false;const n=Math.max(1,Math.ceil(d/.125));for(let k=0;k<=n;k++){const t=k/n;if(model.blocked(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t))return false;}return true;}
function localPath(model,a,b,hazards=[]){
 const cell=p=>p.map(v=>Math.floor((v+96)*2)),point=c=>c.map(v=>(v+.5)*.5-96),start=cell(a),finish=cell(b),d=Math.hypot(b[0]-a[0],b[1]-a[1]);
 const nodes=[{c:start,parent:-1,used:false,g:0,f:d}];let nearest=d,bestID=0,expanded=0,reached=false,edgeChecks=0;
 for(let step=0;step<192;step++){
  let at=-1,low=1e8;for(let j=0;j<nodes.length;j++)if(!nodes[j].used&&nodes[j].f<low){at=j;low=nodes[j].f;}if(at<0)break;
  const node=nodes[at];node.used=true;expanded++;const rem=Math.hypot(node.c[0]-finish[0],node.c[1]-finish[1])*.5;if(rem<nearest){nearest=rem;bestID=at;}
  if(node.c.every((v,i)=>v===finish[i])){bestID=at;reached=true;break;}
  for(const [k,off]of offsets.entries()){
   const c=node.c.map((v,i)=>v+off[i]),p=point(c),from=at===0?a:point(node.c);if(c.some(v=>v<1||v>=383))continue;edgeChecks++;if(!localEdge(model,from,p))continue;
   const hazard=hazards.reduce((sum,h)=>sum+(Math.hypot(p[0]-h.x,p[1]-h.z)<h.radius+22/64?h.cost:0),0),cost=node.g+(k>=4?.707107:.5)+hazard;
   let found=nodes.findIndex(v=>v.c.every((x,i)=>x===c[i]));if(found>=0&&cost>=nodes[found].g)continue;if(found<0){if(nodes.length>=256)continue;found=nodes.length;}
   nodes[found]={c,parent:at,used:false,g:cost,f:cost+Math.hypot(c[0]-finish[0],c[1]-finish[1])*.5};
  }
 }
 let at=bestID,reverse=[];while(at>0&&reverse.length<128){assert(at<nodes.length);reverse.push(point(nodes[at].c));at=nodes[at].parent;}
 return{path:at>0?[]:reverse.reverse().slice(0,16),expanded,nodes:nodes.length,reached:at<=0&&reached,edgeChecks,arrival:.125};
}
function plan(model,a,b){const coarse=model.coarse(a,b);if(!model.host.html.includes('count=localPath15(id,a.p.xz,destination7)')||coarse.path.length||Math.hypot(b[0]-a[0],b[1]-a[1])>=12)return{...coarse,arrival:28/64,fallback:false};return{...localPath(model,a,b),fallback:true,coarseExpanded:coarse.expanded};}
function fragment(text,marker){const at=text.indexOf(marker);assert(at>=0,marker);const begin=text.indexOf('{',at);let depth=0;for(let i=begin;i<text.length;i++){if(text[i]==='{')depth++;else if(text[i]==='}'&&!--depth)return text.slice(at,i+1);}throw Error('Unclosed '+marker);}
module.exports={makeModel,localEdge,localPath,plan,fragment};
