'use strict';
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function loadHost(file,{seed=73129,storage,storageThrows=false}={}){
 const bytes=fs.readFileSync(file),html=bytes.toString('utf8'),script=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
 assert.equal(script.split('main().catch(fail);').length,2);new vm.Script(script);
 const values=storage||new Map(),events=new Map(),canvasEvents=new Map(),writes=new Map(),commands=[];
 const canvas={addEventListener(n,f){canvasEvents.set(n,f)},getBoundingClientRect(){return{left:0,top:0,width:1280,height:720}},focus(){}};
 const blocked=name=>()=>{throw Error('Forbidden CPU-test capability: '+name)};
 const c={console,URLSearchParams,location:{search:'?seed='+seed},document:{getElementById(){return canvas},addEventListener(){}},addEventListener(n,f){events.set(n,f)},atob:s=>Buffer.from(s,'base64').toString('binary'),localStorage:{getItem(k){if(storageThrows)throw Error('Storage disabled');return values.get(k)??null},setItem(k,v){if(storageThrows)throw Error('Storage disabled');values.set(k,String(v))},removeItem(k){if(storageThrows)throw Error('Storage disabled');values.delete(k)}},innerWidth:1280,innerHeight:720,requestAnimationFrame:blocked('animation frame'),fetch:blocked('network'),navigator:{gpu:{requestAdapter:blocked('WebGPU')}},performance:{now:()=>0}};c.window=c;vm.createContext(c);vm.runInContext(script.replace('main().catch(fail);',''),c);
 const run=code=>vm.runInContext(code,c),json=code=>JSON.parse(run('JSON.stringify('+code+')'));
 c.__fakeDevice={
  queue:{writeBuffer(b,offset,data){assert(b?.name,'Unnamed mocked buffer');const arr=ArrayBuffer.isView(data)?new Uint8Array(data.buffer,data.byteOffset,data.byteLength):new Uint8Array(data);commands.push({op:'write',buffer:b.name,offset,bytes:arr.byteLength});if(b.name==='S'||b.name==='U')writes.set(b.name,Buffer.from(arr));},submit(){commands.push({op:'submit-not-executed'})}},
  createCommandEncoder(){return{clearBuffer(b){commands.push({op:'clear',buffer:b.name})},beginComputePass({label}){return{setPipeline(){},setBindGroup(){},dispatchWorkgroups(count){commands.push({op:'dispatch-not-executed',label,count})},end(){}}},finish(){return{}}};}
 };
 run('device=__fakeDevice;width=1280;height=720;');
 for(const n of ['zA','zB','W','O','Props','Groups','Chunks','Fracture','S','U','C','pA','pB','Paint','WP','zHeads','pHeads','NavA','NavB','uiUniform'])run(n+'={name:'+JSON.stringify(n)+'};');
 run('bindInput();');
 const transition=script.split('\n').find(l=>l.includes('if(seedRequested){world=makeWorld();'))?.trim(),resetPending=script.split('\n').find(l=>l.includes('if(resetRequested){reset();resetRequested=false;}'))?.trim();assert(transition&&resetPending);
 return {html,script,sha256:sha(bytes),run,json,values,events,commands,writes,sources:c.__TINY_SOURCES__,transition,resetPending,key(code){events.get('keydown')({code,repeat:false,preventDefault(){}});events.get('keyup')({code,preventDefault(){}})},advanceFrameHost(){run(transition);run(resetPending)},state(){const b=writes.get('S');assert(b);return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength))},meta(){return json('({stage,runSeed,carryMods,upgrades,savedCheckpoint,settings,resetRequested,seedRequested,advanceRequested,notes:diagnostics.notes})')}};
}
module.exports={loadHost,sha};
