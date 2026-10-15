# Browser qualification plan - completed

Runtime candidate: `a84f7f4991b5d56d99c77f390a3309cec5762447`.
Candidate HTML SHA-256: `f7cc36522bf433ad879f5be1aaeb8077dee11f11578ad61dfbf0a286a2914405`.
Baseline: `e348826cb74b2c6bc17c92d6014ea4ac3220c240`, HTML SHA-256 `47a492c20627a145e53fe578230969cdf95769d15f98b96d130dccf6bf89655d`.

Executed on October 15, 2026 after the coordinated GPU window was released. The successful session was `recorded-audio-qualification2`; all owned processes closed and the lease was released at 16:55:32 UTC. See [the final review](recorded-audio-review.md) and [Windows summary](recorded-audio-windows-summary.json). The steps below preserve the planned method; they are not pending work.

## Prepared local harness

Workspace: `C:\Users\trent\Documents\Codex\2026-10-14\task-8\recorded-audio-qualification`.

The directory contains exact baseline/candidate documents and copied assets, isolated-profile launch/cleanup scripts, Windows GPU-reset monitor, CDP gate/capture harness, six preserved input traces, and a same-origin asset server. Asset URLs are explicitly allowlisted. A local `server-faults.json` can specify HTTP failure, delayed response or corrupt bytes for selected assets. Capture waits for all 43 candidate clips to decode; cold-load behavior is checked separately. The preparation script is `prepare-recorded-qualification.py` in the parent workspace. No test results are inferred from this preparation.

After verified availability, run `launch.ps1` in that directory. Wait up to ten seconds for `chrome-profile/DevToolsActivePort` before issuing CDP commands. Use a fresh profile for each new session. Record the process identities and lease/window ownership. Do not launch the original hanging V9.

## Gates and measurements

1. Record actual Chrome version, GPU adapter/driver and loaded document identity. Compile with animation disabled, inspect device errors, then execute one bounded active frame. Stop immediately on device loss, timeout or new Windows GPU fault; close only owned processes.
2. Cold-load the candidate and run `node check.mjs bank candidate decode`. Check all 43 HTTP/hash/decode results, ready count and roughly 3 MiB decoded memory. The prepared probe decodes through actual browser contexts at 48 and 44.1 kHz. At 48 kHz it compares exact PCM16-derived samples and frame counts with preserved reference hashes; at 44.1 kHz it checks expected resampling length and onset. Measure sample onset against the CPU reference (at most 0.75 ms); investigate any padding or noticeable added silence.
3. On a fresh page inject a 404 for `rifle-2.flac`, corrupt bytes for `hit-1.flac`, and a 503 for `pipe-high.flac`. Run `node check.mjs bank candidate failure` to check same-kind ready fallback or quiet omission, at most one retry, source cleanup and no late event replay after pause. The probe restores clean serving; a fresh boot and decode probe must then establish full recovery after the previous page exhausted its retry budget. Separately delay a cue response during cold load to check omission before readiness and absence of replay after reset. Verify normal gameplay continues and playback triggers perform no fetch/decode work. Restore clean serving before matched performance runs.
4. Run `node check.mjs boot baseline`, `node check.mjs gate baseline`, then `node check.mjs audio baseline SCENARIO` for quiet, single, horde, chain, pipe and controls. Repeat boot/gate/scenarios for candidate. Both versions replay the same stored input traces in seeded fixtures retaining 2,048 zombies and 32,768 particles. Most enemies are repositioned far away; label the recordings as controlled fixtures.
5. Run candidate stress separately to check the 22-background/32-total caps, independent nodes sharing buffers, priority cues, overload limiting and paused-source cleanup. Record accepted event timing and the pipe scheduler's `.65 / .35 / .16` second intervals. Keep the fuse and pause mechanics unchanged.
6. Capture actual post-master stereo Float32 PCM and canvas video. Report peak/true peak/RMS, clipping, source counts, pause/mute silence, frame/GPU time and audio sampling cost. Package individual before and after MP4/WAV recordings and measured results in Library. A level-matched comparison may supplement recordings at actual output gain.
7. Close through `node check.mjs close candidate`, then run `cleanup.ps1`; verify owned browser/server/monitor processes are gone and no GPU faults occurred. Return the GPU window through the parent.

## Release criteria and listening limits

The PR stays draft until actual browser loading/controls/voice/timing checks pass and the evidence is reviewed. CPU mocks and codec checks do not establish browser behavior or perceived quality. The user listened to and approved the selected-sample preview direction, then requested the final in-game death mix and tested release. No further subjective approval is required. Prioritize an individual horde-combat video with actual mixed deaths, impacts and debris. No supported agent listening tool was available, so no agent audition is claimed. The preview is not proof of final in-game mix quality. Preserve that distinction and any browser-test limits in the release report.
