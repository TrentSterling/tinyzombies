"""Compare compact vs full-grid face gathers using wgpu==0.33.0 and Node."""
from collections import Counter
import json
from pathlib import Path
import runpy
import struct
import subprocess
from tempfile import TemporaryDirectory

tools = runpy.run_path(str(Path(__file__).with_name("mesh-dirty-chunks.py")))
device, queue, usage, make, dispatch, read, u32, count = (
    tools[k] for k in ("device", "queue", "usage", "make", "dispatch", "read", "u32", "count")
)
root = Path(__file__).resolve().parent.parent
extract = r"""
const fs=require('fs'),vm=require('vm');
const h=fs.readFileSync('index.html','utf8');
const js=h.slice(h.indexOf('<script>')+8,h.lastIndexOf('</script>'));
const end=js.lastIndexOf('if(NET_JOIN65)joinOnline65(');
const p=new Proxy(()=>p,{get:(_,k)=>k===Symbol.toPrimitive?()=>0:p});
const c=vm.createContext({console,URLSearchParams,location:{search:process.argv[1]},
 window:{addEventListener(){}},document:p,performance,atob,btoa,navigator:{},addEventListener(){},Buffer,fs,
 dest:process.argv[2]});
vm.runInContext(js.slice(0,end)+`
 world=makeWorld();
 for(const k of ['occ','chunks','blocks','occupiedChunkIds'])
   fs.writeFileSync(dest+'/'+k,Buffer.from(world[k].buffer));
 const cameras=[[...world.start,17,10], [...world.exit,25,16],[0,0,38,20]];
 const views=cameras.map(([x,z,hw,hh])=>({x,z,vp:Array.from(mul(ortho(-hw,hw,-hh,hh,.1,100),view)),hw,hh}));
 let hit=null;
 for(let i=0;i<world.count;i++){
   const v=world.blocks.subarray(i*8,i*8+8),x=Math.floor((v[0]+96)*4),y=Math.floor(v[1]*4),z=Math.floor((v[2]+96)*4);
   if(x%16!==15||x>=767||v[3]>=1000000)continue;
   const a=occAddress(x+1,y,z,world.occ);if(a>=0&&world.occ[a]){hit={x:v[0],z:v[2],at:v[5],i};break;}
 }
 console.log(JSON.stringify({faces:faceBuildShader,finish:faceFinalizeShader,limit:MAX_FACES,
    capacity:FACE_CACHE_CAP,maxPages:MAX_PAGES,worldMax:MAX_WORLD,views,hit}));`,c);
"""


def pipeline(source, entry):
    module = device.create_shader_module(code=source)
    return device.create_compute_pipeline(layout="auto", compute={"module":module,"entry_point":entry})


def bind(p, *pairs):
    return device.create_bind_group(layout=p.get_bind_group_layout(0),
        entries=[{"binding":i,"resource":{"buffer":b}} for i,b in pairs])


def data_buffer(data):
    b=make(len(data)//4)
    queue.write_buffer(b,0,data)
    return b


uniform=device.create_buffer(size=400,usage=usage.UNIFORM|usage.COPY_DST)
state=make(4820)
counter=tools["counters"]
dirty,args=tools["indices"],tools["args"]
collector,mesh=tools["clear"],tools["mesh"]
pagebuf=None
for search in ("?seed=73129", "?deadends&seed=73129", "?seed=73130"):
    with TemporaryDirectory() as d:
        cfg=json.loads(subprocess.check_output(["node","-e",extract,search,d],cwd=root,text=True))
        def content(k):
            return (Path(d)/k).read_bytes()
        occ,chunks,blocks=(data_buffer(content(k)) for k in ("occ","chunks","blocks"))
        page_data=content("occupiedChunkIds")
        occ_words=struct.unpack_from(f"<{count}I",content("occ"))
        if pagebuf is None:
            pagebuf=make(cfg["maxPages"])
        queue.write_buffer(pagebuf,0,page_data)
    active=len(page_data)//4
    assert struct.unpack(f"<{active}I",page_data)==tuple(i for i,n in enumerate(occ_words) if n)
    paint,cache,output,indirect=make(cfg["worldMax"]*2),make(cfg["capacity"]*2),make(cfg["limit"]*12),make(4)
    compact=cfg["faces"]
    old_binding="@group(0) @binding(8) var<storage,read> Occupied:array<u32>;"
    old_index="let chunk=Occupied[wg.x];"
    assert compact.count(old_binding)==compact.count(old_index)==1
    baseline=compact.replace(old_binding,"").replace(old_index,"let chunk=wg.x;if(chunk>=CHUNKS){return;}")
    b,c,finish=pipeline(baseline,"build"),pipeline(compact,"build"),pipeline(cfg["finish"],"finish")
    fd=bind(finish,(1,counter),(2,indirect))
    bindings=list(enumerate((uniform,state,counter,chunks,cache,blocks,paint,output)))
    bg_old,bg_new=bind(b,*bindings),bind(c,*bindings,(8,pagebuf))

    def remesh():
        enc=device.create_command_encoder()
        enc.clear_buffer(args,0,4)
        dispatch(enc,collector,tools["group"](collector,chunks,counter,dirty,args,occ),(count+63)//64)
        dispatch(enc,mesh,tools["group"](mesh,occ,chunks,cache,counter,dirty))
        queue.submit([enc.finish()])

    def gather(shader, binding, n):
        enc=device.create_command_encoder()
        enc.clear_buffer(counter,19*4,4)
        dispatch(enc,shader,binding,n)
        dispatch(enc,finish,fd,1)
        queue.submit([enc.finish()])
        draw=read(indirect,0,4)
        size=draw[1]
        assert 0<size<cfg["limit"]
        raw=queue.read_buffer(output,0,size*48).tobytes()
        return draw,Counter(raw[i:i+48] for i in range(0,len(raw),48))

    def check(v, age):
        u=[0.0]*100
        u[:16]=v["vp"]
        u[48:52]=[1366,768,v["hw"],v["hh"]]
        queue.write_buffer(uniform,0,struct.pack("<100f",*u))
        queue.write_buffer(state,0,struct.pack("<4f",v["x"],0,v["z"],100))
        queue.write_buffer(state,24*4,struct.pack("<f",age))
        a,both=gather(b,bg_old,count),gather(c,bg_new,active)
        assert a==both
        return a

    remesh()
    for v in cfg["views"]:
        assert check(v,0)[0][0]==6
    hit=cfg["hit"]
    if hit:
        v={**cfg["views"][2],"x":hit["x"],"z":hit["z"]}
        clean=check(v,0)
        # Scorch and blood are read by the unchanged gather at a visibly exposed voxel.
        queue.write_buffer(paint,0,u32(*([220]*cfg["worldMax"])))
        painted=check(v,0)
        assert clean!=painted
        assert painted!=check(v,45)
        before=check(v,45)
        posx,posz=(int((hit[k]+96)//4) for k in ("x","z"))
        for x,z in ((posx,posz),(posx-1,posz),(posx+1,posz),(posx,posz-1),(posx,posz+1)):
            if 0<=x<48 and 0<=z<48:
                queue.write_buffer(chunks,(x+48*z)*16,u32(1))
        queue.write_buffer(occ,hit["at"]*4,u32(0))
        queue.write_buffer(blocks,(hit["i"]*8+3)*4,u32(0))
        remesh()
        assert before!=check(v,45)
    print(f"PASS {search}: {count} -> {active} gather groups; matching face/draw records across cameras"+(", blood aging and seam removal" if hit else ""))
