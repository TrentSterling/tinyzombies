r"""Tiny Zombies voice batch: lines.csv -> one processed OGG/Opus (or FLAC) per line.

Run (CPU Kokoro, offline, headless):
  C:\py\python.exe tz_voice_batch.py lines.csv out_dir [--fmt opus|flac] [--device cpu|cuda]

lines.csv columns: id,text,voice,preset[,speed]   (speed defaults to 1.0)
Voices: Kokoro ids cached in ~/.cache/huggingface/hub/models--hexgrad--Kokoro-82M (see HANDOFF doc).
Presets: names in PRESETS below. Two kinds:
  py:<name>   trontbot4/dsp.py chain (pa, broadcast, combine, heavy, clear), numpy/scipy only
  ff:<chain>  plain ffmpeg -af chain (no extra deps)
Nothing is downloaded; HF offline is forced. Requires ffmpeg + ffprobe on PATH.
"""
import os, sys, re, csv, json, subprocess, tempfile, argparse
os.environ["HF_HUB_OFFLINE"] = "1"; os.environ["TRANSFORMERS_OFFLINE"] = "1"
from pathlib import Path
import numpy as np, soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parent)) # vendored original DSP

# ffmpeg chains (applied at 48 kHz mono, before the final loudness stage)
NOISE = "anoisesrc=d=60:c=pink:r=48000:a=0.012:seed=7"
PRESETS = {
  # old AM table radio / civil-defense broadcast: narrow band, soft clip, hiss, mild crush
  "radio50s": ("ff", "highpass=f=380,lowpass=f=3200,acompressor=threshold=-24dB:ratio=6:attack=3:release=60:makeup=6,"
                     "asoftclip=type=tanh:threshold=0.5,acrusher=bits=11:mode=lin:aa=1:mix=0.35"),
  # walkie-talkie: tighter band, harder clip, bit crush, squelch hiss
  "walkie":   ("ff", "highpass=f=500,lowpass=f=2800,acompressor=threshold=-26dB:ratio=10:attack=1:release=30:makeup=8,"
                     "asoftclip=type=hard:threshold=0.35,acrusher=bits=9:mode=lin:mix=0.6"),
  # trontbot4/dsp.py chains
  "pa":        ("py", "pa"),         # Cave-Johnson PA: HP500, +8dB@1.8k, HF -9dB@4k, 8:1 comp, small reverb
  "broadcast": ("py", "broadcast"),  # punchy radio host: HP300, +6dB@2.5k, 5:1 comp
  "combine":   ("py", "combine"),    # robot/overwatch: pitch flatten, vocoder, radio crunch
  "clear":     ("py", "clear"),
  "dry":       ("ff", "anull"),
}
HISS = {"radio50s": 1.0, "walkie": 1.6}   # noise bed gain by preset (applied via amix)

def run(*a):
    r = subprocess.run(a, capture_output=True, text=True)
    if r.returncode: raise RuntimeError(r.stderr[-800:])
    return r.stderr

def kokoro(text, voice, speed, device):
    import torch; from kokoro import KPipeline
    if device == "cpu": torch.set_num_threads(4)
    key = (voice[0], device)
    if key not in kokoro.cache: kokoro.cache[key] = KPipeline(lang_code=voice[0], device=device)
    p = kokoro.cache[key]
    ch = [a.numpy() if hasattr(a, "numpy") else a for _, _, a in p(text, voice=voice, speed=speed)]
    return np.concatenate(ch).astype(np.float32), 24000
kokoro.cache = {}

def lufs(path):
    o = run("ffmpeg","-hide_banner","-nostats","-i",str(path),"-af","ebur128=peak=true","-f","null","-")
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", o)[-1])

def finish(src, dst, fmt, extra_chain=None, hiss=0.0):
    """trim silence -> optional ffmpeg chain + noise bed -> gain+limiter loop to -16 LUFS / peak <= -1.9 dBFS -> mono 48k -> encode."""
    trim = "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse"
    chain = trim + ("," + extra_chain if extra_chain else "")
    graph = f"[0]{chain}[v]"
    if hiss:
        graph = f"[0]{chain}[v0];{NOISE},volume={hiss}[n];[v0][n]amix=inputs=2:duration=first:normalize=0[v]"
    mid = Path(str(dst) + ".mid.wav")
    run("ffmpeg","-hide_banner","-y","-i",str(src),"-filter_complex",graph,"-map","[v]","-ar","48000","-ac","1",str(mid))
    for _ in range(4):                      # limiter eats loudness on peaky voices, so iterate
        gain = -16.0 - lufs(mid)
        if abs(gain) < 0.3: break
        nxt = Path(str(dst) + ".nxt.wav")
        run("ffmpeg","-hide_banner","-y","-i",str(mid),"-af",f"volume={gain}dB,alimiter=limit=0.80:attack=2:release=40:level=disabled","-ar","48000","-ac","1",str(nxt))
        os.replace(nxt, mid)
    codec = ["-c:a","libopus","-b:a","48k","-application","voip"] if fmt == "opus" else ["-c:a","flac"]
    run("ffmpeg","-hide_banner","-y","-i",str(mid),"-ar","48000","-ac","1",*codec,str(dst))
    mid.unlink()

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("csv"); ap.add_argument("out")
    ap.add_argument("--fmt", default="opus", choices=["opus","flac"]); ap.add_argument("--device", default="cpu")
    a = ap.parse_args(); out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    ext = "ogg" if a.fmt == "opus" else "flac"
    tmp = Path(tempfile.mkdtemp())
    for row in csv.DictReader(open(a.csv, encoding="utf-8")):
        kind, spec = PRESETS[row["preset"]]
        wav, sr = kokoro(row["text"], row["voice"], float(row.get("speed") or 1.0), a.device)
        raw = tmp / (row["id"] + ".wav")
        if kind == "py":
            import dsp
            wav48 = dsp.resample_audio(wav, sr, 48000); sr = 48000
            sf.write(raw, dsp.process(wav48, sr, preset=spec), sr); chain = None
        else:
            sf.write(raw, wav, sr); chain = None if spec == "anull" else spec
        finish(raw, out / f"{row['id']}.{ext}", a.fmt, chain, HISS.get(row["preset"], 0.0))
        print("ok", row["id"], flush=True)

if __name__ == "__main__": main()
