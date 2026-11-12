"""Voice DSP chain — pitch correct, vocoder, EQ, compressor, radio, reverb, normalize.

Ported from C:\\trontstack\\glados\\glados_voice\\dsp\\effects\\
Requires: numpy, scipy, soundfile, praat-parselmouth (for pitch_correct)
"""

import numpy as np
from scipy.signal import butter, lfilter, sosfilt, stft, istft, resample_poly
from math import gcd


def resample_audio(audio: np.ndarray, from_sr: int, to_sr: int) -> np.ndarray:
    """Resample audio using polyphase filter. Returns float32."""
    if from_sr == to_sr:
        return audio
    g = gcd(from_sr, to_sr)
    up = to_sr // g
    down = from_sr // g
    return resample_poly(audio, up, down).astype(np.float32)


# ── Pitch Correction (Autotune) ────────────────────────────────────────────

def pitch_correct(
    audio: np.ndarray,
    sample_rate: int,
    flatten_amount: float = 0.4,
    quantize_semitones: bool = False,
    snap_strength: float = 1.0,
    step_transitions: float = 0.0,
    snap_direction: str = "down",
    time_step: float = 0.01,
) -> np.ndarray:
    """Autotune with snap direction: 'nearest', 'down' (T8 GLaDOS), or 'up'."""
    try:
        import parselmouth
    except ImportError:
        return audio

    if flatten_amount <= 0 and not quantize_semitones:
        return audio

    snd = parselmouth.Sound(audio, sampling_frequency=sample_rate)
    pitch = snd.to_pitch(time_step=time_step, pitch_floor=75, pitch_ceiling=600)
    pitch_values = pitch.selected_array["frequency"]

    voiced = pitch_values[pitch_values > 0]
    if len(voiced) == 0:
        return audio

    median_pitch = np.median(voiced)
    manipulation = parselmouth.praat.call(snd, "To Manipulation", time_step, 75, 600)
    pitch_tier = parselmouth.praat.call(manipulation, "Extract pitch tier")
    num_points = parselmouth.praat.call(pitch_tier, "Get number of points")

    _snap_fn = {"down": np.floor, "up": np.ceil, "nearest": np.round}.get(snap_direction, np.floor)

    new_values = []
    times = []
    for i in range(1, num_points + 1):
        t = parselmouth.praat.call(pitch_tier, "Get time from index", i)
        value = parselmouth.praat.call(pitch_tier, "Get value at index", i)
        times.append(t)

        if value <= 0:
            new_values.append(value)
            continue

        new_value = value
        if flatten_amount > 0:
            new_value = value + (median_pitch - value) * flatten_amount

        if quantize_semitones and new_value > 0:
            semitones_from_a4 = 12 * np.log2(new_value / 440.0)
            snapped = float(_snap_fn(semitones_from_a4))
            target_freq = 440.0 * (2 ** (snapped / 12.0))
            new_value = new_value + (target_freq - new_value) * snap_strength

        new_values.append(max(new_value, 50))

    if step_transitions > 0 and quantize_semitones:
        stepped = list(new_values)
        for i in range(len(stepped)):
            if stepped[i] <= 0:
                continue
            semi = 12 * np.log2(stepped[i] / 440.0)
            target_semi = round(semi)
            target_freq = 440.0 * (2 ** (target_semi / 12.0))

            prev_semi = None
            next_semi = None
            if i > 0 and stepped[i - 1] > 0:
                prev_semi = round(12 * np.log2(stepped[i - 1] / 440.0))
            if i < len(stepped) - 1 and stepped[i + 1] > 0:
                next_semi = round(12 * np.log2(stepped[i + 1] / 440.0))

            if prev_semi is not None and prev_semi == target_semi:
                stepped[i] = stepped[i] + (target_freq - stepped[i]) * step_transitions
            elif next_semi is not None and next_semi == target_semi:
                stepped[i] = stepped[i] + (target_freq - stepped[i]) * step_transitions
            else:
                stepped[i] = stepped[i] + (target_freq - stepped[i]) * step_transitions * 0.8
        new_values = stepped

    for i in range(num_points, 0, -1):
        parselmouth.praat.call(pitch_tier, "Remove point", i)
    for i in range(len(times)):
        if new_values[i] > 0:
            parselmouth.praat.call(pitch_tier, "Add point", times[i], new_values[i])

    parselmouth.praat.call([manipulation, pitch_tier], "Replace pitch tier")
    result_snd = parselmouth.praat.call(manipulation, "Get resynthesis (overlap-add)")
    result = result_snd.values[0].astype(np.float32)

    if len(result) > len(audio):
        result = result[: len(audio)]
    elif len(result) < len(audio):
        result = np.pad(result, (0, len(audio) - len(result)))

    return result


# ── Vocoder ────────────────────────────────────────────────────────────────

def vocoder(
    audio: np.ndarray,
    sample_rate: int,
    wet: float = 0.08,
    num_bands: int = 32,
    phase_randomize: float = 0.5,
) -> np.ndarray:
    if wet <= 0:
        return audio

    n_fft = 2048
    hop = n_fft // 4
    freqs, times, Zxx = stft(audio, fs=sample_rate, nperseg=n_fft, noverlap=n_fft - hop)
    magnitude = np.abs(Zxx)
    phase = np.angle(Zxx)

    if phase_randomize > 0:
        random_phase = np.random.uniform(-np.pi, np.pi, phase.shape).astype(np.float32)
        phase = phase * (1 - phase_randomize) + random_phase * phase_randomize

    Zxx_vocoded = magnitude * np.exp(1j * phase)
    _, vocoded = istft(Zxx_vocoded, fs=sample_rate, nperseg=n_fft, noverlap=n_fft - hop)

    min_len = min(len(audio), len(vocoded))
    vocoded = vocoded[:min_len].astype(np.float32)
    dry = audio[:min_len]
    return dry * (1 - wet) + vocoded * wet


# ── EQ ──────────────────────────────────────────────────────────────────────

def eq(
    audio: np.ndarray,
    sample_rate: int,
    highpass_freq: float = 250.0,
    mid_freq: float = 3000.0,
    mid_gain_db: float = 4.0,
    mid_q: float = 1.5,
    hf_shelf_freq: float = 9000.0,
    hf_shelf_db: float = -3.0,
) -> np.ndarray:
    nyquist = sample_rate / 2.0
    result = audio.copy()

    if highpass_freq > 20:
        hp_freq = min(highpass_freq / nyquist, 0.99)
        sos_hp = butter(4, hp_freq, btype="high", output="sos")
        result = sosfilt(sos_hp, result).astype(np.float32)

    if abs(mid_gain_db) > 0.1:
        gain_linear = 10 ** (mid_gain_db / 20.0) - 1.0
        bw = mid_freq / mid_q
        low = max((mid_freq - bw / 2) / nyquist, 0.001)
        high = min((mid_freq + bw / 2) / nyquist, 0.999)
        if low < high:
            sos_mid = butter(2, [low, high], btype="band", output="sos")
            mid_band = sosfilt(sos_mid, result).astype(np.float32)
            result = result + mid_band * gain_linear

    if hf_shelf_db < -0.1:
        lp_freq = min(hf_shelf_freq / nyquist, 0.99)
        sos_lp = butter(2, lp_freq, btype="low", output="sos")
        low_passed = sosfilt(sos_lp, result).astype(np.float32)
        hf_atten = 10 ** (hf_shelf_db / 20.0)
        hf_content = result - low_passed
        result = low_passed + hf_content * hf_atten

    return result


# ── Compressor ──────────────────────────────────────────────────────────────

def compressor(
    audio: np.ndarray,
    sample_rate: int,
    threshold_db: float = -12.0,
    ratio: float = 3.0,
    attack_ms: float = 5.0,
    release_ms: float = 50.0,
    makeup_gain_db: float = 0.0,
) -> np.ndarray:
    if ratio <= 1.0:
        return audio

    threshold = 10 ** (threshold_db / 20.0)
    attack_coeff = np.exp(-1.0 / (sample_rate * attack_ms / 1000.0))
    release_coeff = np.exp(-1.0 / (sample_rate * release_ms / 1000.0))

    # Block-based envelope follower (~64 sample blocks) instead of per-sample
    levels = np.abs(audio)
    block = 64
    n = len(audio)
    n_blocks = (n + block - 1) // block
    peak_per_block = np.array([levels[i*block:min((i+1)*block, n)].max() for i in range(n_blocks)])

    env_blocks = np.zeros(n_blocks, dtype=np.float32)
    env = 0.0
    for i in range(n_blocks):
        lvl = peak_per_block[i]
        coeff = attack_coeff if lvl > env else release_coeff
        env = coeff * env + (1 - coeff) * lvl
        env_blocks[i] = env

    # Expand back to sample-level via repeat
    envelope = np.repeat(env_blocks, block)[:n]

    gain = np.ones(n, dtype=np.float32)
    mask = envelope > threshold
    over_db = 20 * np.log10(np.maximum(envelope[mask], 1e-10)) - threshold_db
    reduced_db = over_db / ratio
    gain[mask] = 10 ** ((reduced_db - over_db) / 20.0)

    result = audio * gain
    if makeup_gain_db != 0:
        result *= 10 ** (makeup_gain_db / 20.0)

    return result.astype(np.float32)


# ── Reverb ──────────────────────────────────────────────────────────────────

def reverb(
    audio: np.ndarray,
    sample_rate: int,
    wet: float = 0.12,
    room_size: float = 0.3,
    damping: float = 0.5,
    pre_delay_ms: float = 10.0,
) -> np.ndarray:
    """Schroeder reverb using scipy.signal.lfilter (vectorized, no Python loops)."""
    if wet <= 0:
        return audio

    pre_delay_samples = int(sample_rate * pre_delay_ms / 1000.0)
    fb = 0.5 + room_size * 0.45

    comb_delays = [int(sample_rate * d) for d in [0.0297, 0.0371, 0.0411, 0.0437]]
    allpass_delays = [int(sample_rate * d) for d in [0.005, 0.0017]]

    # Comb filters with damping via lfilter
    # Transfer function: H(z) = z^-M / (1 - fb*(1-d)*z^-M - fb*d*z^-(M+1))
    # Simplified: feedback comb with 1-pole lowpass in the loop
    reverb_signal = np.zeros(len(audio), dtype=np.float32)

    for M in comb_delays:
        # IIR comb: y[n] = x[n-M] + fb * ((1-damping)*y[n-M] + damping*y[n-M-1])
        b = np.zeros(M + 1, dtype=np.float64)
        b[M] = 1.0
        a = np.zeros(M + 2, dtype=np.float64)
        a[0] = 1.0
        a[M] = -fb * (1.0 - damping)
        a[M + 1] = -fb * damping
        reverb_signal += lfilter(b, a, audio).astype(np.float32)

    reverb_signal /= len(comb_delays)

    # Allpass filters via lfilter
    for M in allpass_delays:
        g = 0.5
        b = np.zeros(M + 1, dtype=np.float64)
        b[0] = -g
        b[M] = 1.0
        a = np.zeros(M + 1, dtype=np.float64)
        a[0] = 1.0
        a[M] = -g
        reverb_signal = lfilter(b, a, reverb_signal).astype(np.float32)

    # Pre-delay
    if pre_delay_samples > 0:
        reverb_signal = np.roll(reverb_signal, pre_delay_samples)
        reverb_signal[:pre_delay_samples] = 0

    np.clip(reverb_signal, -2.0, 2.0, out=reverb_signal)
    return (audio * (1 - wet) + reverb_signal * wet).astype(np.float32)


# ── Normalize ───────────────────────────────────────────────────────────────

def normalize(audio: np.ndarray, target_db: float = -1.0) -> np.ndarray:
    peak = np.max(np.abs(audio))
    if peak < 1e-8:
        return audio
    target_linear = 10 ** (target_db / 20.0)
    return (audio * (target_linear / peak)).astype(np.float32)


# ── Radio ───────────────────────────────────────────────────────────────────

def radio(
    audio: np.ndarray,
    sample_rate: int,
    lowcut: float = 400.0,
    highcut: float = 3500.0,
    distortion: float = 0.3,
    bitcrush_bits: int = 8,
    downsample_factor: int = 4,
    ring_mod_freq: float = 30.0,
    ring_mod_mix: float = 0.15,
) -> np.ndarray:
    out = audio.copy()
    n = len(out)
    nyq = sample_rate / 2.0

    lo = max(lowcut / nyq, 0.001)
    hi = min(highcut / nyq, 0.999)
    if lo < hi:
        sos = butter(4, [lo, hi], btype="band", output="sos")
        out = sosfilt(sos, out).astype(np.float32)

    if distortion > 0:
        gain = 1.0 + distortion * 6.0
        out = np.tanh(out * gain).astype(np.float32)

    if downsample_factor > 1:
        indices = np.arange(0, n, downsample_factor)
        held = np.repeat(out[indices], downsample_factor)[:n]
        out = held.astype(np.float32)

    if bitcrush_bits < 16:
        levels = 2 ** bitcrush_bits
        out = np.round(out * levels) / levels
        out = out.astype(np.float32)

    if ring_mod_mix > 0 and ring_mod_freq > 0:
        t = np.arange(n, dtype=np.float32) / sample_rate
        carrier = np.sin(2.0 * np.pi * ring_mod_freq * t).astype(np.float32)
        ring = out * carrier
        out = out * (1.0 - ring_mod_mix) + ring * ring_mod_mix

    if lo < hi:
        sos2 = butter(2, [lo, hi], btype="band", output="sos")
        out = sosfilt(sos2, out).astype(np.float32)

    return out


# ── Chain ───────────────────────────────────────────────────────────────────

def process(audio: np.ndarray, sample_rate: int, preset: str = "heavy") -> np.ndarray:
    """Run the full DSP chain. Order: pitch_correct → vocoder → EQ → compress → radio → reverb → normalize."""
    p = PRESETS.get(preset, PRESETS["heavy"])

    if "pitch_correct" in p:
        audio = pitch_correct(audio, sample_rate, **p["pitch_correct"])
    if "vocoder" in p:
        audio = vocoder(audio, sample_rate, **p["vocoder"])
    audio = eq(audio, sample_rate, **p["eq"])
    audio = compressor(audio, sample_rate, **p["compressor"])
    if "radio" in p:
        audio = radio(audio, sample_rate, **p["radio"])
    audio = reverb(audio, sample_rate, **p["reverb"])
    audio = normalize(audio, **p["normalize"])
    return audio


PRESETS = {
    # GLaDOS-tier: autotune (snap down) + vocoder + heavy EQ + compression + radio + reverb
    "heavy": {
        "pitch_correct": {
            "flatten_amount": 0.6,
            "quantize_semitones": True,
            "snap_strength": 1.0,
            "step_transitions": 1.0,
            "snap_direction": "down",
            "time_step": 0.005,
        },
        "vocoder": {
            "wet": 0.45,
            "num_bands": 32,
            "phase_randomize": 0.9,
        },
        "eq": {
            "highpass_freq": 400.0,
            "mid_freq": 2500.0,
            "mid_gain_db": 8.0,
            "mid_q": 0.8,
            "hf_shelf_freq": 5000.0,
            "hf_shelf_db": -10.0,
        },
        "compressor": {
            "threshold_db": -6.0,
            "ratio": 10.0,
            "attack_ms": 1.0,
            "release_ms": 15.0,
            "makeup_gain_db": 5.0,
        },
        "radio": {
            "lowcut": 400.0,
            "highcut": 3500.0,
            "distortion": 0.5,
            "bitcrush_bits": 8,
            "downsample_factor": 4,
            "ring_mod_freq": 30.0,
            "ring_mod_mix": 0.2,
        },
        "reverb": {
            "wet": 0.30,
            "room_size": 0.5,
            "damping": 0.4,
            "pre_delay_ms": 15.0,
        },
        "normalize": {"target_db": -1.0},
    },
    # Combine Overwatch: autotune + vocoder + radio crunch + big reverb
    "combine": {
        "pitch_correct": {
            "flatten_amount": 0.8,
            "quantize_semitones": False,
            "snap_strength": 0.0,
            "step_transitions": 0.0,
        },
        "vocoder": {
            "wet": 0.40,
            "num_bands": 32,
            "phase_randomize": 0.8,
        },
        "eq": {
            "highpass_freq": 300.0,
            "mid_freq": 2500.0,
            "mid_gain_db": 6.0,
            "mid_q": 1.0,
            "hf_shelf_freq": 5000.0,
            "hf_shelf_db": -8.0,
        },
        "compressor": {
            "threshold_db": -8.0,
            "ratio": 6.0,
            "attack_ms": 1.0,
            "release_ms": 20.0,
            "makeup_gain_db": 3.0,
        },
        "radio": {
            "lowcut": 350.0,
            "highcut": 3500.0,
            "distortion": 0.35,
            "bitcrush_bits": 10,
            "downsample_factor": 3,
            "ring_mod_freq": 0.0,
            "ring_mod_mix": 0.0,
        },
        "reverb": {
            "wet": 0.25,
            "room_size": 0.5,
            "damping": 0.4,
            "pre_delay_ms": 15.0,
        },
        "normalize": {"target_db": -1.0},
    },
    # PA system: aggressive EQ + crushing compression + radio bandpass
    "pa": {
        "eq": {
            "highpass_freq": 500.0,
            "mid_freq": 1800.0,
            "mid_gain_db": 8.0,
            "mid_q": 0.7,
            "hf_shelf_freq": 4000.0,
            "hf_shelf_db": -9.0,
        },
        "compressor": {
            "threshold_db": -6.0,
            "ratio": 8.0,
            "attack_ms": 1.0,
            "release_ms": 20.0,
            "makeup_gain_db": 4.0,
        },
        "reverb": {
            "wet": 0.12,
            "room_size": 0.3,
            "damping": 0.5,
            "pre_delay_ms": 12.0,
        },
        "normalize": {"target_db": -1.0},
    },
    # Broadcast: punchy radio host
    "broadcast": {
        "eq": {
            "highpass_freq": 300.0,
            "mid_freq": 2500.0,
            "mid_gain_db": 6.0,
            "mid_q": 1.0,
            "hf_shelf_freq": 7000.0,
            "hf_shelf_db": -5.0,
        },
        "compressor": {
            "threshold_db": -8.0,
            "ratio": 5.0,
            "attack_ms": 2.0,
            "release_ms": 30.0,
            "makeup_gain_db": 3.0,
        },
        "reverb": {
            "wet": 0.10,
            "room_size": 0.3,
            "damping": 0.5,
            "pre_delay_ms": 10.0,
        },
        "normalize": {"target_db": -1.0},
    },
    # Clear: light, transparent — new default
    "clear": {
        "eq": {
            "highpass_freq": 80.0,
            "mid_freq": 2500.0,
            "mid_gain_db": 2.0,
            "mid_q": 1.2,
            "hf_shelf_freq": 10000.0,
            "hf_shelf_db": 0.0,
        },
        "compressor": {
            "threshold_db": -16.0,
            "ratio": 2.0,
            "attack_ms": 5.0,
            "release_ms": 50.0,
            "makeup_gain_db": 1.0,
        },
        "reverb": {
            "wet": 0.0,
            "room_size": 0.0,
            "damping": 0.0,
            "pre_delay_ms": 0.0,
        },
        "normalize": {"target_db": -1.0},
    },
}
