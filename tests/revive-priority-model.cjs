'use strict';
// Ordered production medical/selection fragments followed by the complete buddy updater.
const vm=require('node:vm'),assert=require('node:assert/strict');
const base=require('./buddy-heal-model.cjs'),{html,fragment,v,vn,clone}=base;
const scalar=s=>s.replace(/\b(\d+)u\b/g,'$1').replace(/\bvar\b/g,'let');
function range(a,b){const i=html.indexOf(a),j=html.indexOf(b,i);assert(i>=0&&j>i,a);return html.slice(i,j);}
const prerequisites=range(' let ready=S.flags12.w==0.0',' let shove=ready');
const medicalRaw=range(' let moving=length(u.inputMove.xy)>.08;',' let shoot=ready');
const medical=scalar(medicalRaw).replace('safe2(a.p.xz-S.pos.xz)','safe2(sub(a.p.xz,S.pos.xz))').replace('S.pos.xz+u.aim.xy','add(S.pos.xz,u.aim.xy)');
const selectionRaw=range(' var nearestRevive20=',' sourceInteractHold20(dt);');
const edgeExpression='length(max(abs(S.pos.xz-door.p.xz)-door.aux.xz*.5-vec2f(7.0/64.0),vec2f(0)))';
const selection=scalar(selectionRaw).replace(edgeExpression,'doorEdge');
function fn(n){const s=fragment(html,'fn '+n+'('),i=s.indexOf('{');return scalar(s.slice(0,i).replace(/^fn /,'function ').replace(/:[\w<>]+/g,'').replace(/->[\w<>]+/g,'')+s.slice(i));}
function make({chapter=1,patient=0,dt=1/60}={}){
 const c=base.make({patient:'human',dt});
 for(const k of ['heal12','gear12','reload12','equipAck12','cell','objectivePoint','mission5','motion','look','anim8'])c.S[k]=v(0);
 c.S.pos=v(0,.35,0,40);c.S.player7=v(0);c.S.heal12=v(0,-1,40,0);c.S.items12=v(0,0,1,100);c.S.gear12=v(5,0,0,0);c.S.rules7=v(0);c.S.squad7.y=-1;
 for(let id=0;id<3;id++){const a=c.S.team7[id];a.p=v(id===patient?.5:8+id,.35,0,id===patient?0:100);a.memory=v(-1,0,0,a.p.w);a.ai=v(0,0,-1,1e9);a.plan=v(0,1,0,0);a.vital=v(0,0,1,0);c.S.botLife13[id]=v(id===patient?40:0,0,id===patient?1:0,0);}
 c.S.buddy=clone(c.S.team7[0].p);c.S.rescue.z=1;c.S.journey7.x=1;c.u.run=v(chapter,0);c.u.config=v(0,0,1);c.u.controls=v(1);c.u.inputMove=v(0,0,1,0);c.u.input12=v(0);c.u.controlEdges12=v(0);c.u.aim=vn(2,1,0);c.u.goals=v(100);c.S.goal=v(0);
 c.P=[{p:v(100,1,100,9),data:v(1000000,0),aux:v(.3,2,2)}];c.gate=0;c.finalDoor=0;c.gateDone=true;c.alarmActive18=false;c.inside=false;c.doorEdge=100;c.clear=true;c.threat=0;
 c.sub=(a,b)=>vn(a.dim||2,...a.map((n,i)=>n-b[i]));c.safe2=a=>{const n=Math.hypot(a.x,a.y);return vn(2,n?a.x/n:0,n?a.y/n:0);};
 c.wallRay=(p,d,n)=>c.clear?n:0;c.clearSegment7=()=>c.clear;c.threatNear7=p=>typeof c.threat==='function'?c.threat(p):c.threat;c.safeHouse13=()=>c.inside;c.interactAt=()=>false;
 c.phase=[];vm.runInContext(fn('settleGear12')+'\nfunction beginMedical(){let dt=u.clock.x;let down=S.player7.x>0;'+scalar(prerequisites)+medical+'}\nfunction missionSelection(){S.mission5.y=0;S.mission5.z=-1;S.objectivePoint.w=999;'+selection+'}',c);
 c.step=(dt=c.u.clock.x)=>{c.u.clock.x=dt;if(dt<=0||c.S.goal.w>0||c.S.chooser.x>.5)return;c.phase=[];c.beginMedical();c.phase.push('begin');c.missionSelection();c.phase.push('mission');c.update();c.phase.push('buddy');};
 return c;
}
module.exports={...base,make,medicalRaw,selectionRaw,prerequisites};
