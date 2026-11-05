# Swept escort clearance release, November 5, 2026

The owner explicitly requested this backed-up work be pushed, merged and made live despite the outstanding gameplay qualification. This publication is not a claim of completed browser or GPU testing.

The follower direct-route check now covers each complete short movement segment, including static walls and dynamic wreckage, rather than sampling only body positions. This closes the three reproduced oblique corner gaps. Navigation fallback, movement, rewards, damage and the other 42 shader sources are unchanged.

Exact runtime SHA-256: `48fd73e387377bda99370313b8901d90fe6d39c2994a5f9bdfd0054c7260aad4`.
Rollback commit: `710692f03272292d0694cae4846afb6949979003`.

All 95 CPU/source suites pass. All 43 composed shaders pass Naga parse and semantic validation. Three deterministic regression cases and a 50,000-path CPU stress fixture show no missed swept intersections with this correction. The sampled predecessor missed 525 intersections in that artificial fixture; the conservative correction rejects 557 otherwise clear routes. Those counts are geometric test cases, not gameplay statistics. Reports and exact source hashes are checked in alongside this note.

Limitations: conservative segment boxes can reject safe diagonal shortcuts and use the existing fallback. Ordinary escort success, narrow passages, moving debris, repeated rescues, visuals, audio and GPU cost have not been playtested for this build. Browser execution was previously blocked, and that denied operation was not retried or bypassed. Occupancy reads can increase even though loop iteration count is unchanged. No performance improvement is claimed.

If this causes an escort or performance regression, restore the rollback runtime from the commit above. Public history and a pre-release rollback branch preserve it; the full candidate and evidence are also backed up privately. Existing audio/art assets remain byte-identical to the baseline.
