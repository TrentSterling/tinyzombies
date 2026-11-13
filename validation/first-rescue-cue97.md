# First-rescue cue correction (November 13, 2026)

Confirmed conflict in public main `99f21674959c15976e72da86227a78f3b6a56d88`: GOOD NEIGHBOR radio sent the player to the fallout shelter, while the first-follower marker directed them back to their starting safe room.

Only two runtime JavaScript lines changed. The first-rescue subtitle now explicitly says to find a neighbor, walk up to them, and return inside the starting safe room. This cue is text-only: its announcement call is skipped, so neither the contradictory recorded line nor fallback TTS plays. The later LAST BUS OUT fallout-shelter announcement is unchanged and remains voiced. All voice assets are preserved; no new clip was generated.

Candidate SHA-256: `879b4e28528cb29205f5c23dcd3a436d473974b0f7140bccee73da91929ecdd8`.

## Checks

`node tests/first-rescue-cue97.test.cjs index.html <baseline-index.html>` passes production-host assertions for the first cue, matching return marker, suppressed first-rescue audio/TTS, later shelter voice, and retry opening voice. It fails on the old public source's contradictory subtitle. All43 composed shader strings are byte-identical to the baseline. The entire assets tree remains `6b14e56d3dc93e41c8ec102337b904d662b462a7`.

Actual WebGPU Standard mode, headless Chrome on PC1: normal keyboard inputs exited the safe room and triggered mission2 at7.98 seconds. Screenshot inspection confirmed the corrected subtitle is visible and consistent. Readback was used to steer the inputs; no positions, counters, or other game state were written. No page errors. See `tests/first-rescue-cue97-smoke.json`.

This narrow correction does not claim a full normal-input rescue/evacuation or listening-based audio quality test. It changes no gameplay balance, navigation, shaders, startup behavior, or later mission cues.

Rollback is `99f21674959c15976e72da86227a78f3b6a56d88`, preserved on `rollback/pre-first-rescue-cue97-20261113`. Restore its two cue lines in a new commit rather than resetting over later work.
