// Physics and aim are unchanged at every quality level.
export type EffectsQuality = "full" | "balanced" | "minimal";
export type EffectBudget = {
  quality: EffectsQuality;
  slow: number;
  fast: number;
};
export function nextEffectBudget(
  budget: EffectBudget,
  averageMs: number,
  lateFrames: number,
  ceiling: EffectsQuality = "full",
): EffectBudget {
  "worklet";
  const slow = averageMs > 18.8 || lateFrames > 5 ? budget.slow + 1 : 0,
    fast = averageMs < 17.3 && lateFrames <= 1 ? budget.fast + 1 : 0;
  if (slow >= 2)
    return {
      quality: budget.quality === "full" ? "balanced" : "minimal",
      slow: 0,
      fast: 0,
    };
  if (fast >= 6)
    return {
      quality:
        ceiling === "minimal"
          ? "minimal"
          : budget.quality === "minimal"
            ? "balanced"
            : ceiling,
      slow: 0,
      fast: 0,
    };
  return { quality: budget.quality, slow, fast };
}
