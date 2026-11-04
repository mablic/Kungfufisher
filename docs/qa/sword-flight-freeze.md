# Sword stopped underwater — investigation, 2026-10-23

## Confirmed reproduction

The campaign stress test failed **before the fix** on level 1, Lotus Wheel
(`spin`), seed `4294967295`, frame 3297. The projectile remained at
`(247.01949363130606, 723.932708224504)` with velocity
`(13.474231214125163, 849.8931962859735)` and remaining range `4.25e-322`.
This was reached through normal aiming and shooting, without injecting invalid
state. A separate regression test preserves that exact terminal state.

`stepOneSpear` computes flight time as `rangeLeft / speed`. Floating-point
rounding can leave an extremely small positive range. Eventually that division
underflows to zero: the sword no longer moves or consumes range. The old
`rangeLeft <= 0` condition never removes it. `releaseGame` rejects new casts
while either sword exists, so every subsequent throw is blocked for the rest
of the round.

The fix treats remaining range <= `1e-6` pixels as exhausted. This is below any
visible movement; it does not change skill damage, speed, range in practice,
charge consumption, difficulty, or graphics quality. Both main and twin swords
use the same cleanup path.

## Automated coverage

`tests/projectile-stress.test.ts` covers:

- Exact reproduced stuck state: sword removed, cooldown completes, next cast
  succeeds.
- All 42 levels × normal sword plus 7 techniques × 3 deterministic seeds:
  1,008 complete rounds and 131,424 casts.
- Mixed 60/90/120 Hz frame intervals, 1.5-second late frames, pause/resume,
  off-screen aiming, different charge strengths, live collisions and pickups.
- Finite projectile coordinates/range, bounded effects/pickups, flight finishes
  within six simulation seconds, and every round reaches a result.

The complete campaign stress test failed before the fix and passed after it.
Run `npm run typecheck`, `npm test`, and an iOS Expo export for release checks.

## Limits and physical-device follow-up

These tests execute the shared physics rules in Node. They do not measure
physical-device FPS, validate the Skia renderer, or prove that every reported
freeze has the same cause. This defect blocks shooting but does **not** explain
all fish, countdown, and native buttons simultaneously freezing.

No physical iPhone is connected to this workspace. On the next TestFlight
build, exercise Lotus Wheel, Dragon Lance, Twin Swallows and River Cleaver at
full charge repeatedly, especially with empty water near the end of range.
Then switch out and back, pause/resume, complete a round, and use rewarded
overtime. If the entire screen stops, retain the build number, level, equipped
skill, approximate time, and a device hang/crash diagnostic. That case requires
native evidence rather than attributing it to this projectile bug.

Source edits do not update an already installed TestFlight build. Build and
upload a new binary before physical verification; keep production remote build
auto-increment enabled.
