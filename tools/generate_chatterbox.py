"""Offline Chatterbox Turbo bank. Originals remain untouched. Resume-safe per-line checkpoints."""
import argparse,csv,json,time,hashlib,random
from pathlib import Path
import numpy as np
import torch
import soundfile as sf
from chatterbox.tts_turbo import ChatterboxTurboTTS
P=Path(__file__).resolve().parents[1]
a=argparse.ArgumentParser();a.add_argument('--model',required=True);a.add_argument('--limit',type=int,default=100);args=a.parse_args()
out=P/'assets/audio/chatterbox-clean';out.mkdir(parents=True,exist_ok=True)
rows=list(csv.DictReader((P/'assets/audio/voice/lines.csv').open(encoding='utf-8-sig')))
assert len(rows)==100
originals={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in (P/'assets/audio/voice').glob('*') if p.is_file()}
(out/'original-pack-sha256.json').write_text(json.dumps(originals,indent=2))
model=ChatterboxTurboTTS.from_local(args.model,device='cuda')
print('GPU:',torch.cuda.get_device_name(0),'sample_rate:',model.sr,flush=True)
manifest=[]
for i,r in enumerate(rows[:args.limit]):
 seed=72100+i; text=r['text']; tags=[]
 if r['id'] in ['extra_crispy','say_cheese','splat_tastic','neighborly','block_party']: tags=['[chuckle]']
 elif r['id'].endswith('got_eaten'): tags=['[sigh]']
 prompt=text+(' '+ ' '.join(tags) if tags else '')
 path=out/(r['id']+'.wav');t=time.time()
 if not path.exists():
  random.seed(seed);np.random.seed(seed);torch.manual_seed(seed);torch.cuda.manual_seed_all(seed)
  wav=model.generate(prompt,temperature=.8,repetition_penalty=1.2).squeeze().detach().cpu().numpy()
  if not np.isfinite(wav).all() or len(wav)<model.sr*.15: raise ValueError('Invalid waveform '+r['id'])
  tmp=path.with_suffix('.partial.wav');sf.write(str(tmp),wav,model.sr,subtype='PCM_16');tmp.replace(path)
 wav,sr=sf.read(path)
 entry=dict(r,prompt=prompt,tags=tags,seed=seed,seconds=round(len(wav)/sr,3),peak=float(np.max(np.abs(wav))),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),model='ResembleAI/chatterbox-turbo',model_revision=Path(args.model).name,voice='bundled default synthetic voice',generation_seconds=round(time.time()-t,2),dsp='clean; original processed Kokoro bank preserved')
 manifest.append(entry);(out/'manifest.json').write_text(json.dumps(manifest,indent=2))
 print(f'{i+1}/100 {r["id"]} {entry["seconds"]}s audio in {entry["generation_seconds"]}s',flush=True)
print('COMPLETE',len(manifest),flush=True)
