// A late frame must not cause an unbounded catch-up burst on the UI thread.
export function frameStepSeconds(gapMs: number) {
  "worklet";
  return Number.isFinite(gapMs) && gapMs > 0 ? Math.min(gapMs, 100) / 1000 : 0;
}

export function heartbeatExpired(
  now: number,
  lastBeat: number,
  active: boolean,
  playing: boolean,
) {
  return active && playing && now - lastBeat > 6000;
}

export const MAX_AIM_SAMPLES = 256;

// At 90/120 Hz, publish at most 60 simulation snapshots per second. All elapsed
// time is accounted for, and low-refresh devices still advance in one bounded step.
export function consumeSimulationFrame(carryMs: number, gapMs: number) {
  "worklet";
  const interval = 1000 / 60;
  const elapsed = Math.max(0, carryMs) + frameStepSeconds(gapMs) * 1000;
  const steps = Math.floor((elapsed + 0.001) / interval);
  return {
    carryMs: Math.max(0, elapsed - steps * interval),
    seconds: (steps * interval) / 1000,
  };
}
