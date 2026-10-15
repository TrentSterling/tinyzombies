# Combat audio candidate: listening review pending

This branch adds procedural zombie voices, gait sounds, body/debris impacts, death layers and multi-kill/chain accents to the existing weapon and mission cues. It is a staged candidate, not the published game. No listening occurred in the test environment, so artistic quality, fatigue, cue readability by ear and perceived compressor pumping remain unverified. Do not merge or deploy until the listening decision.

Candidate HTML SHA-256: `38d814c2f7f02f197cd6028a22cb112b21acfbd00aa48651284e74273b8401ae`.
Baseline: main commit `b2cec86923a956a34bdad9db33b6b4a35f6cd0de`, HTML SHA-256 `ca3675b42b5ec46776153a26ea847e7af77c7ce30f57e426b4eb3dc1e1fcff1c`.

## Implementation and scope

The mixer uses original generated PCM, six seeded variants per sound, playback-rate variation, camera-relative stereo panning, distance attenuation and filtering. A private seeded generator keeps variation separate from gameplay. A 32-source ceiling, a 22-source non-priority ceiling and category caps reserve room for weapon, explosion and pipe/mission cues. Short bed ducking, a high-pass filter, compressor and soft ceiling feed a 0.4 master gain. Idle-time buffer preparation avoids doing all sound synthesis on an event frame. Pause, mute and restart fade active sources and invalidate stale snapshot events.

Zombie HP, gait and barrel HP changes come from a bounded extension of the existing slow GPU-to-CPU statistics readback. Audio reads state without writing gameplay buffers. All 40 shader declarations, world generation, state layouts and enemy/particle budgets are unchanged; see [source checks](audio-source-check.json). No imported samples or new external assets are used.

## Recorded evidence

Chrome 155.0.8059.41 on Windows with NVIDIA RTX 5070 Ti / Blackwell, driver 591.86, 1280x720. The isolated browser ran with desktop output muted. AudioWorklet captured post-master lossless stereo Float32 PCM at 44.1 kHz while MediaRecorder captured separate silent 30 FPS VP8 canvas video. Review MP4s use H.264/AAC and WAVs use 24-bit PCM. All final review files passed decode checks. Main files preserve actual output gain; no normalization was applied.

The six fixtures cover quiet, one kill, dense horde, chain barrels, pipe bomb and pause/mute/resume/restart. They retain 2,048 zombies and 32,768 particles, but position most zombies far away and place 0/1/64/64/12/12 nearby respectively. Player and chain barrels are explicitly positioned. Ordinary pointer/keyboard inputs follow setup; candidate runs replay baseline input logs. Frame timing and GPU atomic ordering are not identical. Horde kills were 36 before and 34 after, so these are comparable input runs, not identical simulation outcomes or blind human play.

| Scenario | 4x true peak dBFS, before / after | RMS dBFS, before / after | Peak sources, before / after | After median FPS |
| --- | --- | --- | --- | --- |
| quiet | silence / silence | silence / silence | 0 / 0 | 60.00 |
| single | -19.26 / -14.07 | -44.57 / -40.19 | 5 / 7 | 60.00 |
| horde | -18.97 / -13.37 | -37.53 / -30.34 | 5 / 18 | 60.00 |
| chain | -18.97 / -11.99 | -46.58 / -32.06 | 5 / 19 | 60.00 |
| pipe | -21.46 / -12.80 | -49.80 / -32.80 | 2 / 9 | 59.94 |
| controls | -35.03 / -17.41 | -61.96 / -41.26 | 1 / 6 | 60.00 |

All scenes passed without runtime/device errors or new Windows GPU faults. No PCM samples clipped. Candidate render-submission CPU medians were 0.28-0.34 ms; the maximum separately measured audio event-processing sample was 4 ms. Polled GPU timestamps can repeat. These short captures do not establish a performance improvement, a long-session audio soak result or maximum 8,192-enemy stability.

The artificial stress test filled 22 non-priority voices, then accepted five cue and five weapon voices to reach 32; further low-priority work was rejected. A separate 2x source-gain overload had no clipped samples, with sampled peak -8.97 dBFS. Pause settled to zero active voices/sources. This is a synthetic saturation check, not ordinary gameplay. Brief source counts during the 6 ms fade do not imply sustained audio while paused: interior paused/muted PCM windows were silent. Restart cleared the old pipe state; new-world ambient voices can resume normally. The pipe scenario captured 16 beeps and one detonation.

## Review files and remaining gate

The [artifact manifest](audio-artifact-manifest.json) lists exact filenames, sizes, SHA-256 values and the owner's Library identities. Media are private Library review files; their IDs do not grant public access. Full scene measurements, timeline offsets and the stress report are in [audio-measurements.json](audio-measurements.json). Source JSON reports and recorded input logs are preserved in [audio-evidence](audio-evidence). The [Windows summary](audio-windows-summary.json) includes the environment and session close record.

- `Tiny-Zombies-before.mp4` / `Tiny-Zombies-after.mp4`: six labeled scenarios, about 38 seconds each, with actual recorded game audio.
- `Tiny-Zombies-before.wav` / `Tiny-Zombies-after.wav`: standalone audio for those sequences.
- `Tiny-Zombies-horde-level-matched.mp4`: baseline horde followed by candidate horde attenuated by 7.187 dB to the same PCM RMS, for review without the main gain difference.
- `Tiny-Zombies-audio-measurements.json`: exact metrics and artifact hashes.

Listening feedback must decide whether the zombie/death rhythm, spatial variety and mass-kill texture meet the requested sound direction, and whether weapons and pipe cues remain readable without unpleasant pumping or fatigue. Numeric levels cannot make that decision. The original uploaded HTML and earlier captures remain preserved unchanged. The bounded GPU session ended at 2026-10-15T06:40:09Z with no owned browser, server, monitor or profile processes left running.
