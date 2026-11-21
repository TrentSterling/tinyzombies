import assert from 'node:assert/strict';
const f=Math.fround,F=[14,12,28,17,16,19,28].map(x=>x/64),N=192,H=96;
const bc=n=>Math.min(N-1,Math.max(0,Math.floor(f(n+H))));
const bounds=(x,d)=>bc(f(x+d));
function active(z,d){return z.hp>0&&Math.abs(f(z.x-d.x))<f(d.w*.5+F[z.kind])&&Math.abs(f(z.y-d.y))<f(d.h*.5+F[z.kind]);}
function attack(z,d){return z.hp>0&&z.awake&&Math.abs(f(z.x-d.x))<f(d.w*.5+.85)&&Math.abs(f(z.y-d.y))<f(d.h*.5+.85);}
function grid(a){const occ=new Map();for(const z of a){if(z.hp<=0)continue;const k=bc(z.x)+N*bc(z.y);if(!occ.has(k))occ.set(k,[]);occ.get(k).push(z);}return occ;}
function periodic(g,d){let count=0,attackers=0,occupied=false;
for(let y=Math.floor(d.y+H)-3;y<=Math.floor(d.y+H)+3;y++)for(let x=Math.floor(d.x+H)-3;x<=Math.floor(d.x+H)+3;x++){
 if(x<0||x>=N||y<0||y>=N||count>=96)continue;
 for(const z of (g.get(x+N*y)??[]).slice(0,Math.min(16,96-count))){count++;occupied||=active(z,d);if(attack(z,d))attackers+=z.kind===6?6:1;}
}return {count,attackers,occupied};}
function closeOnly(g,d){const bx=f(d.w*.5+f(F[6]+.00025)),by=f(d.h*.5+f(F[6]+.00025));let tested=0;
for(let y=bounds(d.y,-by);y<=bounds(d.y,by);y++)for(let x=bounds(d.x,-bx);x<=bounds(d.x,bx);x++)for(const z of g.get(x+N*y)??[]){tested++;if(active(z,d))return {occupied:true,tested};}
return {occupied:false,tested};}
const d={x:-60.25,y:52,w:.5,h:3.5};const z=(x,y,hp=1,kind=0,awake=true)=>({x:f(x),y:f(y),hp,kind,awake});const actual=z(d.x,d.y);
const a1=[...Array.from({length:6},(_,i)=>Array.from({length:16},()=>z(-63.5+i,49.1))).flat(),actual];
const a2=[...Array.from({length:16},()=>z(-60.97,52.2,1,0,false)),actual];
for(const test of [a1,a2]){assert.equal(periodic(grid(test),d).occupied,false);assert.equal(periodic(grid(test),d).attackers,0);assert.equal(closeOnly(grid(test),d).occupied,true);}
const dense=Array.from({length:8192},()=>z(-60.97,52.02));assert.deepEqual(closeOnly(grid(dense),d),{occupied:false,tested:8192});dense.push(z(d.x,d.y,0));assert.equal(closeOnly(grid(dense),d).occupied,false);
assert.equal(closeOnly(grid([z(d.x,d.y,1,0,false)]),d).occupied,true);
const tangent={x:0,y:0,w:.5,h:3.5};assert.equal(closeOnly(grid([z(.25+F[6],0,1,6)]),tangent).occupied,false);assert.equal(closeOnly(grid([z(.25+F[6]-.000001,0,1,6)]),tangent).occupied,true);
let s=0x73129;function rand(){s=(Math.imul(s,1664525)+1013904223)>>>0;return s/2**32;}
for(let i=0;i<4096;i++){const x=f(rand()*192-96),y=f(rand()*192-96),w=f(.25+rand()*4),h=f(.25+rand()*4);const d={x,y,w,h}, near=(c,width)=>c+(rand()-.5)*(width+2);
const a=Array.from({length:i%6+1},()=>z(near(x,w),near(y,h),rand()>.1?1:0,Math.floor(rand()*7),rand()>.4));const oracle=a.some(q=>active(q,d));assert.equal(closeOnly(grid(a),d).occupied,oracle,`fixture ${i}`);}
console.log('Two ordered misses, full 8192 empty chain, strict edge and sleeper checks, plus 4096 oracle scenarios pass.');
