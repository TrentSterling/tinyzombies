# First-rescue roadmap qualification (November 13, 2026)

Runtime baseline: `9348ea88560b4312b5bc012d3579664dc680bcef`.
Candidate runtime SHA-256: `de4e9d29aa59902a7f79d626b14bc0549b04f478715af64fe4ef6c74e84c7e25`.
Early GitHub checkpoint: `612993c3da475c0ce3f77ed6ad9b4e1b06306a00`, branch `gameplay/first-rescue-roadmap-20261113`.

## Scope

Improves existing systems rather than adding parallel mission/director implementations: first exit/find/return markers, start-room rescue, separation warning, five-minute Standard opening, opt-in Hard intensity/recovery scheduling, wider/longer soda distraction, swept follower portal crossing, spitter acid progression shared across Maple and campaign, and distinct visible spitter/brute attack tells. Existing special types remain.

No audio file, voice routing, save-key, map generator, rendering-quality, networking, dependency version, or legacy mode selection was changed. The 100 matched Chatterbox and 100 fallback Ogg files are byte-identical to the baseline. The configured 2,048-infected pool is retained; the opening changes how many begin active and when held arrivals enter.

## Reproducible qualification

- `node tests/roadmap96-opening.test.cjs`: production CPU host verifies default/explicit modes, pre-start-only F4, exit/find/return/separation guidance, arrival caps, low-health holds, intensity peak/fade/recovery, and the difficulty uniform.
- `node tests/roadmap96-specials.test.cjs`: narrowly translated production WGSL fragments verify spit expiry/one-time allocation/full pools/mode call placement and near-portal crossing. This is CPU evidence, not a GPU claim.
- `node tools/wgsl-validator/validate.mjs`: all 43 exact composed shaders parsed and semantically validated by pinned Naga; negative controls also passed. See `tests/roadmap96-wgsl.json`.
- `node tests/roadmap96-gpu.cjs`: local request fulfillment, installed Chrome WebGPU on PC1 NVIDIA Blackwell. Test-only hooks are injected in the served copy, never the shipped runtime. Fixed committed spit lands once and becomes inactive; four followers cross the opened starting door and become rescued; no page errors. See `tests/roadmap96-gpu-result.json`.

The GPU fixtures are controlled conditions, not an earned gameplay run or performance benchmark. The external font request is deliberately blocked by the offline fixture. The Playwright require path in that fixture points to the already-installed PC1 copy and may need adjustment elsewhere.

Historical WGSL grouping/swizzle test suites contain inverse-source/hash checks tied to earlier releases. Those checks already fail on baseline9348ea8; the current all-shader lexical and semantic guards pass. They are not relabeled as a green full historical suite.

## Limits

Ordinary input verified title-screen Hard selection, exit-to-find mission guidance, and the visible soda countdown with no page errors (`tests/roadmap96-smoke.json`). The bounded input sequence did not reach/recruit/return a neighbor, so ordinary full-loop usability is not claimed. Controlled GPU readback additionally verified a common infected prioritizes a landed can 15 m away over a visible player, a spitter ignores the can, and an infected outside a closed door has no player knowledge while the scene stays quiet. No claim of a full street evacuation, all-seed escort coverage, difficulty balance over a whole run, 600-awake horde performance, building-collapse stress, weak-PC support, or listening-based voice mix/repetition qualification. A follower can still stop at a conservative/shared-field routing minimum; the separation marker makes this visible.

## Serial startup comparison

The first ordinary smoke took 41.3 s under concurrent GPU work. That warning was investigated before release: sequential fresh-Chrome runs with identical 1280x720 flags, no gameplay/video, and local assets measured baseline 15.369 s, candidate 12.741 s, and candidate repeat 12.117 s. The long result did not reproduce. These are three observations, not a universal performance guarantee or proof of why the earlier run was slow. See `tests/roadmap96-startup.json`.

## Rollback

Baseline `9348ea88560b4312b5bc012d3579664dc680bcef` retains the exact prior runtime and all voice assets. Restore its `index.html` in a new commit rather than force-resetting main over later user work. Keep the candidate branch and test evidence.
