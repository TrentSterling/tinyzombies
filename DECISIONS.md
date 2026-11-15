# Decisions

## November 15: repair terminal credit without changing the ending rules
The production HUD defines victory as player state 67 equal to 1 and defeat as 2. LAST BUS OUT used a broad positive-state predicate, but its only caller excluded both outcomes, making the completion unreachable during normal rendering. The candidate changes that predicate to exact victory and invokes the existing quest routine immediately before the existing Maple Street evacuation card. Repeated frames are idempotent through the existing quest index, with no new latch or save key.

The intended change is the missing final 1000 quest points plus existing jingle/sign-off and completion presentation. The evacuation card, earlier quest definitions/conditions, simulation, counters, combo formula, saved/lost handling, voice assets and DSP stay unchanged. The renderer check exposed the transient quest banner showing through the card. A terminal-only presentation flag suppresses that redundant banner; the existing radio subtitle and mission-complete label remain readable beside the card, accepted on the final second visual review. A fixture is explicitly not an earned clear or overrun; no full-route claim follows from it.

## November 15: correct a demonstrated cue, not general wayfinding
An ordinary Standard route completed rescue, cheese and trampoline without a new marker. Independent review found the existing cheese guidance sufficient. No extra marker or rebalancing was added.

The next mission displayed 1/4 saved while its radio claimed four saved. The quest system speaks the next entry immediately when the prior activity completes, so the text was a completion statement in an entry slot. Use a truthful instruction and the existing text-only flag. Keep counters and completion conditions unchanged.

The former Chatterbox/Kokoro take remains in the bank but is unused by this quest. Moving it to completion would compete with the next quest's existing announcement or require a new queue. That is deliberately excluded from this small repair. All other recorded lines and DSP remain intact.
