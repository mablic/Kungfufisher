// A simulated player for balance checks. It plays through the real rules engine with
// human-like aim error and reaction time; fog and night widen both.
import {
  aimBlocked,
  clarity,
  FishingGame,
  sealEarned,
  SPECIES,
  spearSpeed,
  TUNING,
} from "../src/game.ts";
import { starsFor, type LevelRules } from "../src/levels.ts";

export type Skill = {
  name: string;
  aimError: number;
  reaction: number;
  windRead: number;
  // Relative error in judging how far a moving fish travels before the spear arrives.
  leadError: number;
  // Chance of noticing the red aim warning and re-aiming instead of striking a turtle.
  caution: number;
};
// Calibrated against recorded play: a first-time player lands about 60% of casts
// at roughly one cast every three seconds.
export const CASUAL: Skill = {
  name: "casual",
  aimError: 24,
  reaction: 1.9,
  windRead: 0.45,
  leadError: 0.5,
  caution: 0.75,
};
export const SKILLED: Skill = {
  name: "skilled",
  aimError: 13,
  reaction: 0.9,
  windRead: 0.85,
  leadError: 0.22,
  caution: 0.95,
};

// mulberry32: unlike a bare LCG, nearby seeds give independent streams.
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Plan = { point: { x: number; y: number }; hold: number };

function manualPlan(
  g: FishingGame,
  skill: Skill,
  rand: () => number,
): Plan | null {
  if (g.skillUses > 1 || !g.pickups.length || rand() > skill.caution * 0.8)
    return null;
  for (const book of g.pickups) {
    if (book.life < 2) continue;
    for (const charge of [0.3, 0.5, 0.7, 0.85, 1]) {
      const hold = charge * TUNING.chargeSeconds,
        speed = spearSpeed(charge),
        predicted = { x: book.x + book.vx * (hold + 0.4), y: book.y },
        distance = Math.hypot(
          predicted.x - g.origin.x,
          predicted.y - g.origin.y,
        ),
        reach = 170 + charge * Math.max(240, g.height - g.origin.y - 290);
      if (
        predicted.x < 30 ||
        predicted.x > g.width - 30 ||
        distance > reach - 12
      )
        continue;
      const point = predicted;
      if (warned(g, point, hold)) continue;
      return { point, hold };
    }
  }
  return null;
}

function choosePlan(
  g: FishingGame,
  skill: Skill,
  rand: () => number,
): Plan | null {
  const manual = manualPlan(g, skill, rand);
  if (manual) return manual;
  const level = g.level,
    reach = Math.max(240, g.height - g.origin.y - 290),
    blur = 1 + level.fog * (1 - clarity(g)) * 1.4;
  let best: Plan | null = null,
    bestValue = 0;
  for (const f of g.fish) {
    // Players leave turtles alone and wait for a buried catfish to surface.
    if (SPECIES[f.kind].behaviour === "protected" || (f.hidden ?? 0) > 0.3)
      continue;
    const spec = SPECIES[f.kind],
      vx = f.motion?.vx ?? f.direction * spec.speed * level.speed,
      vy = f.motion?.vy ?? 0;
    for (const charge of [0.1, 0.3, 0.5, 0.7, 0.85, 1]) {
      const hold = charge * TUNING.chargeSeconds,
        speed = spearSpeed(charge),
        range = 170 + charge * reach,
        oy = g.origin.y - charge * 18;
      let t = hold + 0.3,
        px = f.x,
        py = f.y,
        dist = 0;
      for (let k = 0; k < 3; k++) {
        px = f.x + vx * t;
        py = f.y + vy * t;
        dist = Math.hypot(px - g.origin.x, py - oy);
        t = hold + dist / speed;
      }
      if (dist > range - 10 || px < 35 || px > g.width - 35) continue;
      const dy = py - oy;
      if (dy < 55 || Math.abs(Math.atan2(px - g.origin.x, dy)) > 1.0) continue;
      const worth =
        (spec.points / spec.hp) * ((f.rare ?? 0) > 0 ? TUNING.rareBonus : 1);
      const value = worth / (t + skill.reaction);
      if (value > bestValue) {
        const flight = dist / speed,
          drift = 0.5 * g.wind * flight * flight * skill.windRead,
          gauss = () => (rand() + rand() + rand() - 1.5) * 1.15;
        const lead = gauss() * skill.leadError * blur;
        const point = {
          x: px - drift + vx * t * lead + gauss() * skill.aimError * blur,
          y: py + gauss() * skill.aimError * blur * 0.5,
        };
        if (warned(g, point, hold) && rand() < skill.caution) continue;
        bestValue = value;
        best = { point, hold };
      }
    }
  }
  return best;
}

function warned(g: FishingGame, point: { x: number; y: number }, hold: number) {
  const saved = { aim: g.aim, aimTarget: g.aimTarget, charge: g.charge };
  g.target(point);
  g.charge = Math.min(1, hold / TUNING.chargeSeconds);
  const blocked = aimBlocked(g);
  Object.assign(g, saved);
  return blocked;
}

// `overtime` is asked at each time-up and returns the seconds to keep playing
// (0 ends the run), like a player accepting a rewarded continue.
export function playLevel(
  level: LevelRules,
  seed: number,
  skill: Skill,
  overtime: (g: FishingGame) => number = () => 0,
) {
  const rand = lcg(seed * 7919 + level.id),
    g = new FishingGame(rand, level);
  g.start(level);
  const dt = 1 / 60,
    reaction = skill.reaction * (1 + level.fog * 0.7);
  let wait = 0.6,
    plan: Plan | null = null;
  // Experience telemetry: reward rhythm, dead time and tension.
  let idle = 0,
    lastCatch = 0,
    drought = 0,
    firstCatch = -1,
    clearedAt = -1,
    goldenSeen = 0,
    streaks = 0,
    lastCatches = 0,
    lastCombo = 0,
    rareOn = false;
  for (;;) {
    if (g.phase !== "playing") {
      const seconds = overtime(g);
      if (seconds <= 0) break;
      const extensions = g.extensions;
      g.extend(seconds);
      if (g.extensions === extensions) break;
    }
    // A landed strike on armour is feedback too, so it ends a drought.
    if (g.catches + g.chips > lastCatches) {
      if (firstCatch < 0) firstCatch = g.elapsed;
      drought = Math.max(drought, g.elapsed - lastCatch);
      lastCatch = g.elapsed;
      lastCatches = g.catches + g.chips;
    }
    if (g.combo >= 3 && lastCombo < 3) streaks++;
    lastCombo = g.combo;
    if (g.cleared && clearedAt < 0) clearedAt = g.elapsed;
    const rare = g.fish.some((f) => (f.rare ?? 0) > 0);
    if (rare && !rareOn) goldenSeen++;
    rareOn = rare;
    if (plan) {
      plan.hold -= dt;
      if (plan.hold <= 0 && !g.spear && !g.offhand && g.cooldown <= 0) {
        g.release();
        plan = null;
        wait = reaction * (0.7 + rand() * 0.6);
      }
    } else if (!g.spear && !g.offhand && g.cooldown <= 0) {
      wait -= dt;
      if (wait <= 0) {
        plan = choosePlan(g, skill, rand);
        if (plan) g.target(plan.point);
        else {
          wait = 0.1;
          idle += 0.1;
        }
      }
    }
    g.update(dt);
  }
  return {
    score: g.score,
    stars: starsFor(g.score, level),
    accuracy: g.accuracy,
    shots: g.shots,
    caught: g.caught,
    turtleHits: g.turtleHits,
    seal: sealEarned(g),
    catches: g.catches,
    idle,
    drought: Math.max(drought, level.seconds - lastCatch),
    firstCatch,
    clearedAt,
    goldenSeen,
    golden: g.rareCatches,
    streaks,
    manuals: g.gifts,
    extensions: g.extensions,
  };
}

export function survey(level: LevelRules, skill: Skill, seeds = 8) {
  const runs = [];
  for (let s = 1; s <= seeds; s++) runs.push(playLevel(level, s, skill));
  const scores = runs.map((r) => r.score).sort((a, b) => a - b);
  return {
    mean: scores.reduce((a, b) => a + b, 0) / scores.length,
    median: scores[Math.floor(scores.length / 2)],
    accuracy: runs.reduce((a, r) => a + r.accuracy, 0) / runs.length,
    shots: runs.reduce((a, r) => a + r.shots, 0) / runs.length,
    seals: runs.filter((r) => r.seal).length / runs.length,
    scores,
  };
}
