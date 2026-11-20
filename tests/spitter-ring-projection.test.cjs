const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const html=fs.readFileSync(process.env.TINY_TEST_HTML||require('node:path').join(__dirname,'../index.html'),'utf8');
const section=(from,to)=>{const a=html.indexOf(from),b=html.indexOf(to,a);assert.ok(a>=0&&b>a,from);return html.slice(a,b);};
const pool=html.match(/S\.acid13\[slot\]=vec4f\(z\.sense13\.xy,(\d+\.\d+)\/(\d+\.\d+),/);
const player=html.match(/distance\(S\.pos\.xz,acid\.xy\)<acid\.z\+(\.\d+)/);
const radius=Number(pool[1])/Number(pool[2])+Number(player[1]);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a}, expected ${b}`);
function fixture(zoom,width=1280,height=720,markerCamera104=[5,9],s=1){
 const ellipse=[],labels=[];const hud2d30={save(){},restore(){},beginPath(){},stroke(){},ellipse(...args){ellipse.push(args)},moveTo(){},lineTo(){}};
 const c=vm.createContext({hud2d30,settings:{started:true,muted:true,zoom,zombies:1},width,height,markerCamera104,playerValues:[5,0,9],hudScale30:s,text:(...args)=>labels.push(args),textWidth9:()=>176,COL9:{},audioZData9:new Float32Array(32),MAX_Z:1,ZOMBIE_FLOATS13:32,actorSnapshotEpoch96:1,runEpoch16:1});
 vm.runInContext(section('const norm=','const lightView=')+section('function screenPoint(','function timeLabel(')+section('function specialsHUD96(k){','// Kill combo:'),c);
 function draw(x,z,k=.8){
  ellipse.length=0;labels.length=0;
  Object.assign(c.audioZData9,{0:5,2:9,3:1,10:3,22:1,23:1,24:x,25:z});
  vm.runInContext('specialsHUD96('+k+')',c);return {ellipse,labels};
 }
 return {c,draw,get:s=>vm.runInContext(s,c)};
}
test('HUD ellipse matches the exact WGSL player damage boundary across angles and zoom',()=>{
 for(const zoom of [16,34,62])for(const [width,height,s] of [[1280,720,1],[700,1400,2]]){
  const f=fixture(zoom,width,height,[4.7,9.25],s), x=5.25,z=9.5,k=.8;
  const r=f.draw(x,z,k); assert.equal(r.ellipse.length,1);
  const [tx,ty,rx,ry,rot]=r.ellipse[0].map((v,i)=>i<4?v/s:v);
  const pt=f.get('screenPoint'); const center=pt(x,z,0);near(tx,center[0]);near(ty,center[1]);near(rot,0);
  for(let i=0;i<32;i++){
   const a=i*Math.PI/16;
   const d=(distance)=>{const [px,py]=pt(x+Math.cos(a)*distance,z+Math.sin(a)*distance,0);return ((px-tx)/rx)**2+((py-ty)/ry)**2;};
   near(d(radius),1);assert.ok(d(1.2)<1);assert.ok(d(1.5)>1);
  }
  assert.match(r.labels[0][0],/SPITTER/);assert.ok(r.labels[0][2]+19*k<=ty-ry);
 }
});
test('fully offscreen/invalid rings draw nothing; visible edge crescents survive',()=>{
 const f=fixture(34);const right=f.get('right'),up=f.get('up');
 const atScreenX=px=>{const d=(px-640)*34/1280;return [5+d*right[0],9+d*right[2]];};
 assert.equal(f.draw(...atScreenX(-65)).ellipse.length,0);
 const edge=f.draw(...atScreenX(-25));assert.equal(edge.ellipse.length,1);assert.ok(edge.labels[0][1]>=3.2);
 assert.equal(f.draw(Number.NaN,0).ellipse.length,0);
 const upMat=Math.hypot(up[0],up[2]);const atScreenY=py=>{const d=(360-py)*34/1280/(upMat*upMat);return [5+d*up[0],9+d*up[2]];};
 const upper=f.draw(...atScreenY(-10));assert.equal(upper.ellipse.length,1);assert.equal(upper.labels.length,0);
 assert.equal(f.draw(...atScreenY(-60)).ellipse.length,0);
});
test('live source range keeps valid warning disk in the orthographic depth slab',()=>{
 const f=fixture(62),eye=f.get('cameraEye'),back=f.get('back');
 const relevance=Number(html.match(/Math\.hypot\(x-playerValues\[0\],z-playerValues\[2\]\)>(\d+)\)continue/)[1]);
 const maxCommitDistance=Number(html.match(/targetDistance<(\d+\.\d+)\/64\.0&&z\.combat13\.z<=0\.0&&z\.special13\.w<0\.0/)[1])/64;
 const maxJitter=Math.SQRT2*.5*Number(html.match(/\)\)-\.5\)\*(\d+\.\d+)\/64\.0;z\.sense13=vec4f\(goalPoint\+jitter/)[1])/64;
 const depthRange=(relevance+maxCommitDistance+maxJitter+radius)*Math.hypot(back[0],back[2]), eyeDistance=Math.hypot(...eye);
 const [_,n,far]=html.match(/ortho\(-hw,hw,-hh,hh,(\.\d+),(\d+)\)/);
 assert.ok(eyeDistance-depthRange>+n);assert.ok(eyeDistance+depthRange<+far);
});
