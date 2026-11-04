# Two-star progression and effect spikes

## Changes

- New progression requires two stars in the previous river. One star remains a saved result. Previously played rivers remain accessible, so existing saves are not stripped of played content. Development map access remains unrestricted.
- Result navigation checks the actual progression rule; one-star results cannot expose a new river through the Next level button. Home, map accessibility text, briefings and field guide explain the two-star gate. Home recommendations prioritize unfinished progression before three-star mastery.
- Chapter manual rewards and manual pools now use two-star milestones at 6/18/30/36. One star on a milestone does not grant the pair. Existing scores/stars/seals are retained.
- Two-star targets were recalibrated with scripts/calibrate-advancement.ts instead of inheriting the previous high midpoint targets. First six targets are 170/250/320/380/440/480. Subsequent gates add score pressure relative to the old one-star progression. Existing fish speed, population and weather tuning are retained; no additional creatures or render resolution reduction.
- School impacts and active area techniques temporarily bypass decorative fish mesh deformation. Position, sprite texture, heading, hit flash, collisions and all gameplay continue normally. Offscreen fish skip mesh calculations. Fish renderers are memoized and retain stable slot keys when visitor species change.
- Fog has 12 bounded lights rather than 24, with no burst-generated lights. This removes impact-specific full-screen shader work while preserving the existing fog density and projectile illumination. Catfish silt uses a gradient instead of a blur pass.
- A frame over 50ms immediately selects minimal decorative effects, then existing gradual recovery applies. This reacts to isolated spikes that could be hidden by the previous 60-frame averages.

## Validation

- TypeScript and dual-platform production Hermes exports.
- Full automated suite: 126/127 initially passed; remaining failure was an outdated six-fish opening assertion expecting eight fish at level 6. Updated to the accepted six-level tutorial and rerun successfully. New progression / impact-pressure tests pass. Independent-seed level checks additionally verify two-star gates remain reachable and the first six remain welcoming.
- Projectile stress: 1,134 rounds / 178,471 casts with mixed frame rates and interruptions, no stuck projectiles.
- Updated fog shader compiled successfully with local CanvasKit.

No physical iPhone/Android profiling or signed release installation was performed. These changes remove identifiable costs but do not establish a measured FPS or prove all hitch sources are resolved. Release QA should exercise simultaneous armor/catches, row/full-screen skills in fog, pause/resume, two-star milestone rewards, one-star map/Next behavior, old saves and rewarded-ad continuation.
