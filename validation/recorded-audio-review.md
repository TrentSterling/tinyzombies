# Recorded combat audio release review

The 43-clip recorded sound bank passed Windows browser qualification on October 15, 2026. Runtime commit: `a84f7f4991b5d56d99c77f390a3309cec5762447`; HTML SHA-256: `f7cc36522bf433ad879f5be1aaeb8077dee11f11578ad61dfbf0a286a2914405`. The matched baseline is main `e348826cb74b2c6bc17c92d6014ea4ac3220c240` (`47a492c20627a145e53fe578230969cdf95769d15f98b96d130dccf6bf89655d`). Publication and hosted-file verification are separate from this local qualification.

The prior mix retained electronic beeps/bloops. Recorded rifle/shotgun attacks, wet hits/deaths, creature vocals, material breaks, firework blasts and mechanical cues now replace the PCM synthesizer. Original source files are preserved. The runtime's shaders, gameplay, world/input/render and GPU readback code remain identical outside the audio host and one preload call; see [scope check](recorded-audio-scope.json). Pipe cadence remains `.65 / .35 / .16` seconds and pauses with the fuse; mission cues retain `.1` second offsets.

## Loading and failure behavior

Two workers fetch same-origin FLAC files, verify SHA-256 and decode to reusable buffers in a silent OfflineAudioContext. One variant per kind is prioritized before extras. A gesture starts/resumes the live mixer. Triggering a sound only reads decoded buffers; it never fetches, decodes, waits or queues a delayed event. Missing/early clips use an available same-kind variant or are skipped. Each failed asset has at most two attempts, with the second allowed on a later audio-enable gesture. After exhausted retries a reload is required. Reset keeps decoded assets and stops voices.

Delivered bank: **736,350 bytes (719.09 KiB)**, **43 mono PCM16 FLAC clips**, **16.277 seconds** total; decoded Float32 memory at 48 kHz: **3,125,156 bytes (2.98 MiB)**. CPU and actual browser onset measurements are at most **0.75 ms**, with short anti-click fades and no codec padding. Natural internal action timing is retained; no blanket internal-gap splice was used.

## Actual Windows browser checks

Chrome **155.0.8059.41**, NVIDIA **RTX 5070 Ti**, driver **32.0.15.9186 / 591.86**, 1280 x 720. Fresh isolated hidden profiles used the hardware adapter. The loaded Document response matched the exact candidate hash. The original hanging V9 was never launched. All owned browsers, servers and monitors closed; both sessions recorded **zero Windows GPU faults**, and the successful qualification had no device/runtime errors.

- All 43 files decoded at both 48 and 44.1 kHz. At 48 kHz, recovered PCM16 matches the source exactly. At 44.1 kHz, resampling lengths differ from the ideal by at most one frame and onset is at most 0.7483 ms.
- A first frame-zero probe incorrectly required Chrome Float32 samples to hash identically to libsndfile. Chrome uses different signed PCM16-to-float scaling, with at most one LSB difference. The probe was corrected to recover PCM16 exactly; no runtime/audio asset was changed. The original failed probe and clean closure are retained in `recorded-browser/initial-*`.
- Injected 404, hash-corrupted bytes and 503 produced 40 ready clips, same-kind fallback/quiet cue omission, at most two requests per failed clip, no trigger-time fetch and zero voices after pause. Ordinary gameplay under those failures fired 85 rifle rounds and detonated one pipe bomb and one grenade; movement, help, map, pause and restart passed.
- An eight-second delayed pipe cue was omitted while unavailable. The bank later reached 43 ready clips without stale playback after reset/pause. Fresh clean load recovered all assets.
- Normal right-mouse shotgun input played two shots. A mechanical mission sequence used latch/snap/latch at 0.1-second offsets, followed by zero lingering voices.
- Six matched scenes per build (quiet, single enemy, horde, barrel chain, pipe and controls), plus candidate saturation, passed. Seeded positioned fixtures retain all 2,048 zombies and 32,768 particles, but place most enemies far away. Both builds replay the same stored normal keyboard/pointer inputs after setup; frame timing and atomic ordering are not identical.
- The horde captured **35 kills**, **120 game rounds**, **27 accepted death events**, 7 debris and 5 hit events. Peak simultaneous sources were **14** (18 in the chain scene). The stress fixture reached the **32-source** ceiling, rejected additional low-priority work, kept priority capacity, and cleared to zero sources on pause.
- Every captured scenario and the separate 2x source-gain stress had **zero clipped samples**. Horde peak was **-14.74 dBFS**, RMS **-33.72 dBFS**; stress peak **-9.02 dBFS**. Pause/mute interior windows were digital zero. Median FPS was approximately **60** in both builds; short fixtures do not establish a performance improvement.

## Recordings and assessment limits

[Watch the actual horde recording](https://chatgpt.com/api/library/files/libfile_cdcd3ba023288191933758bb7c483600/download). The [artifact manifest](recorded-audio-artifact-manifest.json) links individual before/after MP4s and lossless WAVs, the horde WAV, an optional RMS-matched horde comparison, and measurements. Main recordings preserve actual mixer gain. The explicitly labeled comparison raises candidate gain by 1.0879 dB. Audio is post-master Float32 capture synchronized to separately captured canvas video; MP4 uses AAC and WAV uses 24-bit PCM.

The user listened to and approved the selected-sample preview direction, then requested completed integration and release. No supported agent listening tool was available, so no agent listening or final perceptual-quality claim is made. The firework source pack includes processed effects. No long-session audio soak or 8,192-enemy maximum-population runtime test was performed.

## Evidence and reproduction

See [Windows summary](recorded-audio-windows-summary.json), [signal/timing measurements](recorded-audio-measurements.json), raw `recorded-browser/` reports, [CPU asset measurements](recorded-assets-cpu.json), [runtime contract checks](recorded-audio-cpu.json), [provenance checks](recorded-audio-provenance.json), [credits](../assets/audio/CREDITS.md) and [full source/processing manifest](../assets/audio/manifest.json).

Run `node tools/check_recorded_audio.mjs` and `python tools/check_recorded_assets.py` (numpy, soundfile and FFmpeg required). To rebuild, retain verified archives/pages listed in `manifest.json.sources`, acquisition `sources.json`, and selected extracted entries under `SOURCE/extracted/PACK/ENTRY`; place the mechanical WAV at `SOURCE/mechanical.wav`. Run `python tools/build_recorded_audio.py SOURCE` with numpy/scipy/soundfile. Source hashes are enforced, originals only read, and no archive executables used. `python tools/check_recorded_provenance.py SOURCE` verifies source/license/archive and selected-recording hashes without network access.
