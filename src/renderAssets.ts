// Immutable vector assets. Build once on the JS runtime, never inside a frame worklet.
import { Skia } from "@shopify/react-native-skia";
import { SKILLS, type SkillId } from "./skills";

function blade(skill: SkillId | null, flying: boolean) {
  const p = Skia.PathBuilder.Make(),
    tip = flying ? 0 : 36,
    length = skill === "pierce" ? 128 : skill === "heavy" ? 68 : 58,
    width = skill === "heavy" ? 9 : skill === "kungfu" ? 6 : 3,
    count = skill === "spin" ? 4 : skill === "twin" && !flying ? 2 : 1;
  for (let i = 0; i < count; i++) {
    const angle = skill === "spin" ? (i * Math.PI) / 2 : 0,
      dx = skill === "twin" && !flying ? (i ? 8 : -8) : 0;
    const point = (x: number, y: number, first = false) => {
      const xx = x * Math.cos(angle) - y * Math.sin(angle) + dx,
        yy = x * Math.sin(angle) + y * Math.cos(angle);
      if (first) p.moveTo(xx, yy);
      else p.lineTo(xx, yy);
    };
    const back = skill === "spin" ? -29 : tip - length;
    point(0, tip, true);
    point(-width, tip - 13);
    point(-width * 0.6, back + 10);
    point(width * 0.6, back + 10);
    point(width, tip - 13);
    p.close();
    p.moveTo(dx - 8, back + 11);
    p.lineTo(dx + 8, back + 11);
  }
  return p.detach();
}
function emblem(skill: SkillId) {
  const p = Skia.PathBuilder.Make();
  if (skill === "freeze") {
    p.addCircle(0, 4, 6);
    p.moveTo(-2, 1); p.lineTo(-2, 7);
    p.moveTo(2, 1); p.lineTo(2, 7);
  } else if (skill === "gale")
    for (let y = 0; y <= 6; y += 3) {
      p.moveTo(-5, y);
      p.cubicTo(-1, y - 4, 1, y + 4, 5, y);
    }
  else if (skill === "heavy") {
    p.moveTo(0, -2);
    p.lineTo(5, 4);
    p.lineTo(0, 10);
    p.lineTo(-5, 4);
    p.close();
  } else if (skill === "kungfu") {
    p.moveTo(-5, 4);
    p.lineTo(5, 4);
    p.moveTo(-2, 1);
    p.lineTo(-5, 4);
    p.lineTo(-2, 7);
    p.moveTo(2, 1);
    p.lineTo(5, 4);
    p.lineTo(2, 7);
  } else if (skill === "spin") {
    p.moveTo(-4, 0);
    p.lineTo(4, 8);
    p.moveTo(4, 0);
    p.lineTo(-4, 8);
    p.addCircle(0, 4, 5);
  } else
    for (
      let i = 0, n = skill === "twin" ? 2 : skill === "storm" ? 3 : 1;
      i < n;
      i++
    ) {
      const x = (i - (n - 1) / 2) * 3.5;
      p.moveTo(x, -2);
      p.lineTo(x, 9);
      p.moveTo(x - 1.5, 6);
      p.lineTo(x, 9);
      p.lineTo(x + 1.5, 6);
    }
  return p.detach();
}
function aura(skill: SkillId | null) {
  const p = Skia.PathBuilder.Make(),
    n = skill === "twin" ? 2 : skill === "storm" ? 7 : skill === "spin" ? 4 : 1;
  for (let i = 0; i < n; i++) {
    const angle = (i * Math.PI * 2) / n,
      x = Math.cos(angle) * 34,
      y = Math.sin(angle) * 36;
    p.moveTo(x, y - (skill === "pierce" ? 22 : 12));
    p.lineTo(x, y + 10);
    p.moveTo(x - (skill === "heavy" ? 9 : 4), y + 5);
    p.lineTo(x + (skill === "heavy" ? 9 : 4), y + 5);
  }
  return p.detach();
}
export const RENDER_SKILLS = [null, ...SKILLS] as const;
export const SWORD_SHAPES = RENDER_SKILLS.map((skill) => [
  blade(skill, false),
  blade(skill, true),
]);
export const MANUAL_EMBLEMS = SKILLS.map(emblem);
export const AURA_SHAPES = RENDER_SKILLS.map(aura);
export const STORM_RAYS = (() => {
  const p = Skia.PathBuilder.Make();
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    p.moveTo(Math.cos(a) * 0.92, Math.sin(a) * 0.92);
    p.lineTo(Math.cos(a) * 1.04, Math.sin(a) * 1.04);
  }
  return p.detach();
})();
export const MANUAL_STITCHES = (() => {
  const p = Skia.PathBuilder.Make();
  for (let y = -15; y <= 15; y += 8) {
    p.moveTo(-18, y);
    p.lineTo(-12, y + 2);
    p.lineTo(-18, y + 4);
  }
  return p.detach();
})();

// A single cached path suggests woven cloth without textures, shaders or per-frame allocation.
export const MANUAL_WEAVE = (() => {
  const p = Skia.PathBuilder.Make();
  for (let y = -21; y < 19; y += 3) {
    p.moveTo(-12, y); p.lineTo(16, y + 0.8);
  }
  for (let x = -10; x < 17; x += 4) {
    p.moveTo(x, -22); p.lineTo(x - 1, 18);
  }
  return p.detach();
})();
