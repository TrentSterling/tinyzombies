"""CPU-only hashes, independent decoder checks, onset/edge/gap measurements."""
import hashlib,json,pathlib,subprocess
import numpy as np
import soundfile as sf
ROOT=pathlib.Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'assets/audio/manifest.json').read_text())
reports=[]
for c in manifest['clips']:
 p=ROOT/c['file'];b=p.read_bytes();assert hashlib.sha256(b).hexdigest()==c['sha256']
 a,sr=sf.read(p,dtype='int16');assert sr==48000 and len(a)==c['frames'] and a.ndim==1
 raw=subprocess.run(['ffmpeg','-v','error','-i',str(p),'-f','s16le','-acodec','pcm_s16le','-'],capture_output=True,check=True).stdout
 independent=np.frombuffer(raw,dtype='<i2');assert np.array_equal(a,independent)
 y=a.astype(float)/32768;assert np.all(np.isfinite(y)) and max(abs(y))<.83
 active=np.flatnonzero(abs(y)>=max(max(abs(y))*.005,1/32768));onset=active[0]/48;assert onset<=1
 assert abs(int(a[0]))<=1 and abs(int(a[-1]))<=1
 # Near-silence runs at 1ms resolution, excluding intentionally tapered edges.
 n=len(y)//48;env=np.sqrt(np.mean(y[:n*48].reshape(-1,48)**2,axis=1));quiet=env<.000316
 q=np.where(quiet)[0];groups=np.split(q,np.where(np.diff(q)>1)[0]+1) if len(q) else []
 internal=[len(g) for g in groups if len(g) and g[0]>3 and g[-1]<n-12]
 reports.append({'id':c['id'],'seconds':len(a)/sr,'onsetMs':float(onset),'maxInternalBelowMinus70dBFSMs':max(internal,default=0),'independentDecoderExact':True,'encoderPaddingFrames':0,'peak':float(abs(y).max())})
result={'method':'All delivered FLAC files decoded independently with libsndfile and FFmpeg; exact PCM16 equality and frame count, onset at -46 dB relative peak, anti-click edge samples, finite/no-clipping check, 1 ms RMS silence-run report at -70 dBFS. No browser, GPU or perceptual listening.','passed':True,'totals':manifest['totals'],'clips':reports}
(ROOT/'validation/recorded-assets-cpu.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'passed':True,'clips':len(reports),'maxOnsetMs':max(x['onsetMs'] for x in reports),'maxInternalQuietMs':max(x['maxInternalBelowMinus70dBFSMs'] for x in reports),'totalBytes':manifest['totals']['downloadBytes']},indent=2))
