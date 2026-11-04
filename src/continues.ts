import type { GameState } from "./game.ts";
import { starsFor } from "./levels.ts";

export const CONTINUE = { seconds: 15, perRun: 1, adSeconds: 30 };
export type ContinueOffer = {
  kind: "rescue" | "star";
  needed: number;
  goal: number;
  seconds: number;
};
// An explicit opportunity at time-up, never a reason to force a player to lose.
// Players can rescue a miss or pursue a star while keeping an already earned clear.
export function continueOffer(
  g: Pick<GameState, "phase" | "score" | "elapsed" | "level" | "extensions">,
): ContinueOffer | null {
  if (
    (g.phase !== "lost" && g.phase !== "won") ||
    g.extensions >= CONTINUE.perRun
  )
    return null;
  const stars = starsFor(g.score, g.level);
  if (stars === 3) return null;
  const goal = g.level.stars[stars];
  return {
    kind: stars === 0 ? "rescue" : "star",
    needed: Math.max(0, goal - g.score),
    goal,
    seconds: CONTINUE.seconds,
  };
}
