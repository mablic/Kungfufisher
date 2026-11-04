# River & Steel — single-level quality review

Scope: one portrait React Native iOS fishing level. English product language, Chinese wuxia art direction. This is an engineering release record, not an assertion that App Store certification or physical-device QA is complete.

## Review findings addressed

- Replaced geometric placeholder mountains and character with painted rice-paper/jade environment, a faceless douli-hat swordsman with jian, hanfu, cloak and sash, and a river-fish atlas. Assets are local and decoded once.
- Replaced the screen-covering opening dialog with an illustrated landing screen and lower action panel. During play the compact score, timer and pause control leave the character and fishing area visible.
- Replaced unsupported platform-font assumptions with a bundled, OFL-licensed Cormorant Garamond font. English labels, help, coach hints, species, errors, pause and results use the same vocabulary.
- Replaced the JS-driven simulation and scene snapshot bridge with UI-runtime simulation, native manual touch gestures, shared state and Skia drawing. React receives semantic HUD changes, not animation frames.
- Changed fish direction presentation from instant mirroring to a short continuous turn. Changed initial placement to separate fish in each shared lane.
- Added readable dashed aiming line, range marker, charge bar, full-charge haptic, spear trail, recoil, hit ring, particles and score pop. Hold duration, not unsupported phone pressure, controls range and speed.
- Fixed consecutive holds: a player can prepare the next charge while the previous spear is flying; a release still requires the spear to have returned.
- Fixed stationary holds: a Pan recognizer can finish without activation if no move event arrives. A native manual recognizer now activates on touch-down and casts on touch-up, while cancellation discards charge.
- Added pause, resume, confirmation before clearing a paused run, results, retry, local best score, persistent haptics preference, resource loading/retry and a recoverable runtime interruption screen.
- Moved collision endpoints to the exact point the spear's remaining range expires, including fish movement over the clipped flight interval.

## Crash incident and regression protection

The first UI-runtime migration could abort Expo Go when Begin fishing was pressed. The worklet compiler captured `cancelAim` before it was initialized; `advanceGame` also captured `stepGame` before initialization. These references work in normal JS function hoisting but became undefined in the generated UI-runtime closures. Crash reports showed SIGABRT on the main thread, and an error boundary around the UI action exposed `startGame_gameTs9` calling an undefined function.

Functions are now declared in dependency order. The rule is covered by a TypeScript AST regression test, in addition to serialized-state lifecycle tests. UI-action and frame exceptions are routed to a recoverable English screen rather than left as uncaught native runtime exceptions. Native interaction QA is required because a Node test alone did not exercise this failure.

## Verification protocol

1. Typecheck and game tests: swept collisions, scoring once, pause, timeout, win/restart, multiple heights, charge cap/cancel, near/far range, plain serialized state, visual turning and initialized worklet dependencies.
2. Native interaction: cold load, how-to-play, Begin fishing, stationary hold, drag, successful catch, pause freeze, resume, restart confirmation, timeout/results, retry, home and preference persistence.
3. Animation sampling: UI-frame callback samples collected over 600-frame windows with average cadence, p95/p99 intervals and intervals over 34 ms. This measures UI scheduling, not a GPU display guarantee. Initial launch/build contention and steady-state windows must be reported separately.
4. Release build: compile/install the simulator Release app and run without Metro. Verify the same interaction path in that app; an exported JS bundle alone is insufficient.
5. Remaining release gate: physical iPhone Release tests (at least an older supported device and a current device), thermal/battery and memory runs, interrupted audio/system interactions if audio is added, app icon/store screenshots/privacy metadata, and user acceptance of the art/play feel. No blanket production-ready claim until these gates pass.

Actual run results are recorded in VALIDATION.md as checks complete.

## Dependency audit

The registry audit on this workspace reports 20 high findings, propagated largely through build tooling (`braces` deeply nested-pattern denial of service and `node-forge` certificate signature verification). Its suggested framework fixes include downgrading Expo to SDK 44 and React Native to 0.72, which would invalidate the current native stack; those suggestions were not applied blindly. The app has no remote content, certificate-verification flow, user-defined build glob patterns or backend. This does not dismiss the advisories: dependency review and a fresh audit remain public-release gates, tracked separately from visual/interaction acceptance.

## Motion polish follow-up

The existing character texture is articulated with a contour-masked sleeve/hand layer hinged at the shoulder; no new raster art is needed. `src/pose.ts` defines the shared shoulder/grip transform used both by the renderer and the projectile origin. The arm lifts progressively, releases into follow-through and settles smoothly. The aiming ray retargets the finger's stored world position as the grip moves.

Fish now have per-fish velocity, smooth speed changes, species-specific short bursts, depth steering, curved reversals, mild passing separation, pitch and a tail wave tied to swim effort. A 24-vertex texture mesh bends each tail with a taper toward the head, so the body collision area remains readable. All simulation and mesh changes remain on the UI runtime. Pause freezes limb, tail and movement clocks together.

New tests verify hand elevation, aim alignment, release-origin agreement, return motion, continuous fish positions, depth/boundary safety, speed variation and tail-clock progression. Fourteen tests pass. Native recording frames were inspected at rest, full charge and release to confirm that the hand visibly rises and the hinged sleeve does not leave a duplicate arm.
