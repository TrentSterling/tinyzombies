"""Native WebGPU parity probe: python -m pip install wgpu==0.33.0; python tests/mesh-dirty-chunks.py."""
from collections import Counter
import json
from pathlib import Path
import struct
import subprocess
import wgpu

root = Path(__file__).resolve().parent.parent
source = subprocess.check_output(["node", "-e", r"""
const fs=require('fs'),vm=require('vm');
const h=fs.readFileSync('index.html','utf8');
const js=h.slice(h.indexOf('<script>')+8,h.lastIndexOf('</script>'));
const end=js.lastIndexOf('if(NET_JOIN65)joinOnline65(');
const p=new Proxy(()=>p,{get:(_,k)=>k===Symbol.toPrimitive?()=>0:p});
const gl=vm.createContext({console,URLSearchParams,location:{search:''},
 window:{addEventListener(){}},document:p,performance,atob,btoa,navigator:{},addEventListener(){}});
const dirty=js.match(/^fn dirtyAt\(.*$/m)[0];
gl.testDirty=dirty;
vm.runInContext(js.slice(0,end)+`
 console.log(JSON.stringify({clear:meshResetShader,mesh:meshShader,chunks:CHUNK_COUNT,
 dirty:COMMON+'@group(0) @binding(1) var<storage,read_write> Ch:array<atomic<u32>>;\\n'+testDirty+'\\n'+
 '@compute @workgroup_size(1) fn mark(){dirtyAt(vec3f(15.5/4.0-96.0,0.375,8.5/4.0-96.0));}'}));`,gl);
"""], cwd=root, text=True)
code = json.loads(source)
count = code["chunks"]
assert count == 48 * 48
adapter = wgpu.gpu.request_adapter_sync()
device = adapter.request_device_sync()
usage = wgpu.BufferUsage
queue = device.queue
u32 = lambda *xs: struct.pack(f"<{len(xs)}I", *xs)


def make(words, extra=0):
    return device.create_buffer(size=words*4, usage=usage.STORAGE | usage.COPY_SRC | usage.COPY_DST | extra)


def compute(key, entry):
    mod = device.create_shader_module(code=code[key])
    return device.create_compute_pipeline(layout='auto', compute={"module": mod, "entry_point": entry})


def group(p, *buffers):
    return device.create_bind_group(layout=p.get_bind_group_layout(0),
                                    entries=[{"binding": i+1, "resource": {"buffer": b}} for i,b in enumerate(buffers)])


def read(b, start, n):
    return struct.unpack(f"<{n}I", queue.read_buffer(b, start*4, n*4))


def dispatch(enc, pipeline, binding, x=None):
    work = enc.begin_compute_pass()
    work.set_pipeline(pipeline)
    work.set_bind_group(0,binding)
    if x is not None:
        work.dispatch_workgroups(x)
    else:
        work.dispatch_workgroups_indirect(args, 0)
    work.end()


left, right, remote = 0, 1, count-1
ch, counters, indices, args = make(count*4), make(128), make(count), make(3, usage.INDIRECT)
occ, cache = make(count+3*3072), make(36)
clear, mesh, mark = compute("clear","reset"),compute("mesh","mesh"),compute("dirty","mark")
clear_bg, mesh_bg, mark_bg = group(clear,ch,counters,indices,args,occ),group(mesh,occ,ch,cache,counters,indices),group(mark,ch)
data=[0]*(count*4)
for i, c in enumerate([left,right,remote]):
    data[c*4:c*4+4]=[1,0,0,i*6]
data[2*4]=1  # a dirty chunk with no page: reset its counters but do not dispatch mesh
queue.write_buffer(ch,0,u32(*data))
queue.write_buffer(args,0,u32(0,1,1))
for c,page,x,id_ in [(left,1,15,1),(right,2,0,2),(remote,3,12,3)]:
    queue.write_buffer(occ,c*4,u32(page))
    queue.write_buffer(occ,(count+(page-1)*3072 + 256+8*16+x)*4,u32(id_))


def tick(*, damage=False, remesh=True):
    enc=device.create_command_encoder()
    if damage:
        dispatch(enc,mark,mark_bg,1)
    enc.clear_buffer(args,0,4)
    dispatch(enc,clear,clear_bg,(count+63)//64)
    if remesh:
        dispatch(enc,mesh,mesh_bg)
    queue.submit([enc.finish()])
    n,y,z=read(args,0,3)
    assert (y,z)==(1,1)
    return set(read(indices,0,n)) if n else set()


def faces(chunk):
    _,n,_,base=read(ch,chunk*4,4)
    if not n:
        return Counter()
    values=read(cache,2*base,2*n)
    return Counter(zip(values[::2], values[1::2]))


assert tick()=={left,right,remote}
assert read(counters,30,1)==(4,)
assert faces(left)==Counter((0,f) for f in range(6) if f!=2)
assert faces(right)==Counter((1,f) for f in range(6) if f!=3)
remote_faces=faces(remote)
assert remote_faces==Counter((2,f) for f in range(6))
assert tick()==set()
assert read(ch,2,1)==(0,) and read(counters,30,1)==(4,)

queue.write_buffer(occ,(count + 256+8*16+15)*4,u32(0))
assert tick(damage=True)=={left,right}
assert faces(left)==Counter()
assert faces(right)==Counter((1,f) for f in range(6))
assert faces(remote)==remote_faces
assert tick()==set()

# All chunks can be marked on initial boot; test the full list capacity independently.
queue.write_buffer(ch,0,u32(*([1,0,0,0]*count)))
queue.write_buffer(occ,0,u32(*([1]*count)))
assert tick(remesh=False)==set(range(count))
assert read(args,0,3)==(count,1,1)
assert tick(remesh=False)==set()
print("PASS: exact WGSL on", adapter.info["device"], "- starting cache, idle no-op, wall seam, distant cache, full list bound")
