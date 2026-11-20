const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const html=fs.readFileSync(new URL('../index.html','file://'+__filename),'utf8');
const js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
const end=js.lastIndexOf('if(NET_JOIN65)joinOnline65(');
assert.ok(end>0);
async function boot(search,adaptive=false){
 const calls=[],steps=[],bindings=[];
 const proxy=new Proxy(()=>proxy,{get:(_,k)=>k===Symbol.toPrimitive?()=>0:k==='then'?undefined:proxy});
 const gpuDevice={createRenderPipelineAsync:async desc=>{calls.push([desc.vertex.entryPoint,desc.multisample?.count??1]);return desc;},
  createSampler:()=>proxy,createTexture:()=>proxy,addEventListener(){},lost:{then(){}},pushErrorScope(){},popErrorScope:async()=>null};
 const adapter={features:new Set(),requestDevice:()=>gpuDevice};
 const navigator={gpu:{requestAdapter:()=>adapter,getPreferredCanvasFormat:()=>'rgba8unorm'}};
 const ctx=vm.createContext({console,performance,URLSearchParams,location:{search},window:{addEventListener(){}},document:proxy,
  atob,btoa,navigator,addEventListener(){},proxy,calls,bindLog:bindings,steps,adaptive,
  GPUTextureUsage:{RENDER_ATTACHMENT:1,TEXTURE_BINDING:2}});
 const result=await vm.runInContext(js.slice(0,end)+`
 (async()=>{
  const stop=new Error('probe completed');
  createStartup93=expected=>({async run(key,label,work){
   if(key==='bindings')throw stop;
   steps.push(key);
   if(key==='adapter'||key==='device'||key.startsWith('render:')||key==='render-resources'||key==='low-quality')return work();
   return proxy;
  }});
  bg=(p,entries)=>{bindLog.push([p?.vertex?.entryPoint,p?.multisample?.count??1,entries.length]);return p;};
  try{await main();throw Error('startup unexpectedly continued');}catch(e){if(e!==stop)throw e;}
  const geometry=()=>[renderSamples25,
    (renderSamples25===1?renderBG1:renderBG)?.multisample?.count??1,
    (renderSamples25===1?faceBG1:faceBG)?.multisample?.count??1];
  const first=geometry(),firstCount=calls.length;
  if(adaptive){settings.started=true;time=5;fps=30;qualityGovernor25(3.5);for(let i=0;i<12;i++)await Promise.resolve();}
  return [first,firstCount,geometry()];
 })()`,ctx);
 return JSON.parse(JSON.stringify({calls,steps,bindings,result}));
}
for(const [search,samples] of [['',4],['?msaa=1',1],['?tier=1',1],['?tier=3',1],['?tier=2&msaa=4',4],['?q=.6',4]])
 test((search||'default')+' compiles and binds only the selected boot geometry pair',async()=>{
 const {calls,steps,bindings,result}=await boot(search);
 assert.equal(calls.length,6);
 assert.deepEqual(calls.slice(1,3),[['vs',samples],['faceVS',samples]]);
 assert.deepEqual(bindings.slice(0,2),[['vs',samples,8],['faceVS',samples,8]]);
 assert.deepEqual(result.slice(0,2),[[samples,samples,samples],6]);
 assert.equal(steps.includes('low-quality'),false);
 });
test('unlocked boot still builds both 1× geometry pipelines only when the governor drops quality',async()=>{
 const {calls,result}=await boot('',true);
 assert.deepEqual(result,[[4,4,4],6,[1,1,1]]);
 assert.deepEqual(calls.slice(6),[['vs',1],['faceVS',1]]);
});
