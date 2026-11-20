# Tiny Zombies: Spitter boundary qualification

The outline is the ground-plane boundary for the player's center, not the visible puddle's size. The pool radius is 71/64 metres; the existing player test extends it by 0.25 metres. This patch changes the pre-impact warning only. It does not change the 8,192-actor capacity, damage or grace, pool allocation, committed target, readback cadence, or Brute warning.

Use a foreground WebGPU browser on the exact candidate and baseline `23ee4e77f1700a3ea1d8682e3d22312ccdcdfb60`. Use normal horde play first; a reproducible fixture may isolate one Spitter, but label that separately.

- With a live Spitter whose shot is committed, qualify default zoom 34 and close zoom 16 at 1280×720. Repeat at zoom 62 and a small viewport. Compare visible outline, title clearance, and canvas clipping. The direction of the radius change is not universal across viewport sizes.
- Use the committed target itself, not the Spitter's position or the original aim point. On otherwise identical attempts, put the player center 1.2 m and 1.5 m from it, first along screen-right ground direction and then along the ground depth axis. Verify the inner marker is inside and can take acid damage after landing, and the outer is outside and takes no acid damage. Use an available pool slot, no current hurt grace, and rule out other damage. Record actual HP and the Spitter state instead of inferring damage from pixels.
- Repeat muted, on a fresh restart, with normal movement, and with a target near the edge of the viewport. Verify no old-run warnings flash; new warnings still work muted. Try visible combat shake and motion because the HUD tracks sampled/smoothed camera coordinates while the world renderer can move independently.
- Do not treat the ring as evidence an acid pool landed. Its existing actor snapshot can lag; a committed shot can also land after the source dies even if its HUD cue disappears first. Those are separate behaviors, unchanged here.

Source/Canvas-stub tests can prove geometry and guard parity. They do not replace a rendered warning and damage playtest.
