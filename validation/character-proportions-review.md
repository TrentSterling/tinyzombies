# Character proportions: source checkpoint

The character builder compressed squad members to 82% height during healing/reviving, 42% when downed, the player to 45% when downed, and damaged zombies to 55% when converted into crawlers. These were whole-model Y scales. Walking bob, arm/leg movement, flinch and attack gestures are position offsets and remain intact.

The candidate removes the busy-state squash and uses axis-aligned rigid poses for downed survivors and crawlers. Cuboid centres and extents rotate together; heads and limbs retain their dimensions. Authored art, palettes, static zombie-type sizes, SFX, counts, collision, AI, damage, spawning, objectives and all host code remain byte-identical. Crawlers retain their existing gameplay state. Dead zombies still use the existing particle path.

Only the `boxes` presentation shader changes. Low poses are cleared before rendering the next actor or attachment. Crawler culling uses a conservative bound for the longer lying silhouette. Existing collision volumes are deliberately unchanged, so the rotated silhouette's overlap and hit readability require hardware review before release.

Baseline: `c28921129fad8a4b12dfc647757302f406841943`, HTML SHA-256 `fedee3e5054b56841bda85903d261cb740e955a289a4e5ddcfc6d17b67f76192`.

Proportion-only candidate: 398,094 bytes, SHA-256 `52cc1f3f2ddba7a8277685b0d1ded88982b47a88a7fafdc0b3ebe146144539f8`.

[CPU evidence](character-proportions-cpu.json): 37,544 geometric cases pass, including all 327 zombie cuboids, all 16 squad parts, four facings, 24 translation samples, live/busy/downed states and the player head. The 28,896 unaffected upright cases are exactly equal to the baseline. The extracted `part` source executes with restricted vector-operator substitutions; dimension and pair-distance checks establish that the new low poses do not stretch geometry. These are not WGSL compilation or gameplay evidence.

```text
node tools/check_character_proportions.cjs PATH_TO_BASELINE_HTML index.html validation/character-proportions-cpu.json
```

Hardware validation remains pending Jet's handoff: shader boot and one-frame gates, then a bounded before/after normal gameplay recording covering movement, attacks, healing/revive, downing, crawler conversion and respawn. Inspect low-pose ground contact, weapon alignment, silhouette/hit readability and transitions. Stop on device loss/reset; do not launch the original V9. No GPU lease was acquired for this source checkpoint.
