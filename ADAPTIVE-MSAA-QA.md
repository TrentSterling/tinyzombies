# Tiny Zombies: adaptive MSAA transition QA

The ordinary link starts with 4× MSAA. When the automatic quality governor requests 1×, the game must continue drawing with matched 4× resources until both 1× pipelines and bind groups are usable. After activation the next HDR pass must use matching 1× color and depth attachments. This is a renderer reliability check, not a claim about FPS.

## Default-quality route

1. Use a foreground hardware-WebGPU browser with a fixed viewport and the same seed, `?sandbox&seed=73129&horde`. **Omit `tier`, `q`, and `msaa`:** any one locks automatic quality. Keep the full 8,192 capacity and note actual build/head.
2. Play a repeatable full-horde route until the governor changes tier on sufficiently loaded hardware. Capture requested and active sample counts (`__tiny.diagnostics.quality.msaa` and `actualMsaa`), dimensions, and frame submissions before preparation, during it (if observable), and after activation. The optional [browser A/B harness](https://github.com/TrentSterling/tinyzombies/blob/db0c196db3f3d324c3fdcdd00c38d07e913d9c63/tools/BROWSER-PERF.md) records actual samples, render dimensions and submitted-frame intervals without changing the default cadence in normal mode. Record any WebGPU/device or missing-pipeline error. Do not count runs without a transition as evidence.
3. Confirm the game remains visible and controllable with both voxel and exposed-face geometry throughout. Observe stable 1× after preparation, or continued rendering at 4× if optional preparation fails. Include a case where later automatic tiers reduce dimensions. Report adapter, browser, seed, route and actual sample progression.

Keep fixed `tier=0&msaa=4` and `tier=3&msaa=1` runs as separate startup/speed controls. Those runs do not exercise automatic transition. Source fixtures intentionally delay or reject preparation; they qualify race handling, not real compile latency or crash frequency.
