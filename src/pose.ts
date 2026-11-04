import type { GameState } from "./game";

// The heroine sprite, placed so the skiff's keel sits on the waterline.
// `x` and `y` are the image's top-left in skiff-local space.
export const HERO_FRAME = { x: -114, y: -128.09, width: 228, height: 132.09 };
// Shoulder and grip, in the same unmirrored space. Mirroring flips them.
export const HERO_SHOULDER = { x: 22.4, y: -92.1 };
export const HERO_GRIP = { x: 44.2, y: -85.6 };
// She turns around her feet. The hull, canopy and bow are HERO_BOAT and never turn.
export const HERO_PIVOT = { x: 10.6, y: -12 };
export const HERO_BOAT = [
  [-114.0, -18.3],
  [-111.6, -39.5],
  [-106.9, -50.6],
  [-94.2, -54.5],
  [-79.4, -52.9],
  [-65.6, -40.1],
  [-54.7, -23.3],
  [64.0, -22.3],
  [91.7, -23.7],
  [113.8, -18.3],
  [113.8, 3.8],
  [-114.0, 3.8],
];
// Contour of the forward sleeve and hand, hinged at the shoulder.
export const HERO_ARM = [
  [24.4, -94.9],
  [33.9, -90.9],
  [42.2, -87.8],
  [45.8, -86.6],
  [45.8, -84.6],
  [38.3, -83.4],
  [30.4, -85.8],
  [25.4, -88.5],
  [22.0, -91.3],
];
// Signed scale of the figure. A turn plays as one half-turn of a cosine, so she
// crosses edge-on quickly instead of lingering as a squashed shape.
export function heroFacing(g: GameState) {
  "worklet";
  const from = g.turnFrom || 1,
    turn = g.turn ?? 0;
  if (turn <= 0) return g.facing || 1;
  return from * Math.cos(Math.min(1, turn) * Math.PI);
}
export function heroPose(g: GameState) {
  "worklet";
  const swell = g.level?.waves ?? 0,
    facing = heroFacing(g),
    aim = g.aim?.x ?? 0;
  return {
    x:
      g.width / 2 -
      g.recoil +
      (Math.sin(g.elapsed * 0.9) * 0.7 +
        Math.sin(g.elapsed * 0.37 + 0.6) * 0.3) *
        swell *
        swell *
        48,
    y:
      g.surface +
      Math.sin(g.elapsed * 1.7) * (2.2 + swell * 8) +
      Math.sin(g.elapsed * 0.83 + 1) * swell * 10 +
      Math.sin(g.elapsed * 1.8) * 0.7,
    // The hull rocks with the water only. Aim lean lives on the figure.
    tilt:
      g.recoil * 0.012 +
      Math.sin(g.elapsed * 1.3) * swell * 0.1 +
      Math.sin(g.elapsed * 2.1) * 0.008,
    armAngle: g.armPose ?? 0,
    facing,
    lean: (1 - Math.abs(facing)) * 0.45 * (g.turnFrom || 1) + aim * 0.06,
  };
}
export function heroHand(g: GameState) {
  "worklet";
  const pose = heroPose(g),
    dx = HERO_GRIP.x - HERO_SHOULDER.x,
    dy = HERO_GRIP.y - HERO_SHOULDER.y,
    arm = pose.armAngle;
  let x =
    HERO_SHOULDER.x + dx * Math.cos(arm) - dy * Math.sin(arm) - HERO_PIVOT.x;
  let y =
    HERO_SHOULDER.y + dx * Math.sin(arm) + dy * Math.cos(arm) - HERO_PIVOT.y;
  x *= pose.facing;
  const c = Math.cos(pose.lean),
    s = Math.sin(pose.lean),
    rx = x * c - y * s,
    ry = x * s + y * c;
  x = rx + HERO_PIVOT.x;
  y = ry + HERO_PIVOT.y;
  return {
    x: pose.x + x * Math.cos(pose.tilt) - y * Math.sin(pose.tilt),
    y: pose.y + x * Math.sin(pose.tilt) + y * Math.cos(pose.tilt),
  };
}
