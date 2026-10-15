# Fixed cue buffer reuse

This follow-up changes only cache identity for fixed beeps/mission tones and removes redundant beep warm-up entries. Every playback still creates its own source, filter, gain and panner. It preserves the shipped sound mix, waveform factory, scheduling, voice limits, gameplay, simulation and visuals.

Baseline: main commit `3c786acb915ae6750a3adb9c59b32a9e4e32b4b0`, HTML SHA-256 `7beb963c6f69243fc7e9450ab93ef958d25c144f09153010ae185c0e1c55da62`.
Candidate HTML SHA-256: `47a492c20627a145e53fe578230969cdf95769d15f98b96d130dccf6bf89655d`.

## Measured allocation saving

| Cache state | Buffers before / after | PCM bytes before / after, 44.1 kHz | PCM bytes saved |
| --- | --- | --- | --- |
| Initial idle warm-up | 78 / 63 | 5,159,736 / 4,961,256 | 198,480 |
| All 24 supported kinds, six variants requested | 144 / 89 | 7,392,960 / 5,924,400 | 1,468,560 |

At 48 kHz, the corresponding savings are 216,000 and 1,598,400 bytes. These are Float32 PCM payload sizes, not browser process memory. Warm-up avoids 15 duplicate synthesis allocations/queue entries. The full-catalog state is a controlled upper-coverage case; ordinary sessions may not request every mission tone variant.

## Equivalence and actual browser checks

The CPU check extracts the exact waveform factory and warm list from both HTML files, generates all 144 kind/variant combinations at 44.1 and 48 kHz, and compares SHA-256 of every Float32 sample array plus frame counts. All match. Run `node tools/check_audio_cache.mjs before.html index.html report.json` to reproduce without a GPU. [CPU result](audio-cache-pcm-check.json) and [source scope check](audio-cache-source-check.json) are retained.

Chrome 155.0.8059.41 / Windows / RTX 5070 Ti, driver 591.86, reproduced the cache counts/bytes at 44.1 kHz using real AudioBuffers. All 144 browser sample hashes, frame counts and durations match between baseline and candidate. Two three-note mission sequences start at exactly 0, 0.1 and 0.2 seconds relative to the sequence start in both builds. Five overlapping fixed beeps have five independent sources; the candidate shares one PCM buffer. Pause and reset settle to zero active voices.

Both builds passed shader boot, a single active simulation/render frame, the audio-only cache probe, and matching positioned pipe/control/saturation fixtures at 2,048 enemies / 32,768 particles. Both pipe runs scheduled the same 16 cue kinds and one detonation. Interior pause/mute windows were exactly silent. Saturation remained bounded at 32 sources, including five cues and five weapons after 22 non-priority sources. No PCM samples clipped and no runtime/device errors or new Windows GPU faults occurred. The owned browser, profile, server and monitor closed after testing.

See [Windows summary](audio-cache-windows-summary.json), [before browser cache evidence](audio-cache-browser-before.json), and [after browser cache evidence](audio-cache-browser-after.json). Raw fixture logs and captures remain in the task's `audio-cache2` directory. Independent game runs have different frame timing and GPU ordering, so full mixed recordings are not claimed bit-identical. Source scheduling and all generated sample payloads are unchanged. No listening or frame-rate improvement is claimed.

The first baseline overlap probe correctly hit distance culling because it used a pipe location outside the audible radius. That failed harness run is preserved, with clean process/GPU-fault cleanup. The corrected source-sharing probe is unpositioned, while the actual pipe fixture separately exercises normal B input and spatial cues.

The preceding audio release commit is the rollback point. Hosted identity and normal-input smoke are verified separately after deployment.
