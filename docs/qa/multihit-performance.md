# Multi-hit optimization — October 22, 2026

## Changes

- Memoize Ocean independently of HUD updates; existing stable asset callbacks and shared game state keep UI-thread animation live.
- Combine positive hit feedback within 80 ms, showing summed points and the number of catches. Negative turtle penalties and armor feedback are not merged with rewards.
- Cap feedback at three groups (previously six); balanced/minimal removes impact motes and the blurred halo. Ordinary balanced scenes no longer auto-promote to full decorative effects after a quiet period.
- Compact effect arrays in place rather than allocate replacements each physics substep.
- Rate-limit ordinary hit/chip audio and haptics to 90 ms. Priority rare, clear and win cues remain available.

## Regression evidence

Deterministic tests exercise 24 simultaneous catches and 24 armored hits at an area impact. They verify every score/health change, one combo increment, one manual use, combined feedback, feedback expiry and the bounded feedback pool. These are simulation/feedback tests, not GPU frame-rate measurements.

## iPhone 13 verification still required

No physical iPhone 13 was connected during this change. Do not interpret passing Node tests, Hermes exports, or simulator results as proof of a stutter-free phone build.

Use a Release/TestFlight build, ordinary power mode, then repeat in Low Power Mode and after at least 15 minutes of play. Exercise all seven manuals, including storm hitting a dense school, piercing several fish, armored fish, and fog/rain/night conditions in late chapters. Include sounds and haptics, not just a silent run.

Record frame timings with Xcode Instruments on the device. Target 60 fps (16.7 ms frame budget), inspect p95/p99 and clusters of frames over 33.3 ms around impacts, and compare against a single-target cast. Verify that counts and score remain correct and all warning/aim cues remain visible at minimal quality. This measurement must be completed before claiming an iPhone 13 performance guarantee.

## Android build diagnosis

Build `1efc74f0-06d8-4e75-85ba-96b02fc67cc2` uploaded successfully and created credentials. In Run gradlew, R8 minification overlapped with native Worklets compilation, then the Gradle daemon disappeared. This is consistent with memory pressure or a process crash; the available log does not prove which process exhausted memory.

Production Android now limits Gradle to two workers and disables parallel project execution. The existing large worker setting is retained. This reduces competing build tasks, but it has not yet been verified by another cloud build; no paid EAS job was started for this change.
