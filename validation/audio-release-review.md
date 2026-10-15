# Combat audio release validation

The user authorized publication after the prior draft recordings were delivered. The release keeps procedural spatial zombie calls, gait sounds, body/debris impacts, death layers and chain accents, and reduces background event density. No listening occurred in this execution environment. Changes were assessed through source review, actual browser recordings and signal/event measurements; artistic quality, perceived pumping, fatigue and audible cue readability remain unverified.

Tested HTML SHA-256: `7beb963c6f69243fc7e9450ab93ef958d25c144f09153010ae185c0e1c55da62`.
Prior draft: commit `03a7ba305d2e0d6c1194da29577151d7332c651c`, HTML `38d814c2f7f02f197cd6028a22cb112b21acfbd00aa48651284e74273b8401ae`.

## Changes and scope

Footsteps have a shared, varied spacing limit; each actor retains its own cooldown. Zombie calls use wider individual/global gaps, quieter breaths and distance filtering. Clustered deaths have separate onsets and shorter tails. Mass accents require a larger group and have a longer cooldown. The first nearby barrel explosion retains its full body; up to two later chain accents use shorter, staggered envelopes. Per-category filtering reserves more upper-frequency space for weapons and cues. The 32-source ceiling, 22-source non-priority ceiling and category limits remain enforced.

The shader/world prefix and all host code after the audio block are byte-identical to the prior draft. No gameplay writes, visual changes, enemy/particle reductions or driver/settings changes were made. See [source checks](audio-release-source-check.json).

## Actual Windows browser checks

Chrome 155.0.8059.41, NVIDIA RTX 5070 Ti / Blackwell, driver 591.86, 1280x720. A fresh isolated profile kept desktop output muted. The candidate passed shader boot, one active simulation/render frame, six controlled fixtures and synthetic saturation. The prior draft then ran the same six fixtures using the same preserved pointer/keyboard logs. Default 2,048 enemies and 32,768 particles remained present; most enemies were positioned far away, with 0/1/64/64/12/12 near the player. These are positioned fixtures, not blind human play. Timing and GPU atomic ordering differ, so kill counts are not identical.

| Scenario | Peak sources, prior / release | RMS dBFS, prior / release | Release median FPS |
| --- | --- | --- | --- |
| quiet | 0 / 0 | silence / silence | 60.00 |
| single | 6 / 7 | -40.10 / -40.76 | 60.00 |
| horde | 18 / 13 | -30.37 / -32.38 | 60.00 |
| chain | 19 / 17 | -31.90 / -35.36 | 60.00 |
| pipe | 9 / 6 | -32.74 / -35.58 | 60.00 |
| controls | 5 / 3 | -41.44 / -44.48 | 60.01 |

Horde footsteps fell from 87 to 26 and zombie calls from 19 to 11. Weapon events were 97 versus 96 under the same input log, with timing variation; weapon gain and scheduler were unchanged. Chain footsteps fell from 65 to 20 and calls from 15 to 8. Pipe beeps remained 16 in both runs, with one detonation. Quiet remained exactly silent. Pause/mute interior PCM windows were silent and restart cleared old bomb state. Brief fade-out sources may still be counted immediately after mute.

The stress test reached 32 voices after 22 non-priority voices, accepted five cue and five weapon voices, rejected extra non-priority work, and settled to zero voices while paused. The separate overload peak was -8.92 dBFS; no PCM samples clipped in any scenario. No runtime/device errors or new Windows GPU faults occurred. Candidate render-submission CPU medians were 0.24-0.28 ms; separately measured audio event processing peaked at 0.9 ms. Polled GPU timestamps may repeat, and these short runs do not prove a performance gain or long-session stability. Maximum 8,192-enemy runtime was not tested.

## Recordings and provenance

Post-master stereo Float32 PCM was captured through AudioWorklet at 44.1 kHz, alongside separate 30 FPS canvas video. Final MP4s contain H.264/AAC; standalone WAVs contain 24-bit PCM. Final files passed decoding. Main before/after files preserve actual gain. The horde comparison applies +2.016 dB to the release candidate to match prior-draft PCM RMS; it is a separate labeled comparison.

[Measurements](audio-release-measurements.json) include events, timing, levels, performance, controls and stress results. [The manifest](audio-release-artifact-manifest.json) records exact review filenames, byte sizes and hashes. [Raw reports](audio-release-evidence) preserve input logs and telemetry. The original uploaded game, prior draft, prior captures and earlier validation remain intact. [Session cleanup](audio-release-session-close.json) confirms the test browser, local server, monitor and profile processes closed without GPU faults at 2026-10-15T09:17:33Z.

The existing published route build at main commit `b2cec86923a956a34bdad9db33b6b4a35f6cd0de` is the pre-audio rollback point. A separate deployment receipt records the actual live URL, bytes and hosted smoke test; local fixture results alone do not establish the hosted build identity.
