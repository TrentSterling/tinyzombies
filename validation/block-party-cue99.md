# BLOCK PARTY entry cue, November 15

## Outcome
Entering BLOCK PARTY now says, “Bring four neighbors to safety. Everyone already rescued counts.” It no longer claims four people are safe while the mission counter reads 1/4. This one quest entry uses the existing text-only mechanism.

The existing “Four saved” Chatterbox and Kokoro recordings stay in the asset bank but are no longer triggered by this quest. No recordings, voice selection, DSP, mixing, quest completion logic, saved counters, world, movement, difficulty or shaders changed. Retiming the old clip would compete with the following FORECLOSURE announcement, so this patch does not introduce a new audio queue.

## Evidence
Baseline public main was ab286297deb27da0ecd5cf57a5426cd302c3fc89, HTML SHA256 91cc5b7b5a1252a7305e273533a6861f74229f0dc031e36dd521d01071863d0c. Candidate SHA256 is 174363198212eea4f8d6bfd426a7af29a9313b1acadab0744320f863ed3c5141.

On PC1 Chrome with WebGPU, both exact baseline and candidate completed the ordinary Standard first-rescue, cheese-kick and trampoline sequence. Inputs were mouse start, WASD walking and E at the safe-room door; offline authored geometry and read-only snapshots assisted steering. No teleport, gameplay state writes or source instrumentation was used in the ordinary route. Both ended with 100 HP, one neighbor saved, none lost and no page errors. The actual candidate screenshot shows the truthful cue beside 1/4 progress. A fresh independent artifact critic accepted it with no in-scope faults.

A separate synchronous browser-host fixture ran after ordinary play. It temporarily arranged quest/counter state and recorded announcement calls, then restored it. It verifies that 1 and 3 saved stay in BLOCK PARTY without the false voice call; 4 saved transitions once to the unchanged FORECLOSURE cue. It does not claim an ordinary four-person rescue or GPU simulation of those counts.

The CPU regression executes the production quest path at 1, 3 and 4 saved, already-completed/skipped and repeated states, later shelter transition and run reset. It fails against the old entry as a negative control. Existing first-rescue, shelter gate, opening and special-infected tests pass. An exact-runtime comparison proves only the scoped entry replacement and all 43 shaders unchanged.

See tests/block-party-cue99-cpu.json and tests/block-party-cue99-playthrough.json. Reproduce CPU checks with `node tests/block-party-cue99.test.cjs`. The optional playthrough harness requires Playwright and an exclusive isolated GPU test window; set PLAYWRIGHT_MODULE and TINY_QA_DIR as appropriate. It is never run by ordinary gameplay.

## Limits and rollback
The runs were muted: no listening or perceptual audio claim. HTML was fulfilled locally from verified published bytes because direct live fetch failed PC1 sandbox DNS. These short routes do not qualify full ordinary evacuation, weak hardware, large-horde/collapse stress or performance improvement.

Rollback target is ab286297deb27da0ecd5cf57a5426cd302c3fc89, preserved as rollback/pre-block-party99-20261115 before release. Public Pages and exact served bytes must be checked separately after merge.
