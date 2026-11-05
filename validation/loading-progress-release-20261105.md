# Counted startup progress, November 5, 2026

This patch adds a loading percentage derived from completed startup steps: 60 at default quality, 61 when the low-cost rendering stage is required. Every compute pipeline is counted separately. World generation yields to the browser first; render shaders and pipelines, resource setup, initialization uploads and the first frame all finish before the screen reaches 100% and opens the game. Optional audio continues independently.

Failures preserve the last completed percentage, current stage and diagnostic report. Retry reloads the page without clearing saves. Gameplay keys do not run while loading or after failure. All 43 composed shader sources, gameplay behavior, save keys and audio/art assets are unchanged.

Runtime SHA-256: `71b8f1b8c1966d842d765f5c7adc58265d391eb4ac5af73a1665b6b7760fb43a`.
Rollback: `768fdd9ca517c194d15a0fc2b81188f7128596c4`, preserved at branch `backup/pre-loading-progress-20261105`.

Validation completed at checkpoint: six mocked-startup test groups, including standard/optional quality paths, GPU readiness fencing, eight failure cases, save-safe input gating and exact baseline/shader preservation; all 43 shaders pass Naga parse and semantic validation. The full CPU/source regression suite is running and its outcome will be added before merge.

The startup tests execute real orchestration with mocked DOM and WebGPU plus a stub first frame. They are not browser, rendering, performance or gameplay tests. Browser execution was previously denied and was not retried or bypassed. The owner authorized push, merge and live release with owner playtesting despite that limit.
