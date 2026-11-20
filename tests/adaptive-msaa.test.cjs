const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const html=fs.readFileSync(process.env.TINY_TEST_HTML||require('node:path').join(__dirname,'../index.html'),'utf8');
const section=(from,to)=>{const a=html.indexOf(from),b=html.indexOf(to,a);assert.ok(a>=0&&b>a,from);return html.slice(a,b);};
const quality=section('const QUALITY_TIERS25=','let sampleBuffer,tsQuery');
const targets=section('function sizeTargets(){','// V9: rasterized');
const draw=section(" {\r\n  const ms=renderSamples25===4"," {\r\n  const aimTarget=context.getCurrentTexture()");
function fixture(){
 const calls=[],scopes=[],passes=[],throws={};
 let scopeOpen=false;
 const c=vm.createContext({params:new URLSearchParams(),window:{innerWidth:1280,innerHeight:720},canvas:{},settings:{started:true,paused:false},time:5,fps:30,stopped:false,diagnostics:{notes:[]},calls,Boxes:'Boxes',Faces:'Faces',U:0,S:0,Paint:0,shadowTexture:{},shadowSampler:{},Lights:0,LightTiles:0,
  renderPipeline:{samples:4},facePipeline:{samples:4},vBuffer:0,drawArgs:0,faceArgs:0,postPipeline:null,linearSampler:0,uiUniform:0,
  world:{generators:[],start:[],exit:[]},GPUTextureUsage:{RENDER_ATTACHMENT:1,TEXTURE_BINDING:2},
  bg(p,entries){if(throws.binding&&entries[2]?.[1]==='Faces'){throws.binding=false;throw Error('mock bind throw');}return {p,entries};},
  device:{
   createRenderPipelineAsync(desc){const task={desc};calls.push(task);return new Promise((resolve,reject)=>Object.assign(task,{resolve:()=>resolve({samples:desc.multisample.count}),reject}));},
   createTexture(desc){return {createView:()=>({samples:desc.sampleCount??1}),destroy(){}};},
   pushErrorScope(kind){assert.equal(scopeOpen,false);scopeOpen=true;scopes.push({kind});},
   popErrorScope(){assert.equal(scopeOpen,true);scopeOpen=false;const scope=scopes.at(-1);return new Promise(resolve=>scope.resolve=resolve);},
   queue:{writeBuffer(){}},
  },
  enc:{beginRenderPass(desc){const color=desc.colorAttachments[0],sample=color.view.samples;assert.equal(desc.depthStencilAttachment.view.samples,sample);assert.equal(!!color.resolveTarget,sample===4);passes.push(sample);
   let pipeline;return {setPipeline(p){assert.ok(p,'missing pipeline');assert.equal(p.samples,sample);pipeline=p;},setBindGroup(_,bg){assert.ok(bg,'missing bind group');assert.equal(bg.p,pipeline);},setVertexBuffer(){},drawIndirect(){},end(){}};
  }}
 });
 const run=s=>vm.runInContext(s,c);
 run(quality+targets+'renderBG={p:renderPipeline};faceBG={p:facePipeline};applyQualityTier25(0,false);');
 const flush=async()=>{for(let i=0;i<16;i++)await Promise.resolve();};
 const tier=t=>run('applyQualityTier25('+t+')');
 const governor=seconds=>run('qualityGovernor25('+seconds+')');
 const render=()=>{run('sizeTargets();'+draw);return passes.at(-1);};
 const status=()=>JSON.parse(JSON.stringify(c.diagnostics.quality));
 const resolve=async i=>{assert.ok(calls[i]);calls[i].resolve();await flush();};
 const reject=async i=>{assert.ok(calls[i]);calls[i].reject(Error('mock compile failure'));await flush();};
 const validation=async (err=null)=>{assert.ok(scopes.at(-1));scopes.at(-1).resolve(err);await flush();};
 const notPublished=()=>assert.equal(run('!!(renderPipeline1||facePipeline1||renderBG1||faceBG1)'),false);
 return {run,flush,tier,governor,render,status,calls,scopes,resolve,reject,validation,notPublished,throws,c};
}
test('delayed second pipeline and validation keep drawing 4x until complete',async()=>{
 const f=fixture();assert.equal(f.render(),4);f.governor(3.5);await f.resolve(0);
 f.governor(6.5);await f.flush();assert.equal(f.calls.length,2);assert.equal(f.render(),4);f.notPublished();
 assert.deepEqual(f.status(),{tier:2,scale:.8,msaa:1,actualMsaa:4,locked:false});
 await f.resolve(1);assert.equal(f.render(),4);f.notPublished();await f.validation();
 assert.equal(f.render(),1);assert.equal(f.status().actualMsaa,1);assert.equal(f.render(),1);
});
test('delayed first pipeline deduplicates a second governor downgrade',async()=>{
 const f=fixture();f.governor(3.5);f.governor(6.5);assert.equal(f.calls.length,1);assert.equal(f.render(),4);
 await f.resolve(0);await f.resolve(1);await f.validation();assert.equal(f.render(),1);
 assert.deepEqual(f.calls.map(x=>x.desc.vertex.entryPoint),['vs','faceVS']);
});
for(const error of ['pipeline','binding throw','binding validation'])test(error+' keeps active 4x and permits one clean retry on next downgrade',async()=>{
 const f=fixture();f.governor(3.5);await f.resolve(0);
 if(error==='pipeline')await f.reject(1);
 else {if(error==='binding throw')f.throws.binding=true;await f.resolve(1);await f.validation(error==='binding validation'?{message:'mock invalid bind group'}:null);}
 assert.equal(f.render(),4);f.notPublished();assert.equal(f.c.diagnostics.notes.length,1);assert.match(f.c.diagnostics.notes[0],/^1x pipeline:/);
 f.governor(6.5);assert.equal(f.calls.length,3);await f.resolve(2);await f.resolve(3);await f.validation();assert.equal(f.render(),1);
});
test('a request reverted to 4x during preparation remains 4x; cached 1x can be reused',async()=>{
 const f=fixture();f.tier(1);await f.resolve(0);f.tier(0);await f.resolve(1);await f.validation();assert.equal(f.render(),4);
 assert.deepEqual(f.status(),{tier:0,scale:1,msaa:4,actualMsaa:4,locked:false});
 f.tier(1);assert.equal(f.render(),1);assert.equal(f.status().actualMsaa,1);assert.equal(f.calls.length,2);
});
test('last-tier rejection leaves a usable 4x renderer without per-frame retries',async()=>{
 const f=fixture();f.tier(3);await f.reject(0);
 for(let i=0;i<8;i++){f.governor(6.5);assert.equal(f.render(),4);}
 assert.equal(f.calls.length,1);assert.equal(f.status().msaa,1);assert.equal(f.status().actualMsaa,4);
});
