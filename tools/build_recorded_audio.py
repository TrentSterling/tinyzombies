"""Build the CC0 gameplay bank from preserved downloads; no network or GPU use.
Usage: python tools/build_recorded_audio.py ../recorded-sfx-sources
Requires numpy, scipy, soundfile. Source archives/whole takes stay outside git.
"""
import argparse, hashlib, json, math, os, pathlib
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

ROOT=pathlib.Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('source_directory');args=parser.parse_args()
SRC=pathlib.Path(os.path.normpath(os.path.join(os.getcwd(),args.source_directory)))
OUT=ROOT/'assets/audio'; OUT.mkdir(parents=True,exist_ok=True)
RATE=48000
receipts=json.loads((SRC/'sources.json').read_text())
previous=OUT/'manifest.json'
expected={(i['pack'],i['entry']):i['sourceSha256'] for c in json.loads(previous.read_text())['clips'] for i in c['layers']} if previous.exists() else {}
recipes=[]
def layer(pack,entry,cap,start=0,end=None,gain=1,offset=0):
 return dict(pack=pack,entry=entry,cap=cap,start=start,end=end,gain=gain,offset=offset)
def add(name,kind,*layers,target=.16): recipes.append(dict(id=name,kind=kind,layers=layers,target=target))
def gun(entry,start,cap): return layer('firearms','Prepared SFX Library/'+entry,cap,start,start+cap+.08)
for n,(entry,start) in enumerate([('AR-15/D_32P.wav',.67),('AR-15/D_32P.wav',5.61),('AR-15/D_24P.wav',.55),('AR-15/D_24P.wav',3.9)]):
 add(f'rifle-{n+1}','rifle',gun(entry,start,.19),target=.13)
for n,(entry,start) in enumerate([('Mossberg/N_26P.wav',.75),('Mossberg/N_26P.wav',4.54),('Nova/O_17P.wav',.66)]):
 add(f'shotgun-{n+1}','shotgun',gun(entry,start,.34),target=.16)
for n,i in enumerate([6,12,14]):
 add(f'hit-{n+1}','hit',layer('slime',f'slime_{i:02}.ogg',.25),layer('debris',f'bfh1_wood_hit_0{n+1}.ogg',.13,gain=.4),target=.18)
for n,(i,z) in enumerate([(1,5),(9,11),(15,24)]):
 add(f'death-{n+1}','death',layer('slime',f'slime_{i:02}.ogg',.48),layer('zombies',f'zombies/zombie-{z}.wav',.48,gain=.28,offset=.025),layer('debris',f'bfh1_wood_falling_0{n%2+1}.ogg',.33,gain=.35,offset=.035),target=.18)
for n,i in enumerate([1,8,15,19]): add(f'growl-{n+1}','growl',layer('zombies',f'zombies/zombie-{i}.wav',1.05),target=.19)
for n,i in enumerate([3,6,13]): add(f'breath-{n+1}','breath',layer('zombies',f'zombies/zombie-{i}.wav',.62),target=.14)
for n,i in enumerate([2,5,6]):
 add(f'explosion-{n+1}','explosion',layer('bangs',f'fw_{i:02}.ogg',.9),layer('debris',f'bfh1_rock_falling_0{n+1}.ogg',.65,gain=.25,offset=.06),target=.18)
for n,i in enumerate([1,3]): add(f'chain-{n+1}','chain',layer('bangs',f'fw_{i:02}.ogg',.45),target=.16)
for n,i in enumerate([1,2,3]): add(f'debris-{n+1}','debris',layer('debris',f'bfh1_rock_breaking_0{i}.ogg',.45),target=.16)
for n,i in enumerate([1,2]): add(f'door-{n+1}','door',layer('debris',f'bfh1_wood_breaking_0{i}.ogg',.28),target=.17)
for n,i in enumerate([1,2,3]): add(f'step-{n+1}','step',layer('debris',f'bfh1_wood_hit_0{i}.ogg',.14),target=.12)
add('crit-1','crit',layer('slime','slime_04.ogg',.23),layer('debris','bfh1_wood_breaking_02.ogg',.19,gain=.45),target=.17)
add('crit-2','crit',layer('slime','slime_07.ogg',.25),layer('debris','bfh1_wood_breaking_01.ogg',.19,gain=.45),target=.17)
for n,i in enumerate([2,3]): add(f'mass-{n+1}','mass',layer('slime',f'slime_{i:02}.ogg',.5),layer('debris',f'bfh1_rock_falling_0{i}.ogg',.5,gain=.45),target=.17)
# Isolated mechanical transients from a recording of rifle/stapler/tape-measure actions.
for name,kind,start,end,cap in [('pipe-low','beepLow',7.20,7.38,.12),('pipe-mid','beepMid',7.94,8.09,.095),('pipe-high','beepHigh',8.58,8.75,.10),('latch','latch',.16,.5,.29),('ratchet','ratchet',2.65,3.02,.32),('snap','snap',6.35,6.59,.20)]:
 add(name,kind,layer('mechanical','equipment_clicks3.wav',cap,start,end),target=.20)

def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def onset(x,threshold=.005):
 active=np.flatnonzero(abs(x)>=max(abs(x).max()*threshold,1/32768))
 return float(active[0]/RATE*1000) if len(active) else None
def prepare(spec):
 path=SRC/('mechanical.wav' if spec['pack']=='mechanical' else 'extracted/'+spec['pack']+'/'+spec['entry'])
 if expected:
  assert sha(path)==expected[(spec['pack'],spec['entry'])], 'Source changed: '+str(path)
 x,sr=sf.read(path,always_2d=True); original_duration=len(x)/sr
 x=x.mean(axis=1); left=round(spec['start']*sr); right=round(spec['end']*sr) if spec['end'] else len(x)
 x=x[left:right]; g=math.gcd(sr,RATE); x=resample_poly(x,RATE//g,sr//g)
 x-=x.mean(); peak=float(abs(x).max()); active=np.flatnonzero(abs(x)>max(peak*.012,1/32768))
 first=max(0,int(active[0]) - 36); last=min(len(x),int(active[-1])+1+int(RATE*.012),first+round(spec['cap']*RATE))
 x=x[first:last].copy(); assert len(x)>48
 x[:36]*=np.linspace(0,1,36); tail=min(int(RATE*.012),len(x)//3); x[-tail:]*=np.linspace(1,0,tail)
 # Match source layers by RMS, with a hard peak bound, before applying arrangement gain.
 scale=min(.18/max(1e-8,float(np.sqrt(np.mean(x*x)))),.82/max(1e-8,float(abs(x).max())))
 x*=scale*spec['gain']
 info={**spec,'sourceSha256':sha(path),'sourceDuration':original_duration,'trimStartSeconds':spec['start']+first/RATE,'trimEndSeconds':spec['start']+last/RATE,'gainApplied':scale*spec['gain'],'sourceFrames':len(x)}
 return x,info

records=[]; bank={}; audition=[]
for recipe in recipes:
 layers=[prepare(x) for x in recipe['layers']]
 length=max(len(x)+round(i['offset']*RATE) for x,i in layers)
 mix=np.zeros(length)
 for x,i in layers:
  off=round(i['offset']*RATE); mix[off:off+len(x)]+=x
 gain=min(recipe['target']/np.sqrt(np.mean(mix*mix)),.82/abs(mix).max());mix*=gain
 # Exact PCM16 reference: FLAC stores these samples without priming/padding.
 pcm=np.round(mix*32767).astype(np.int16)
 path=OUT/(recipe['id']+'.flac');sf.write(path,pcm,RATE,subtype='PCM_16')
 decoded,sr=sf.read(path,dtype='int16');assert sr==RATE and np.array_equal(pcm,decoded)
 y=pcm.astype(float)/32768
 record={'id':recipe['id'],'kind':recipe['kind'],'file':path.relative_to(ROOT).as_posix(),'sha256':sha(path),'bytes':path.stat().st_size,'frames':len(pcm),'seconds':len(pcm)/RATE,'sampleRate':RATE,'channels':1,'onsetMsAtMinus46dB':onset(y),'peak':float(abs(y).max()),'rms':float(np.sqrt(np.mean(y*y))),'finalGain':float(gain),'layers':[i for _,i in layers],'codec':'FLAC PCM16','paddingFrames':0}
 records.append(record);bank.setdefault(recipe['kind'],[]).append(recipe['id']);audition.extend([y*.6,np.zeros(int(RATE*.35))])
manifest={'version':1,'license':'CC0-1.0','codec':'FLAC PCM16 mono 48000Hz','processing':'Select isolated one-shots; mono mean; polyphase resample; DC removal; trim at 1.2% peak retaining 0.75ms attack lead and <=12ms tail; category duration cap; 0.75ms/12ms linear edge fades; RMS match with 0.82 peak bound; optional recorded layers; lossless FLAC. No internal time-stretch or silence splice. Natural inter-layer offsets preserved.','listeningStatus':'CPU/source/waveform inspection only; no perceptual listening claim. Browser decode, gameplay capture and listener review pending.','sources':receipts,'bank':bank,'clips':records,'totals':{'clips':len(records),'downloadBytes':sum(x['bytes'] for x in records),'pcmBytesAt48k':sum(x['frames']*4 for x in records),'seconds':sum(x['seconds'] for x in records),'maxOnsetMs':max(x['onsetMsAtMinus46dB'] for x in records)}}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(SRC/'audition').mkdir(exist_ok=True)
sf.write(SRC/'audition/recorded-bank.wav',np.concatenate(audition),RATE,subtype='PCM_16')
(SRC/'audition/order.json').write_text(json.dumps([x['id'] for x in records],indent=2)+'\n')
print(json.dumps(manifest['totals'],indent=2))
