"""Measure batch convergence of both packed navigation lanes using exact game WGSL."""
import hashlib
import json
from pathlib import Path
import struct
import subprocess
from tempfile import TemporaryDirectory
import wgpu

source_path=Path(__file__).resolve().parents[1] / "index.html"
node=r"""
const fs=require('fs'),vm=require('vm');
const h=fs.readFileSync(process.argv[1],'utf8');
const js=h.slice(h.indexOf('<script>')+8,h.lastIndexOf('</script>'));
const end=js.lastIndexOf('if(NET_JOIN65)joinOnline65(');
const p=new Proxy(()=>p,{get:(_,k)=>k===Symbol.toPrimitive?()=>0:p});
const c=vm.createContext({console,URLSearchParams,location:{search:process.argv[2]},
 window:{addEventListener(){}},document:p,performance,atob,btoa,navigator:{},addEventListener(){},Buffer,fs,
 dest:process.argv[3]});
vm.runInContext(js.slice(0,end)+`
 world=makeWorld();
 for(const k of ['occ','props','blocks'])fs.writeFileSync(dest+'/'+k,Buffer.from(world[k].buffer));
 console.log(JSON.stringify({common:COMMON,init:navInitShader,relax:navRelaxShader,publish:navPublishShader,
 dynamic:dynamicShader,check:navCheckShader,start:world.start,exit:world.exit,ward:world.buddy,civ:world.civilians30?.slice(0,12).map(c=>[c.x,c.z])||[],
 solid:world.count,propCount:world.propCount,nav:NAV_SIZE,offset:NAV_OFFSET,heard:PRESS_OFFSET,walk:WALK_OFFSET}));
`,c);"""
device=wgpu.gpu.request_adapter_sync().request_device_sync()
queue=device.queue
usage=wgpu.BufferUsage
storage=usage.STORAGE|usage.COPY_DST|usage.COPY_SRC
f32=lambda *v:struct.pack(f'<{len(v)}f',*v)
u32=lambda *v:struct.pack(f'<{len(v)}I',*v)

def buffer(size,flags=storage,data=None):
    b=device.create_buffer(size=size,usage=flags)
    if data is not None: queue.write_buffer(b,0,data)
    return b

def pipeline(s,entry):
    return device.create_compute_pipeline(layout='auto',compute={'module':device.create_shader_module(code=s),'entry_point':entry})

def bindings(p,*pairs):
    return device.create_bind_group(layout=p.get_bind_group_layout(0),
      entries=[{'binding':i,'resource':{'buffer':b}} for i,b in pairs])

def dispatch(enc,p,b,n):
    r=enc.begin_compute_pass()
    r.set_pipeline(p);r.set_bind_group(0,b);r.dispatch_workgroups(n);r.end()

for query in ('?seed=73129','?deadends&seed=73129'):
 with TemporaryDirectory() as d:
    cfg=json.loads(subprocess.check_output(['node','-e',node,str(source_path),query,d],text=True))
    raw,props,blocks=[(Path(d)/k).read_bytes() for k in ('occ','props','blocks')]
 n=cfg['nav'];groups=n//64
 o=buffer(len(raw),data=raw);state=buffer(4820*4);a=buffer(n*4);b=buffer(n*4);pr=buffer(len(props),data=props)
 uni=buffer(400,usage.UNIFORM|usage.COPY_DST)
 queue.write_buffer(uni,64*4,f32(cfg['solid'],cfg['propCount'],73129,0))
 ini,step,pub,dyn=[pipeline(cfg[k],e) for k,e in [('init','init'),('relax','relax'),('publish','publish'),('dynamic','update')]]
 seed_bg=bindings(ini,(1,state),(2,o),(3,a))
 nav_bg=(bindings(step,(1,o),(2,a),(3,b)),bindings(step,(1,o),(2,b),(3,a)))
 pub_bg=bindings(pub,(1,a),(2,o))
 check=pipeline(cfg['check'],'check')
 args=buffer(12,storage|usage.INDIRECT,data=u32(0,1,1))
 cb=bindings(check,(1,a),(2,b),(3,args))
 dyn_bg=bindings(dyn,(0,uni),(1,pr),(2,o))
 begin=cfg['start'];exit_=cfg['exit'];ward=cfg['ward']
 seam=None
 for i in range(cfg['solid']):
    x,y,z,hp,mat,addr,initial,group=struct.unpack_from('<8f',blocks,i*32)
    if hp<1e6 and (((int((x+96)*4))%16)==15) and addr>0:
        seam=(x,z,int(addr));break
 for scen in ('opening closed doors','split squad + noise','seam breach + noise'):
    queue.write_buffer(o,0,raw)
    if scen.startswith('seam') and seam: queue.write_buffer(o,seam[2]*4,u32(0))
    squad=[begin,exit_,ward] if scen!='opening closed doors' else [ward]
    noise=[exit_,[seam[0],seam[1]] if seam else ward] if scen!='opening closed doors' else []
    seed_src=cfg['common']+'\n@group(0) @binding(1) var<storage,read_write> S:State;\n@compute @workgroup_size(1) fn seed(){'
    seed_src+=f'S.pos=vec4f({float(begin[0])},0.0,{float(begin[1])},100.0);'
    for i,(x,z) in enumerate(squad):seed_src+=f'S.team7[{i}].p=vec4f({float(x)},0.0,{float(z)},100.0);S.team7[{i}].vital.z=1.0;'
    for i,(x,z) in enumerate(noise):seed_src+=f'S.noiseRing34[{i}]=vec4f({float(x)},{float(z)},3.0,20.0);'
    for i,pt in enumerate(cfg['civ']):
      if all(isinstance(q,(int,float)) for q in pt):
       x,z=pt;seed_src+=f'S.civ34[{i}]=vec4f({float(x)},{float(z)},1.0,0.0);'
    seed=pipeline(seed_src+'}','seed');sb=bindings(seed,(1,state))
    e=device.create_command_encoder();e.clear_buffer(state);dispatch(e,seed,sb,1)
    dispatch(e,dyn,dyn_bg,(cfg['propCount']+63)//64);dispatch(e,ini,seed_bg,groups);queue.submit([e.finish()])
    first=None;equal_snapshot=None
    for k in range(1,17):
        e=device.create_command_encoder()
        p=e.begin_compute_pass();p.set_pipeline(step)
        for i in range(32): p.set_bind_group(0,nav_bg[i%2]);p.dispatch_workgroups(groups)
        p.end();queue.submit([e.finish()])
        aa=queue.read_buffer(a).tobytes();bb=queue.read_buffer(b).tobytes()
        if aa==bb and first is None:
            first=k;equal_snapshot=aa
        if first is not None:assert aa==bb==equal_snapshot
    e=device.create_command_encoder();dispatch(e,pub,pub_bg,groups);queue.submit([e.finish()])
    low=queue.read_buffer(o,cfg['offset']*4,n*4)
    high=queue.read_buffer(o,cfg['heard']*4,n*4)
    sha=lambda b:hashlib.sha256(b).hexdigest()[:12]
    expect=(low.tobytes(),high.tobytes())
    e=device.create_command_encoder();dispatch(e,ini,seed_bg,groups);queue.submit([e.finish()])
    finished=[]
    for k in range(1,17):
        e=device.create_command_encoder()
        p=e.begin_compute_pass();p.set_pipeline(step)
        for i in range(32):
            p.set_bind_group(0,nav_bg[i%2])
            if k==1:p.dispatch_workgroups(groups)
            else:p.dispatch_workgroups_indirect(args,0)
        p.end()
        if k!=16:
            e.clear_buffer(args,0,4);dispatch(e,check,cb,groups)
        queue.submit([e.finish()])
        if k!=16:
            groups_next,y,z=struct.unpack('<3I',queue.read_buffer(args))
            assert (y,z)==(1,1)
            assert groups_next==(0 if first is not None and k>=first else groups)
            finished.append(groups_next==0)
    e=device.create_command_encoder();dispatch(e,pub,pub_bg,groups);queue.submit([e.finish()])
    actual=(queue.read_buffer(o,cfg['offset']*4,n*4).tobytes(),queue.read_buffer(o,cfg['heard']*4,n*4).tobytes())
    assert expect==actual
    print(query,scen,'first equal batch',first,'skipped',sum(finished),'published',sha(low),sha(high),flush=True)
# Negative control: an artificial one-cell serpentine stays nonconverged at 512 sweeps.
# Only the heard lane has a source here, checking that the high lane alone keeps work enabled.
f=192
walkable={(x,z) for z in range(0,12,2) for x in range(f)}
walkable.update((f-1 if z%4==1 else 0,z) for z in range(1,11,2))
walk=[]
for z in range(f):
 for x in range(f):
    walk.append((0 if (x,z) in walkable else 1) |
                (8 if (x,z) in walkable and (x+1,z) in walkable else 2) |
                (32 if (x,z) in walkable and (x,z+1) in walkable else 4))
queue.write_buffer(o,cfg['walk']*4,u32(*walk))
queue.write_buffer(a,0,u32(65535,*([0xffffffff]*(n-1))))
for k in range(16):
 e=device.create_command_encoder()
 p=e.begin_compute_pass();p.set_pipeline(step)
 for i in range(32):
    p.set_bind_group(0,nav_bg[i%2])
    if k==0:p.dispatch_workgroups(groups)
    else:p.dispatch_workgroups_indirect(args,0)
 p.end()
 e.clear_buffer(args,0,4);dispatch(e,check,cb,groups);queue.submit([e.finish()])
 assert struct.unpack('<3I',queue.read_buffer(args))==(groups,1,1)
aa=queue.read_buffer(a).tobytes();bb=queue.read_buffer(b).tobytes()
assert aa!=bb and aa[0::4]==bb[0::4] and aa[1::4]==bb[1::4]
print('PASS artificial winding route: heard lane alone keeps the full 512-sweep budget',flush=True)
