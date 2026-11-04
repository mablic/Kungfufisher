# Strike feedback pass

Feedback now distinguishes ordinary catches, armored strikes, heavy/golden
finishes and protected-creature penalties without changing damage, hitboxes,
projectile timing, catch rewards, level balance or simulation time.

- Eight original short mono PCM cues replace the longer catch/chip/rare bank
  and add one heavy-finish clip. Ordinary hits last 190ms, armor 160ms, heavy
  finishes 300ms, rare finishes 650ms. Music assets are unchanged. Sources are
  reproducible with `scripts/generate-impact-audio.ts`; the full audio generator
  imports it last so later regeneration preserves the new bank.
- Audio restarts wait for seek completion; a per-player generation guard prevents
  an older seek from replaying a newer/removed player's sound. Muting, background
  state and ad playback are checked again before actually playing.
- Ordinary catch haptics are Light; armor Rigid; heavy/rare finishes Heavy;
  protected creatures use Warning. Existing haptics preferences remain respected.
- A 90ms impact gate coalesces repeated school hits but allows a higher-priority
  cue to override a light one. The short effects reduce overlapping tails.
- Existing score bursts gain two short vector slash lines and a small impact
  core, visible for roughly 150ms. Surviving fish have a 6% squash/stretch driven
  by their existing flash value. Armor flashes decay in 180ms and their existing
  burst displays actual damage as ARMOR −1/−2 instead of hiding all text.
- Finishing an armored/golden fish cannot have its scene shake overwritten by a
  lighter catch in the same volley. The existing small shake cap and three-group
  effect limit remain; no global hit-stop, extra physics loop, per-hit native
  player creation, new blur layer or additional particle system was introduced.

Verification: TypeScript and 21 focused impact/skill/collision/worklet tests
passed. Tests exercise actual mixed-fish finishing hits, real armored damage,
cue throttling/priority, and all eight WAV headers/durations/peaks/fast attacks.
No physical-device FPS, audible latency or subjective-feel measurement has been
completed for this pass. Test release builds on iPhone and Pixel with headphones,
speaker, mute/haptics settings and screen-wide multi-catches before release.

Both iOS and Android production Hermes exports also passed. No new signed app
binary was built or uploaded during this feedback pass.
