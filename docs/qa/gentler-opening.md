# Gentler opening and less surface crowding

Levels 1–5 now contain six fish rather than eight. Their speed multipliers are
0.72 / 0.78 / 0.82 / 0.86 / 0.90, without the later campaign's extra multiplier.
Level 1 lasts 60 seconds; levels 2–5 last 75 seconds, without the late-game time
deductions. One-star goals are 100 / 160 / 210 / 250 / 290. The fourth level's
optional combo seal needs three catches, and the fifth needs three mandarin
fish. Each introduced creature remains in its original introduction level.

Six-slot rosters spread their starting lanes over the water column. In larger
rosters, slot 6 no longer repeats slot 1's surface lane; existing middle/deep
lanes stay close to their old depths. Shallow ordinary fish periodically dive
by up to 110 logical units with eased vertical steering. Species with authored
vertical motion retain it; protected animals and burrowing fish retain their
special routes. Movement stays inside existing water bounds and pauses during
Time Seal. No fish, particles, textures or frame callbacks were added.

Regression coverage checks starting surface occupancy across all 42 levels,
visible dives, water bounds, population limits, optional early visitors,
protected animals and Time Seal. Automated bot balance uses 24 casual and 24
skilled seeds per level. These simulations do not replace physical-device UX
or frame-rate measurement. Rendering resolution is unchanged by this update.

The same bot survey identified later score thresholds made less attainable by
the new depth routes. One-star goals were reduced in levels 13, 14, 24, 29,
31, 32, 34, 35, 37 and 38; level 10's three-star goal was reduced from 1850
to 1830. Later rosters, weather, time limits and speeds are unchanged.

## Full-fish strike regions

Collision now sweeps against atlas-derived opaque-content bounds in fish-local
coordinates instead of the old small center ellipse. All 20 species include
head, trunk and tail; scale, art offset, facing, dive pitch and puffer inflation
are respected. Transparent cell margins are excluded, with modest padding for
mesh flex and input forgiveness. This is a generous bounding region rather than
per-pixel alpha collision. No per-frame texture reads or masks are introduced.
Protected-creature warnings use the same region as actual casts. Area skills
still spare protected species, and armor still takes the original number of hits.
The old eel/front-only and swordfish/bill-exclusion instructions were updated.

Full-body targets intentionally increase catches and optional seal awards; the
bot regression no longer enforces the former small-hitbox rarity caps. It still
checks casual clearability, skilled three-star/seal reachability, and whether
accurate play improves aggregate scores. This avoids raising difficulty again
solely to compensate for the requested more forgiving hit regions.

Final validation: TypeScript passed; 76 focused tests passed across collision,
skills, gameplay, protected creatures, vertical movement, all-level bot balance,
Time Seal, worklet dependencies, projectile stress and runtime safety. The stress
suite covered all 42 levels and every technique under refresh/pause variations.
Android production Hermes export passed. No new native AAB was built or uploaded,
and this update has not been measured on a physical device.
