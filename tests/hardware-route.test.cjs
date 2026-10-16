'use strict';
// Static harness contract and physical centerline checks only. Does not launch a browser.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const{makeModel}=require('./navigation-model.cjs');
const root=path.join(__dirname,'..'),html=path.join(root,'index.html'),dir=path.join(__dirname,'hardware');
const route=fs.readFileSync(path.join(dir,'deadends-route.mjs'),'utf8'),wrapper=fs.readFileSync(path.join(dir,'cdp-qa.mjs'),'utf8'),manifest=JSON.parse(fs.readFileSync(path.join(dir,'candidate.json')));
assert.equal(manifest.runtimeSha256,crypto.createHash('sha256').update(fs.readFileSync(html)).digest('hex'));
for(const bad of ['localStorage.setItem','localStorage.removeItem','writeBuffer(','settings.demo=','settings.practice=','__tiny.teleport','Input.insertText'])assert(!route.includes(bad)&&!wrapper.includes(bad),'Prohibited acceptance mutation: '+bad);
for(const required of ['priorWrapper?.passed','prior.burnoutPersistencePassed','raw!==prior.burnoutCheckpoint.raw','carryMatches(report.lastTrainEntry','report.lastTrainCompletionRetry.raw===report.lastTrainCheckpoint.raw','report.powerHoldStart=await missionRead()','s.settings.zombies!==2048','riflePickupUsed&1)===0','riflePickupUsed&1)===1'])assert(route.includes(required),required);
assert(wrapper.includes('document.body?.innerText'));assert(wrapper.includes('while(!documentEpoch||!documentId)'));
const startupExpression=vm.runInNewContext(wrapper.match(/const state=([^;]+);/)[1]);assert.doesNotThrow(()=>vm.runInNewContext(startupExpression,{window:{},document:{body:null,querySelector:()=>null}}));
assert(wrapper.includes('await verifyDocument();};'));assert(wrapper.includes('report.initialSettings.zombies!==2048'));
const points=vm.runInNewContext(route.match(/const lastTrain=(\[.*?\]);/)[1]),m=makeModel(html,3);for(const i of [m.world.startDoor13,m.world.gate13,m.world.final13])m.openDoor(i);m.dynamic();let previous=m.world.start;
for(let i=0;i<points.length;i++){assert(!m.blocked(points[i][0],points[i][1]),'blocked waypoint '+i);assert(m.clear(previous,points[i],.025),'blocked segment '+i);previous=points[i];}
console.log(JSON.stringify({method:'Static harness privacy/contract plus CPU physical-centerline model. No browser, shader compilation or gameplay.',candidateSha256:manifest.runtimeSha256,segments:points.length,passed:true},null,2));
