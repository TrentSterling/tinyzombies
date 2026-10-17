'use strict';
// Exact mission fragments before the complete existing buddy CPU adapter.
// Geometry, threat and movement helpers remain controlled; this is not WGSL execution.
const vm=require('node:vm'),base=require('./buddy-heal-model.cjs');
const {html,fragment,v,clone}=base;
const scalar=s=>s.replace(/\b(\d+)u\b/g,'$1').replace(/\bvar\b/g,'let');
const helperRaw=html.includes('fn botReviveFirst23(')?fragment(html,'fn botReviveFirst23('):'';
const helperCode=scalar(helperRaw).replace(/^fn (\w+)\(([^)]*)\)->bool/,(_,n,p)=>'function '+n+'('+p.replace(/:\w+/g,'')+')');
const crankRaw=fragment(html,'if(u.run.x==1.0&&S.orders.x>.5&&S.order13.x==5.0)');
const fuelRaw=fragment(html,'if(u.run.x==2.0){for(var id=0u;id<3u;id++)');
const timerRaw=fragment(html,'if((u.run.x==2.0||u.run.x==3.0||u.run.x==5.0)&&S.relay.x>.5&&!gateDone)');
function make({chapter=1,id=0,dt=1/60}={}){
 const c=base.make({patient:'none',dt});c.u.run.x=chapter;
 c.S.pos=v(10,.35,0,100);c.S.player7=v(0);c.S.squad7.y=-1;
 c.S.chapter13=v(0);c.S.relay=v(0);c.S.alarm=v(0);c.S.orders=v(1,0,0,0);c.S.order13=v(5,0,id,0);
 for(let i=0;i<3;i++){const a=c.S.team7[i];a.p=v(i===id?0:20+i*5,.35,0,100);a.memory=v(-1,0,0,100);a.ai=v(7,0,-1,.2);a.plan=v(0,1,0,0);a.vital.x=0;c.S.botLife13[i]=v(0);c.S.botFuel15[i]=i===id?1:0;}
 c.S.buddy=clone(c.S.team7[0].p);c.P=[{data:v(1000000,1,0,0),p:v(0,1,0,9)}];c.waves=[];c.queueWave13=(...a)=>c.waves.push(a);
 vm.runInContext(helperCode+'\nfunction objectiveTick(){const dt=u.clock.x;'+scalar(crankRaw+fuelRaw)+'}\nfunction openingTick(){const dt=u.clock.x,gate=0,gateDone=P[gate].data.y<.5;'+scalar(timerRaw)+'}',c);
 return c;
}
function patient(c,id,{hp=0,down=40,dead=false,dragged=false,x=.5}={}){
 if(id<0){c.S.pos=v(x,.35,0,hp);c.S.player7.x=down;}
 else{const a=c.S.team7[id];a.p=v(x,.35,0,hp);a.memory.w=hp;c.S.botLife13[id]=v(down,dead?1:0,hp<=0?1:0,0);if(dragged)c.S.squad7.y=id;if(id===0)c.S.buddy=clone(a.p);}
}
function step(c,n=1,{buddy=false,timer=false}={}){for(let i=0;i<n;i++){if(c.u.clock.x<=0||c.S.goal.w>0||c.S.chooser.x>.5)continue;c.objectiveTick();if(timer)c.openingTick();if(buddy)c.update();}}
module.exports={...base,make,patient,step,helperRaw,crankRaw,fuelRaw,timerRaw};
