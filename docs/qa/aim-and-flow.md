# Finger-limited aim and streak rewards

The aim preview now samples the real wind-bent projectile only up to the finger's
world-space distance/depth, bounded by the current charge's reachable distance.
Its final segment is clipped, so ordinary and long-range skill previews no
longer continue past a shallow target to the riverbed. This changes guidance,
not projectile range, damage, wind physics or targeting. Sampling retains the
existing hard bound and usually performs fewer steps for shallow targets.

The first 3-catch streak and first 6-catch streak each grant two seconds, capped
at four seconds per run. Existing bestCombo prevents repeated awards after a
miss or paid/rewarded overtime. Multi-target attacks advance the streak once per
release, as before. Misses and protected-creature hits still break the chain.
The existing merged score effect displays +2s; no new particle system or frame
callback is added. The HUD indicates the next threshold and the paused field
guide explains the rules. Full reset clears eligibility through bestCombo=0.

This complements the existing choices between ordinary catches, gold fish,
armored visitors and limited-use techniques. Further additions should be checked
against actual play sessions rather than assumed to improve retention.

Focused tests cover clipping for normal and skill shots, wind/charge range,
non-mutating preview generation, one-time rewards, actual scored catches and
resets. Campaign/stress frame limits now allow the legitimate four bonus seconds.

Validation: TypeScript and Android production Hermes export passed. The focused
42-test aim/gameplay suite passed. Campaign/runtime tests passed after updating
the seal-expiry test to advance through remaining time (including earned bonus
seconds); that test also passed independently. All-level projectile stress
completed 1,134 rounds and 165,565 casts without a stuck projectile. No native
store build or physical-device FPS/retention test was performed.
