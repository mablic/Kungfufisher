# Validation run — 2026-10-21

Environment: macOS, Xcode 27.1, iPhone 17 Pro simulator on iOS 26.5. App version 0.2.0. Product language: English. User-facing gameplay remains a single level.

## Automated checks

- TypeScript strict checking passed after the UI-runtime refactor.
- 12 tests passed, including a native-worklet dependency-order regression guard and the plain serialized-state lifecycle (not only the class testing facade).
- English UI text scan: no Han characters in App.tsx or src/.

## Native interaction checks completed in Expo Go after the crash fix

- Begin fishing: entered gameplay repeatedly, with score 0 and timer 75.
- Complete no-input round: 75-second countdown reached the English timeout/result screen without exiting.
- Stationary 1.5-second hold/release: a spear was thrown; a real catch showed +10, score 10, and the updated coach text.
- Drag/release: aiming input completed without native exit.
- Pause: modal appeared and timer/fish stopped; restart confirmation retained the paused timer until confirmed.
- Confirm restart: score reset to 0 and timer to 75; game returned to play.
- English help opened and closed with readable three-step instructions.
- English timeout, results and retry were visibly inspected.

## UI scheduling measurements

Measured using the UI frame callback over 600-frame windows during real native gameplay. Representative steady-state windows were 60.0 fps, p95 16.7 ms, p99 16.7 ms, zero gaps above 34 ms. A 59.8 fps window had one gap above 34 ms. An initial/build-contention window measured 52.8 fps with p99 26.7 ms and four gaps above 34 ms; it is not omitted from this record.

These numbers measure UI callback delivery on this simulator, not GPU presentation on a physical phone. They do not justify a universal 60-fps guarantee. A standalone Release run and actual device measurements are separate gates.

## Release verification and remaining gates

- Standalone simulator Release build completed with 0 errors and 2 warnings. Metro was stopped; the installed app cold-started and played independently.
- Release run completed the win path at 170 points, 8 fish, 62% accuracy, 31 seconds remaining. Repeated full-charge casts, timeout/retry, pause/restart and local best-score persistence were verified.
- The new consecutive-hold regression test verifies that charging the next cast is allowed during the previous spear flight, while still enforcing one spear in flight.
- Animation Hitches recording was attempted against the Release process. Instruments reported “Hitches is not supported on this platform.” The failed trace is not counted as a GPU performance pass.
- Physical iPhone testing, memory/thermal sessions and extended crash-free soak testing.
- App Store launch assets/metadata and dependency advisory resolution.

No blanket production-ready certification is made by these checks.

Final cold-start check: the standalone Release app restarted with Metro stopped and restored BEST 170. It was left on the English landing screen, ready to play.

## Motion polish follow-up

- Typecheck and 14 tests passed after the articulated-arm and fish-steering changes.
- Native gameplay and a full 6-second hold were recorded. Frames confirm the hand rising above its resting pose, the spear staying attached to the grip, full-charge guidance and return after release. A real catch scored 20 in this run.
- UI scheduling windows with the mesh animation active included 60.0 fps / p95 16.7 ms / p99 16.7 ms / zero gaps above 34 ms. A 59.7 fps window had two gaps above 34 ms. These remain simulator UI-scheduling samples, not physical-device GPU certification.
