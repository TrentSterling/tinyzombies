'use strict';
// Static harness contract and physical centerline checks only. Does not launch a browser.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const{makeModel}=require('./navigation-model.cjs');
const root=path.join(__dirname,'..'),html=path.join(root,'index.html'),dir=path.join(__dirname,'hardware');
const alarmRoute=fs.readFileSync(path.join(dir,'code-red-route.mjs'),'utf8');
const route=fs.readFileSync(path.join(dir,'deadends-route.mjs'),'utf8'),wrapper=fs.readFileSync(path.join(dir,'cdp-qa.mjs'),'utf8'),manifest=JSON.parse(fs.readFileSync(path.join(dir,'candidate.json')));
assert.equal(manifest.runtimeSha256,crypto.createHash('sha256').update(fs.readFileSync(html)).digest('hex'));
for(const bad of ['localStorage.setItem','localStorage.removeItem','writeBuffer(','settings.demo=','settings.practice=','__tiny.teleport','Input.insertText'])assert(!route.includes(bad)&&!wrapper.includes(bad)&&!alarmRoute.includes(bad),'Prohibited acceptance mutation: '+bad);
for(const required of ['priorWrapper?.passed','prior.burnoutPersistencePassed','raw!==prior.burnoutCheckpoint.raw','carryMatches(report.lastTrainEntry','s.raw===report.lastTrainCheckpoint.raw','report.powerHoldStart=await missionRead()','s.settings.zombies!==2048','riflePickupUsed&1)===0','riflePickupUsed&1)===1'])assert(route.includes(required),required);
assert(wrapper.includes('document.body?.innerText'));assert(wrapper.includes('while(!documentEpoch||!documentId)'));
const startupExpression=vm.runInNewContext(wrapper.match(/const state=([^;]+);/)[1]);assert.doesNotThrow(()=>vm.runInNewContext(startupExpression,{window:{},document:{body:null,querySelector:()=>null}}));
assert(wrapper.includes('await verifyDocument();};'));assert(wrapper.includes('report.initialSettings.zombies!==2048'));
const points=vm.runInNewContext(route.match(/const lastTrain=(\[.*?\]);/)[1]),m=makeModel(html,3);for(const i of [m.world.startDoor13,m.world.gate13,m.world.final13])m.openDoor(i);m.dynamic();let previous=m.world.start;
for(let i=0;i<points.length;i++){assert(!m.blocked(points[i][0],points[i][1]),'blocked waypoint '+i);assert(m.clear(previous,points[i],.025),'blocked segment '+i);previous=points[i];}
for(const required of ['priorWrapper.routeReportSha256!==digest','prior.lastTrainCheckpoint.save?.map!==3','localStorage.getItem(checkpointKey)','prior.lastTrainCheckpoint.raw','sameEntry(report.codeRedEntry,report.codeRedActiveRetry)','report.codeRedBoundary.stage!==5','r.released.holds[3]!==0','s.settings.zombies!==2048'])assert(alarmRoute.includes(required),required);
const hospitalPoints=vm.runInNewContext(alarmRoute.match(/const codeRed=(\[.*?\]);/)[1]),hospital=makeModel(html,4);for(const i of [hospital.world.startDoor13,hospital.world.gate13,hospital.world.final13])hospital.openDoor(i);hospital.dynamic();previous=hospital.world.start;
for(let i=0;i<hospitalPoints.length;i++){const target=hospitalPoints[i],distance=Math.hypot(target[0]-previous[0],target[1]-previous[1]),steps=Math.ceil(distance/.025);for(let j=0;j<=steps;j++){const t=steps?j/steps:0;assert(!hospital.blocked(previous[0]+(target[0]-previous[0])*t,previous[1]+(target[1]-previous[1])*t),'blocked hospital segment '+i);}previous=target;}
assert(wrapper.includes("routeMode==='code-red'?route.codeRedEntryPassed&&route.codeRedPersistencePassed&&route.alarmContractPassed"));
console.log(JSON.stringify({method:'Static harness privacy/contract plus CPU physical-centerline model. No browser, shader compilation or gameplay.',candidateSha256:manifest.runtimeSha256,lastTrainSegments:points.length,codeRedSegments:hospitalPoints.length,passed:true},null,2));
