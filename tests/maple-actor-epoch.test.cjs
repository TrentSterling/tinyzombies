const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const html=fs.readFileSync(process.env.TINY_TEST_HTML||require('node:path').join(__dirname,'../index.html'),'utf8');
const section=(from,to)=>{const a=html.indexOf(from),b=html.indexOf(to,a);assert.ok(a>=0&&b>a,from);return html.slice(a,b);};
function fixture(){
 const warnings=[],copies=[],errors=[],writes=[];
 const proxy=new Proxy(()=>proxy,{get:(_,k)=>k===Symbol.toPrimitive?()=>0:k==='then'?undefined:proxy});
 const settings={started:true,muted:true,zombies:2,paused:false,lab:true};
 const draw={save(){},restore(){},beginPath(){},stroke(){},ellipse(){},moveTo(){},lineTo(){}};
 const gpu={queue:{writeBuffer(...args){writes.push(args)},submit(){}},createCommandEncoder(){return {clearBuffer(){},finish(){}}}};
 const c=vm.createContext({Float32Array,Uint32Array,settings,audio:{state:'running'},hud2d30:draw,hudScale30:1,screenPoint:(x,z)=>[x,z],text:s=>warnings.push(s),textWidth9:()=>0,COL9:{},SANDBOX25:true,SURFACE_FIRE107:false,params:new URLSearchParams(),diagnostics:{audio:{}},MAX_Z:2,ZOMBIE_FLOATS13:32,ZOMBIE_BYTES13:128,MAX_PROPS:2,now:0,runSeed:1,
  world:{start:[0,0],buddy:[0,0],cellPoint:[0,0],occupiedChunkIds:[],doors7:[],propCount:1,navSeed:[0],initialZ13:null},device:gpu,bindings:proxy,L7:{team7:128,squad7:530,rules7:534,journey7:538,pace7:542},L12:{gear:546,mag:550,reserve:554,items:558,heal:562},L13:{botMag:566,botReserve:578,botItems:590,botLife:602,botStamina:614},BALANCE94:{guns:[{clip:8,reserve:30},{clip:4,reserve:12},{clip:6,reserve:10}]},carryMods:[0,0,0,0],stage:6,
  W:'W',S:'S',O:'O',Props:'Props',Groups:'Groups',Chunks:'Chunks',Fracture:'Fracture',C:'C',pA:'pA',pB:'pB',Paint:'Paint',WP:'WP',zHeads:'zHeads',pHeads:'pHeads',NavA:'NavA',NavB:'NavB',zA:'zA',zB:'zB',
  NAV_SIZE:1,PRESS_OFFSET:2,CHUNK_COUNT:4,keys:new Set(),mouse:{},enc:{copyBufferToBuffer(...args){copies.push(args)}},
  GPUMapMode:{READ:1},resetAudio9(){},resetGear12(){},freshRiflesEnabled106:()=>false,applyCarry13(){},updateUniforms(){},fractureData8(){},pass(){},
  observeNeighbors103(){},syncGear12(){},saveBoundary13(){},updateAudioWorld9(){},impactTone7(){},sound(){},missionTone(){},fail:e=>errors.push(e),seedRequested:false,
  audioReadAt9:0,audioEpoch9:0,lastMasonry7:0,lastDoor7:0,nextPipeBeep:0,lastPipeExplosion:0,lastGrenadeExplosion:0,pendingPipeBomb:0,pendingGrenade:0,pendingDash:0,toolHint:'',toolHintUntil:0,pendingChoice:0,lastBannerSound:0,zParity:0,navPhase:0,last:0,time:0,nextSound:0,nextBoom:0,lastCritSound:0});
 let resolve, payload, props;let reads=[];
 c.sampleBuffer={mapAsync(){return new Promise(r=>resolve=r);},getMappedRange(offset,bytes){reads.push([offset,bytes]);if(offset===16896)return payload.buffer;if(offset===17152)return props.buffer;return new ArrayBuffer(bytes);},unmap(){}};
 const source=section('let counters=new Uint32Array(128)','\r\n')+'\n'+section('const AUDIO_VOICES9=','const audioHP9=')+section('function audioAllowed9(){','\r\n')+section('const director70=','\r\n')+section('function reset(){runEpoch16++','\r\nfunction ') + section('function specialsHUD96(k){','// Kill combo:');
 vm.runInContext(source,c);
 const dispatch=section(' let sample=false,audioSample=false,',' if(stampThisFrame){tsBusy=true;');
 const callback=section(' if(sample){const sampleEpoch16=runEpoch16;',' if(stampThisFrame){tsRead.mapAsync(');
 const flush=async()=>{for(let i=0;i<6;i++)await Promise.resolve();assert.deepEqual(errors,[]);};
 const get=(code)=>vm.runInContext(code,c);
 function queue(now){c.now=now;copies.length=0;get('(()=>{'+dispatch+callback+'})()');return copies.map(c=>c[4]);}
 async function deliver(data){reads=[];payload=data;props=new Float32Array(16);resolve();await flush();return reads;}
 function hud(){warnings.length=0;get('specialsHUD96(1)');return [...warnings];}
 function reset(){get('reset()');}
 return {get,queue,deliver,hud,reset,writes,c};
}
const hazards=()=>{const a=new Float32Array(64);a[3]=10;a[10]=3;a[22]=1;a[23]=1;a[24]=4;a[25]=4;a[35]=10;a[42]=2;a[51]=1;a[52]=1;return a;};
const both=['SPITTER: move out of the ring','BRUTE: sidestep the charge'];

test('muted Maple reset hides both cached warnings until an accepted fresh actor snapshot',async()=>{
 const f=fixture();assert.equal(f.get('audioAllowed9()'),false);assert.equal(f.get('director70.read'),true);f.reset();
 assert.deepEqual(f.queue(10),[512,16384,256,64]);await f.deliver(hazards());assert.deepEqual(f.hud(),both);
 assert.deepEqual(f.queue(150),[512,16384,256,64]);f.reset();assert.deepEqual(f.hud(),[]);
 assert.equal(f.get('audioZData9[3]'),10);assert.equal(f.get('audioZData9[35]'),10);
 assert.deepEqual(await f.deliver(hazards()),[]);assert.deepEqual(f.hud(),[]);
 assert.deepEqual(f.queue(230),[512,16384]);await f.deliver(hazards());assert.deepEqual(f.hud(),[]);
 assert.deepEqual(f.queue(320),[512,16384,256,64]);await f.deliver(hazards());assert.deepEqual(f.hud(),both);
 assert.deepEqual(f.queue(450),[512,16384,256,64]);await f.deliver(new Float32Array(64));assert.deepEqual(f.hud(),[]);
});

for(const flag of ['seedRequested','resetRequested'])test('late sample with pending '+flag+' cannot revive cached warnings',async()=>{
 const f=fixture();f.reset();f.queue(10);await f.deliver(hazards());assert.deepEqual(f.hud(),both);
 assert.deepEqual(f.queue(150),[512,16384,256,64]);f.get(flag+'=true');assert.deepEqual(await f.deliver(new Float32Array(64)),[]);f.get(flag+'=false');f.reset();
 assert.deepEqual(f.hud(),[]);assert.equal(f.get('audioZData9[3]'),10);
 assert.deepEqual(f.queue(300),[512,16384,256,64]);await f.deliver(hazards());assert.deepEqual(f.hud(),both);
});
