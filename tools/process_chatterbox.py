"""Apply preserved Tiny Zombies DSP presets to the new bank, never the originals."""
import json,time,csv,hashlib
from pathlib import Path
import soundfile as sf
import tiny_original_dsp as old
import dsp
P=Path(__file__).resolve().parents[1];source=P/'assets/audio/chatterbox-clean';out=P/'assets/audio/chatterbox';out.mkdir(parents=True,exist_ok=True)
rows=list(csv.DictReader((P/'assets/audio/voice/lines.csv').open(encoding='utf-8-sig')))
results=[]
for row in rows:
 src=source/(row['id']+'.wav');dst=out/(row['id']+'.ogg')
 deadline=time.time()+1800
 while not src.exists():
  if time.time()>deadline:raise TimeoutError(str(src))
  time.sleep(2)
 kind,spec=old.PRESETS[row['preset']]
 if not dst.exists():
  if kind=='py':
   wav,sr=sf.read(src);wav=dsp.resample_audio(wav,sr,48000);tmp=out/(row['id']+'.dsp.wav');sf.write(tmp,dsp.process(wav,48000,preset=spec),48000)
   old.finish(tmp,dst,'opus');tmp.unlink()
  else:old.finish(src,dst,'opus',spec,old.HISS.get(row['preset'],0))
 info=sf.info(dst);results.append(dict(id=row['id'],preset=row['preset'],seconds=info.duration,samplerate=info.samplerate,channels=info.channels,lufs=old.lufs(dst),sha256=hashlib.sha256(dst.read_bytes()).hexdigest()))
 (out/'validation.json').write_text(json.dumps(results,indent=2));print(len(results),row['id'],flush=True)
(out/'index.json').write_text(json.dumps([r['id'] for r in rows]))
print('DSP COMPLETE',len(results),flush=True)
