# Recorded audio candidate — CPU checkpoint

Status: **local candidate, not published**. Based on main `e348826cb74b2c6bc17c92d6014ea4ac3220c240`; the preceding procedural release remains live. Browser/GPU recording waits for the coordinated window after Jet Game's priority work.

The prior mix improved layering but retained electronic beeps/bloops. This candidate replaces the PCM synthesizer with 43 compact CC0 recordings/recording-derived layers: four rifle attacks, three shotgun attacks, wet hits/deaths, creature vocals, wood/rock material sounds, firework blasts and mechanical cues. Pipe cues keep the existing `.65 / .35 / .16` second countdown spacing and pause behavior. Mission cues use mechanical sequences. The existing source caps, distance/pan/filter mix, ducking and gameplay are preserved.

## Startup and failures

Two workers fetch, verify SHA-256 and decode a bounded set of same-origin FLAC files into a reusable cache. A silent OfflineAudioContext decodes during boot, before playback. Each kind's first choice precedes extra variants. A gesture creates/resumes the live mixer. Playback only reads decoded buffers and creates an independent source; it never fetches, decodes, waits or queues delayed playback. An early/missing event uses an available same-kind recording or is skipped. Missing audio never blocks the game. Failed assets get at most one further attempt on a later audio-enable gesture. Reset preserves decoded assets while stopping current voices.

## Measurements and tests

- Delivered audio: **736,350 bytes / 719.09 KiB**, 43 mono PCM16 FLAC clips, **16.277 s** total.
- Decoded Float32 memory at 48 kHz: **3,125,156 bytes / 2.98 MiB**.
- Leading silence at -46 dB relative peak: **0–0.75 ms**. All clips have short anti-click edge fades.
- Independent libsndfile and FFmpeg decodes: all exact PCM/frame-count matches; **zero encoder padding frames**, no additional clipping, peak below 0.83.
- Longest interior near-silence run at -70 dBFS using 1 ms RMS windows: **11 ms**. No blanket internal-gap splice was applied; natural action/layer spacing remains.
- Node VM executes the exact host code against mock browser audio nodes and filesystem-backed fetch. It checks two-job concurrency, inflight deduplication, asset verification, no trigger-time work, category/22-background/32-total caps, independent source nodes, mission cue offsets, pause/mute/reset, missing/hash/decode/duration/abort failures, bounded retry/recovery, same-kind fallback and no late playback after pause.

Evidence: [asset measurements](recorded-assets-cpu.json), [runtime contract checks](recorded-audio-cpu.json), [scope/source checks](recorded-audio-scope.json), [preserved-source provenance checks](recorded-audio-provenance.json), [credits](../assets/audio/CREDITS.md), [full manifest](../assets/audio/manifest.json), and [pending browser plan](recorded-audio-browser-plan.md).

## Reproduce CPU checks

Run `node tools/check_recorded_audio.mjs` and `python tools/check_recorded_assets.py`. The latter requires numpy, soundfile and FFmpeg. To rebuild, retain the verified downloads listed in `manifest.json.sources`, the acquisition `sources.json`, and extract only selected entries listed in each clip's `layers` to `SOURCE/extracted/PACK/ENTRY`; store the mechanical WAV at `SOURCE/mechanical.wav`. Run `python tools/build_recorded_audio.py SOURCE` with numpy, scipy and soundfile installed. Existing manifest source hashes are enforced before processing; original files are only read. No application executables from an archive are used.

Run `python tools/check_recorded_provenance.py SOURCE` to verify all preserved source-page/archive/license hashes, CC0 links and selected original recordings. This check uses only Python's standard library and does not access the network.

## Remaining review

No browser, GPU or speaker output was used for this checkpoint. Mock tests do not establish actual Chrome codec behavior, browser scheduling, mix levels or perceptual quality. The user listened to the selected-sample preview and approved its direction, requesting the completed in-game death mix. That approval applies to the asset sequence, not proof of final in-game mix quality. No agent listening is claimed. Next: actual browser cold load/failure checks, decode onset at 44.1/48 kHz, matched before/after horde-combat captures, pipeline timing/controls/saturation and tested release. A further subjective approval is not required. The `fw_` explosion clips come from a pack containing some processed effects; measurements alone do not establish naturalness.
