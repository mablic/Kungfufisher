import type { GameState } from "./game.ts";
// Skip only decorative mesh deformation during a school impact / area technique.
// Texture resolution, fish movement, hitboxes and the visible sword are unchanged.
export function impactRenderPressure(g: Pick<GameState, "bursts" | "spear" | "offhand">) {
  "worklet";
  if (g.bursts.length >= 2) return true;
  for (const burst of g.bursts) if ((burst.catches ?? 1) >= 3) return true;
  return ((g.spear?.skill === "storm" || g.spear?.skill === "kungfu") && (g.spear.pulse ?? 0) > 0) ||
    ((g.offhand?.skill === "storm" || g.offhand?.skill === "kungfu") && (g.offhand.pulse ?? 0) > 0);
}
