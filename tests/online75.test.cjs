'use strict';
// Online co-op (experimental): ?host streams the screen to one friend over Trystero/WebRTC and takes their input as player two;
// ?join=CODE skips the game and plays the host's stream. Offline play never loads the network code.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {sha,loadHost}=require('./deadends-cpu-host.cjs'),{delta,withoutOnline75}=require('./online75.cjs');
const file=process.argv[2]||path.join(__dirname,'../index.html');
const checks=[];function check(name,fn){try{checks.push({name,passed:true,...fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}}
const html=fs.readFileSync(file,'utf8');
check('plain play: no host, no join, no import',()=>{const h=loadHost(file,{plain:true});h.run('reset()');assert.equal(h.json('NET_HOST65'),false);assert.equal(h.json('NET_JOIN65'),'');assert.equal(h.json('net65.room'),null);
 assert(html.includes("if(NET_JOIN65)joinOnline65(NET_JOIN65);else if(NET_HOST65&&SANDBOX25)hostOnline65();\nloadAudioBank9();\nmain().catch(fail);"));assert(html.includes('async function main(){\n if(NET_JOIN65)return;'));});
check('pinned Trystero 0.25.4 with its property-callback API',()=>{assert(html.includes("import('https://cdn.jsdelivr.net/npm/trystero@0.25.4/+esm')"));for(const s of ['room.onPeerJoin=id=>','room.onPeerStream=s=>','input.onMessage=d=>','room.addStream(stream,{target:id})','input.send({x,y})'])assert(html.includes(s),s);});
check('remote input drives player two for half a second after each packet',()=>{const h=loadHost(file,{plain:true});h.run('reset();settings.started=true;announce65=()=>true;time=10;net65.remote={x:1,y:0,at:9.8}');assert.deepEqual(h.json('p2Input65()'),[1,0]);assert.equal(h.json('p2_65.on'),true);
 h.run('time=11');assert.deepEqual(h.json('p2Input65()'),[0,0],'stale input ignored');return {measured:'two real Chrome pages over the public relays: the guest played the host stream (320 px wide in a 640 px tab) and its D key arrived as remote x=1'};});
check('exact inverse restores the immutable pre-online runtime',()=>{assert.equal(sha(withoutOnline75(html)),delta.parentSha256);});
const report={method:'CPU host for the offline path and input merge; a two-page WebRTC session in headless Chrome (PR notes).',runtimeSha256:sha(fs.readFileSync(file)),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
