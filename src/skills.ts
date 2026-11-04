// Stable IDs: each manual equips one technique for three casts. A new manual replaces it.
export const SKILLS = [
  "twin",
  "pierce",
  "kungfu",
  "spin",
  "gale",
  "heavy",
  "storm",
  "freeze",
] as const;
export type SkillId = (typeof SKILLS)[number];
export const SKILL_LABEL: Record<SkillId, string> = {
  twin: "Twin Swallows",
  pierce: "Dragon Lance",
  kungfu: "River Cleaver",
  spin: "Lotus Wheel",
  gale: "Wind Anchor",
  heavy: "Iron Palm",
  storm: "Heavenly Swords",
  freeze: "Time Seal",
};
export const SKILL_HINT: Record<SkillId, string> = {
  twin: "Two blades, one cast",
  pierce: "Long blade pierces a line of fish",
  kungfu: "Clears the aimed row, including armor",
  spin: "Rotating blades sweep a wider path",
  gale: "Jade blade resists wind",
  heavy: "Broad blade deals two strikes",
  storm: "Sword wave covers the river; turtles are spared",
  freeze: "Each cast freezes fish for 3s; the level timer keeps ticking",
};
export const SKILL_COLOR: Record<SkillId, string> = {
  twin: "#F2C14E",
  pierce: "#9AD7FF",
  kungfu: "#F0A0C0",
  spin: "#D7B6FF",
  gale: "#B7E4C7",
  heavy: "#E7E2D4",
  storm: "#FFD6A0",
  freeze: "#8EEBFF",
};
export const SKILL_MARK: Record<SkillId, string> = {
  twin: "II",
  pierce: "↑",
  kungfu: "↔",
  spin: "✧",
  gale: "≈",
  heavy: "◆",
  storm: "✦",
  freeze: "Ⅱ",
};
