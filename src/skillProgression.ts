import type { SkillId } from "./skills.ts";

export const MANUAL_UNLOCKS: readonly { afterLevel: number; skills: readonly SkillId[] }[] = [
  { afterLevel: 6, skills: ["twin", "pierce"] },
  { afterLevel: 18, skills: ["kungfu", "gale"] },
  { afterLevel: 30, skills: ["spin", "heavy"] },
  { afterLevel: 36, skills: ["storm", "freeze"] },
];
export function unlockedManuals(completedLevel: number): SkillId[] {
  "worklet";
  const skills: SkillId[] = [];
  for (const reward of MANUAL_UNLOCKS)
    if (completedLevel >= reward.afterLevel)
      for (const skill of reward.skills) skills.push(skill);
  return skills;
}
export function highestClear(records: Record<number, { stars: number }>): number {
  return Object.entries(records).reduce((best, [id, record]) =>
    record.stars >= 2 ? Math.max(best, Number(id)) : best, 0);
}
export const MANUAL_LESSON: Record<SkillId, string> = {
  twin: "Release to throw two blades side by side. Aim between nearby fish to catch a pair. Each release uses one charge, not two.",
  pierce: "A long blade travels through fish in a line. Line up targets at different depths. Armored fish still need their remaining strikes.",
  kungfu: "Drag to choose a depth, then release. A horizontal sword wave instantly clears that entire row on both sides, including armor. Protected creatures are spared.",
  gale: "Your jade blade flies without wind drift. Use it during strong or changing winds. It hits one target and does not clear armor instantly.",
  spin: "A spinning blade sweeps a wider path and pierces multiple targets. Each armored fish takes one strike per release.",
  heavy: "A broad blade deals two strikes to one target. Use it against armored fish and giants; targets with more health will survive.",
  storm: "Aim at a point and release. The blade travels there, then releases a river-wide sword wave. Protected and hidden creatures are spared.",
  freeze: "Each release stops fish for 3 seconds so you can place your next shot. Your level timer keeps ticking; freezing is not extra time.",
};
