# Last Train hardware qualification

This harness is a new Chapter 3 acceptance route, adapted from the qualified Chapters 1–2 ordinary-input route. CPU checks are not gameplay or shader compilation. The candidate is not qualified until a real hardware run and visual inspection pass.

## Transfer and prerequisites

1. Use the exact reviewed candidate commit in a separate test worktree. Keep the existing shipped commit `f895f7c09aaf564593896374e8f701960f669a4d` available for rollback/comparison. Do not overwrite an unrelated worktree.
2. Transfer the whole candidate checkout, including `index.html`, all 43 `assets/audio/*.flac` files, and this `tests/hardware` directory. Do not substitute an old private harness. `candidate.json` pins the required HTML SHA-256; both local and served bytes are verified, including reloads.
3. The operator must already have authorization for the test computer/browser. Use its approved, separately started Chrome test profile and loopback HTTP server. This script does not install software, start Chrome, change flags, start a server, alter permissions, import saves, or publish anything.
4. Node with built-in `WebSocket` is required (Node 22 or newer). No package installation is needed.

Set these environment variables in the test shell, then run `node tests/hardware/cdp-qa.mjs` from the candidate checkout:

- `TINY_CDP_URL`: the approved Chrome CDP endpoint, such as `http://127.0.0.1:9222`
- `TINY_QA_URL`: the candidate's loopback HTTP URL, such as `http://127.0.0.1:8080/index.html?seed=73129`
- `TINY_QA_INPUT`: the local candidate HTML path, default `index.html`
- `TINY_QA_OUTPUT`: a new or empty evidence directory outside the checkout
- Optional `TINY_ROUTE_WALL_MS`: total observation window, default 1200000 ms. Input holds and stall decisions use observed simulation time. Window exhaustion is incomplete qualification, not by itself a game defect.

The harness opens and closes only its own new browser tab. It uses ordinary keyboard/pointer input and read-only state telemetry. It records screenshots, screencast JPEG frames/timestamps, diagnostics, adapter identity and route evidence. It neither closes the browser nor clears/imports local storage. Raw evidence can contain a local test save and machine metadata; keep it private unless separately reviewed for sharing.

## Fresh or earned-checkpoint entry

Default: a dedicated profile/origin without a campaign save. It must earn Chapter 1, both Burnout fuel pours and extraction, then enter Last Train. Chapters 1–2 waypoints and combat policy are preserved from the accepted route; the old map-2 terminal assertion is replaced by Chapter-3 continuation.

Optional: resume the existing, naturally earned Burnout checkpoint on the same origin/profile. Set `TINY_QA_RESUME_REPORT` to the prior accepted `route-report.json`, and `TINY_QA_RESUME_WRAPPER` to its accepted `report.json` (defaults to the sibling file). The script requires prior success and an exact byte match between the existing save and the report's `burnoutCheckpoint.raw`. Do not set or copy storage to make it match. This mode explicitly marks Chapters 1–2 as not played in the current run. A matched prior Chapter-1 report is also supported to replay Burnout first.

## Chapter 3 route and assertions

- Earned map-2 save → Last Train. Capture health, inventory, upgrades, seed and campaign totals. Backspace retry and reload/Enter must restore that same entry and leave the map-2 save unchanged.
- North start door: approach `(-36,13.2)`, check the actual door interaction, then go north and east through the subway.
- Panel `(-8.5,-0.5)`: idle without E, interrupt a partial hold and verify reset, then hold eligible E continuously for two simulation seconds. Release, pause briefly, and move away. Countdown must freeze with the simulation and otherwise open autonomously at 15 seconds.
- Continue via `(-10.5,-11.5)`, `(18.5,-11.5)`, `(18.5,7.5)`. Visit the Maintenance heavy rifle at `(8.6,10.64)` through the connector route.
- Final safehouse still faces west. Approach `(29.9,8)`, gather at `(35,7.5)`, seal at `(31.9,8)`. Require all four survivors alive and strictly inside the source safe-room inset, powered gate, closed red door and earned victory.
- Save map 3; verify the complete entry chain and bracket saved leg time between the source victory timestamp and later observation (the clock continues after victory). Bound kills by entry totals and later chapter counters; exact accumulation is also CPU-tested. Repeated Enter must stop at the explicit Chapter-4 boundary. Reload and Backspace must restore the original Chapter-3 entry, including seed, totals and all survivor inventories.
- Verify all 43 audio files decoded, no GPU errors/device loss, preserved allocation limits and complete shader boot. Decode validation is not a subjective audio-listening test.

Inspect the video/screenshots for the north exit, solid trains, panel/objective text, correct map label, Maintenance connector/rifle, all-four extraction and completion screen. Record the actual adapter and frame/GPU timings; do not compare software rendering with hardware performance.

## Additional hardware cases and scope

The main route tests human power operation. Explicit X-order bot operation, naturally occurring pin/down/revive behavior, leaving range during a partial hold, and negative seal/occupancy/reopening cases need separately observed ordinary-input scenarios. Source/CPU tests cover their rules; do not label unobserved scenarios as hardware-passed. A bot-order retry must begin from the earned Chapter-3 entry, never injected state. Pause releases input; it is not proof of continuous E across a pause.

No Chapter 4–5 gameplay or full five-chapter parity is claimed. Keep publication behind independent review and hardware acceptance.
