(async()=>{
 const source=__TINY_SOURCES__.aim3,prefix=source.slice(0,source.lastIndexOf('@compute'));
 const code=prefix+`
@group(0) @binding(9) var<storage,read_write> Probe:array<vec4f>;
@compute @workgroup_size(64) fn poseProbe(@builtin(global_invocation_id) gid:vec3u){
 let i=gid.x;if(i>=168u){return;}let facing=i/42u;var z=Z[0];z.p=vec4f(0,0,-10,1);
 if(facing==1u){z.p=vec4f(-10,0,0,1);}if(facing==2u){z.p=vec4f(0,0,10,1);}if(facing==3u){z.p=vec4f(10,0,0,1);}
 z.v=vec4f(0);z.extraData=vec4f(0,0,u.aim.w,0);let a=ART_BOX6[ART_RANGE6[4u].x+i%42u];
 let p=vec3f(a.p.x,.32-a.p.z,a.p.y-.50);let origin=z.p.xyz+rotPart(p,S.pos.xz-z.p.xz)+vec3f(0,2,0);
 let hit=zombie3(origin,vec3f(0,-1,0),z,0u,10);Probe[i]=vec4f(hit.t,f32(hit.kind),f32(hit.id),0);
}`;
 const module=device.createShaderModule({code}),messages=(await module.getCompilationInfo()).messages.filter(m=>m.type==='error');
 if(messages.length)throw Error(messages.map(m=>m.message).join('\n'));
 const pipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'poseProbe'}});
 const output=device.createBuffer({size:168*16,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC});
 const s=new Float32Array(await readBuffer(S));s[0]=s[2]=0;device.queue.writeBuffer(S,0,s);updateUniforms(0);uniformData[43]=4;device.queue.writeBuffer(U,0,uniformData);
 const binding=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:U}},{binding:1,resource:{buffer:S}},{binding:3,resource:{buffer:zA}},{binding:9,resource:{buffer:output}}]});
 const e=device.createCommandEncoder(),pass=e.beginComputePass();pass.setPipeline(pipeline);pass.setBindGroup(0,binding);pass.dispatchWorkgroups(3);pass.end();device.queue.submit([e.finish()]);
 const r=new Float32Array(await readBuffer(output));output.destroy();const rows=Array.from({length:168},(_,i)=>({facing:Math.floor(i/42),part:i%42,t:r[i*4],kind:r[i*4+1]}));
 return {rows,hits:rows.filter(r=>r.kind===3).length,total:rows.length};
})()
