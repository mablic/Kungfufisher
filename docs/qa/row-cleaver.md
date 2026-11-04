# River Cleaver: direct horizontal row

The stable kungfu skill ID now creates a row strike directly at the finger's
water depth, clamped to surface+48 through riverbed−140. There is no falling
projectile, one-sided traversal or wind drift. Its preview spans the full width
at that depth and keeps the aiming ring at the finger's horizontal position.
Charge does not limit this skill's row reach.

On the first simulation step after release, the skill sweeps existing whole-fish
hit regions across that row and finishes intersecting catchable fish, including
armor. Protected creatures and hidden burrowing fish are skipped. Fish outside
the row are untouched; fish entering later and replacement spawns cannot be
caught by the same cast. The visual is two cheap horizontal strokes lasting
260ms, after which the projectile slot is freed. Pause freezes it normally.

Each release still consumes one of three uses, advances combo once regardless
of fish count, and records an empty row as one miss. Score, relic drops, merged
feedback and existing caps use the normal catch path. The HUD hint and paused
field guide explain the new behavior. Other sword movement no longer contains
the obsolete descend-then-sweep branch.

Verification: TypeScript passed; 44 targeted gameplay/preview/collision tests
passed, plus both projectile stress tests. The campaign stress completed 1,134
rounds and 177,691 casts without stuck projectiles. iOS and Android production
Hermes exports passed. No new signed installation package or physical-device
playtest was performed for this change.
