import { launchSpear, moveSpear, spearSpeed, type GameState } from './game.ts';
import { MAX_AIM_SAMPLES } from './runtimeSafety.ts';

// Preview the real wind-bent flight only as far as the finger's depth/distance.
// Charge still limits the actual reachable range; this never changes the throw.
export function aimPreview(g: GameState) {
  'worklet';
  if (!g.aim || !g.aimTarget) return [{x: g.origin.x, y: g.origin.y, d: 0}];
  const spear = launchSpear(g, g.aim.x, g.aim.y);
  if (spear.skill === 'kungfu') return Array.from({length: 57}, (_, i) =>
    ({x: g.width * i / 56, y: spear.y, d: g.width * i / 56}));
  const range = Math.min(spear.rangeLeft + 36,
    Math.hypot(g.aimTarget.x - g.origin.x, g.aimTarget.y - g.origin.y));
  if (range <= 36) return [{x: g.aimTarget.x, y: g.aimTarget.y, d: range}];
  const dt = 7 / spearSpeed(g.charge), points = [{x: spear.x, y: spear.y, d: 36}];
  let travelled = 36;
  for(let i = 0; i < MAX_AIM_SAMPLES && travelled < range; i++) {
    const x = spear.x, y = spear.y;
    moveSpear(spear, g.wind, dt);
    const step = Math.hypot(spear.x - x, spear.y - y);
    if(step <= 0) break;
    let fraction = Math.min(1, (range - travelled) / step);
    if(spear.y > g.aimTarget.y && spear.y > y)
      fraction = Math.min(fraction, Math.max(0, (g.aimTarget.y - y) / (spear.y - y)));
    const end = {x: x + (spear.x - x) * fraction, y: y + (spear.y - y) * fraction,
      d: travelled + step * fraction};
    points.push(end); travelled = end.d;
    if(fraction < 1 || end.x < -30 || end.x > g.width + 30 || end.y >= g.height - 95 ||
      (spear.target && end.y >= spear.target.y)) break;
  }
  return points;
}
