import { MAX_AIM_SAMPLES } from "./runtimeSafety.ts";
import { CONTINUE } from "./continues.ts";
import { heroHand } from "./pose.ts";
import { LEVELS, type LevelRules } from "./levels.ts";
import { FISH, PUFF_SCALE, SPECIES } from "./species.ts";
import { FISH_ART_BOUNDS } from "./fishArtBounds.ts";
import { unlockedManuals } from "./skillProgression.ts";
import { type SkillId } from "./skills.ts";
export { SPECIES } from "./species.ts";
export const TUNING = {
  cooldown: 0.38,
  chargeSeconds: 1.2,
  comboWindow: 2.8,
  rareFirst: 9,
  rareLife: 7,
  rareBonus: 3,
  turtlePenalty: 50,
  hideSeconds: 2.6,
  flareSeconds: 3.5,
  manualUses: 3,
  pickupLife: 14,
  // A skill orb drifts into open water on this cadence.
  relicEvery: 8,
} as const;
export type Phase = "ready" | "playing" | "paused" | "won" | "lost";
export type Point = { x: number; y: number };
export type Fish = Point & {
  visitorUntil?: number;
  id: number;
  kind: number;
  direction: number;
  turnIn: number;
  baseY: number;
  phase: number;
  old: Point;
  visualDirection?: number;
  // Seconds left as a golden fish; absent or 0 for an ordinary fish.
  rare?: number;
  // Strikes still needed; absent means one.
  hp?: number;
  flash?: number;
  // Burrowing fish: seconds left under the mud, and seconds until the next dive.
  hidden?: number;
  hideIn?: number;
  // Puffers inflate from 0 to 1 after the first strike.
  inflate?: number;
  motion?: {
    vx: number;
    vy: number;
    speed: number;
    depth: number;
    burst: number;
    nextBurst: number;
    tailPhase: number;
    heading: number;
  };
};
export type Spear = Point & {
  vx: number;
  vy: number;
  rangeLeft: number;
  pierce: boolean;
  heavy: boolean;
  gale: boolean;
  // Fish already struck this flight, so a piercing spear does not stick in one.
  struck: number[];
  connected: boolean;
  skill?: SkillId | null;
  target?: Point;
  pulse?: number;
};
export type Pickup = Point & {
  id: number;
  vx: number;
  life: number;
  phase: number;
  skill: SkillId;
};
export type Burst = Point & {
  id: number;
  life: number;
  points: number;
  color: string;
  multiplier: number;
  rare: boolean;
  chip: boolean;
  bornAt?: number;
  catches?: number;
  timeBonus?: number;
  damage?: number;
};
export type Splash = Point & { id: number; life: number };
export const BURST_LIFE = 0.95;
export const SPLASH_LIFE = 0.7;
export type GameState = {
  phase: Phase;
  level: LevelRules;
  score: number;
  remaining: number;
  shots: number;
  hits: number;
  catches: number;
  chips: number;
  width: number;
  height: number;
  surface: number;
  origin: Point;
  elapsed: number;
  cooldown: number;
  fish: Fish[];
  spear: Spear | null;
  // The second spear of a twin cast.
  offhand: Spear | null;
  pickups: Pickup[];
  skill: SkillId | null;
  skillUses: number;
  gifts: number;
  // True once any spear from the current cast has hit.
  volley: boolean;
  castCatches: number;
  // How many drifting skill orbs have been offered this run.
  relicWave: number;
  aim: Point | null;
  charge: number;
  armLift: number;
  // Smoothed throwing-arm angle. Charge cocks it back; release follows through.
  armPose: number;
  // 1 right, -1 left. `turn` is 0 when settled, otherwise 0–1 through a turn
  // that began facing `turnFrom`.
  facing: number;
  turn: number;
  turnFrom: number;
  swing: number;
  aimTarget: Point | null;
  bursts: Burst[];
  lastHit: number;
  nextId: number;
  seed: number;
  run: number;
  recoil: number;
  fullChargeCue: boolean;
  combo: number;
  comboTime: number;
  bestCombo: number;
  cleared: boolean;
  rareIn: number;
  rareCatches: number;
  splashes: Splash[];
  misses: number;
  shake: number;
  wind: number;
  caught: number[];
  turtleHits: number;
  // Rewarded overtime periods used this run.
  extensions: number;
  // Seconds left of the whole-river light from a lantern koi.
  flare: number;
  timeStop: number;
};
export function comboMultiplier(combo: number) {
  "worklet";
  return combo >= 6 ? 2 : combo >= 3 ? 1.5 : 1;
}
export function comboTimeReward(previousBest: number, combo: number) {
  "worklet";
  return combo > previousBest && (combo === 3 || combo === 6) ? 2 : 0;
}
function random(g: GameState) {
  "worklet";
  g.seed = (Math.imul(1664525, g.seed) + 1013904223) >>> 0;
  return g.seed / 4294967296;
}
export function castRange(g: GameState) {
  "worklet";
  return 170 + g.charge * Math.max(240, g.height - g.origin.y - 290);
}
export function spearSpeed(charge: number) {
  "worklet";
  return 420 + charge * 430;
}
export function accuracy(g: GameState) {
  "worklet";
  return g.shots ? Math.round((100 * g.hits) / g.shots) : 0;
}
export function windAt(level: LevelRules, elapsed: number) {
  "worklet";
  if (!level.wind && !level.gust) return 0;
  const swing = level.windShift ? Math.sin(elapsed * 0.16 + 0.6) : 1;
  const base = level.wind * (0.78 + 0.22 * Math.sin(elapsed * 0.45)) * swing;
  const gust =
    level.gust *
    Math.pow(Math.max(0, Math.sin(elapsed * 0.9 + 1.3)), 6) *
    (base < 0 ? -1 : 1);
  return base + gust;
}
export function impactTime(
  a: Point,
  b: Point,
  c: Point,
  d: Point,
  rx: number,
  ry: number,
): number | null {
  "worklet";
  const px = (a.x - c.x) / rx,
    py = (a.y - c.y) / ry,
    vx = (b.x - d.x) / rx - px,
    vy = (b.y - d.y) / ry - py;
  const A = vx * vx + vy * vy,
    B = 2 * (px * vx + py * vy),
    C = px * px + py * py - 1;
  if (C <= 0) return 0;
  if (A < 1e-10) return null;
  const disc = B * B - 4 * A * C;
  if (disc < 0) return null;
  const t = (-B - Math.sqrt(disc)) / (2 * A);
  return t >= 0 && t <= 1 ? t : null;
}
// Brief lightning flashes; deterministic in elapsed time so every view agrees.
export function lightningAt(elapsed: number) {
  "worklet";
  return (
    Math.pow(Math.max(0, Math.sin(elapsed * 0.37 + 2)), 80) +
    Math.pow(Math.max(0, Math.sin(elapsed * 0.23 + 4.1)), 120) * 0.8
  );
}
// How much of the fog is lifted right now, 0 to 1.
export function clarity(g: GameState) {
  "worklet";
  const flare = Math.min(
    1,
    g.flare / 0.6,
    (g.flare / TUNING.flareSeconds) * 2.5,
  );
  const flash = g.level.thunder ? Math.min(1, lightningAt(g.elapsed) * 1.6) : 0;
  return Math.max(flare, flash);
}
export function hitbox(f: Fish) {
  "worklet";
  const s = SPECIES[f.kind],
    grow = 1 + (PUFF_SCALE - 1) * (f.inflate ?? 0);
  return { rx: s.rx * grow, ry: s.ry * grow };
}
// Sweep in sprite-local coordinates so the tail, body and head all count,
// including when a fish faces left, pitches during a dive or inflates.
export function fishImpactTime(a: Point, b: Point, f: Fish, end: Point = f, pad = 0, start: Point = f.old) {
  "worklet";
  const s = SPECIES[f.kind], bounds = FISH_ART_BOUNDS[s.atlas][s.cell];
  const size = 82 * s.scale, offset = s.offset * s.scale;
  const grow = 1 + (PUFF_SCALE - 1) * (f.inflate ?? 0);
  const flip = f.visualDirection ?? f.direction;
  const sx = (flip < 0 ? -1 : 1) * Math.max(0.25, Math.abs(flip)) * grow;
  const sy = grow * (s.behaviour === "puff" ? 1 + 0.25 * (f.inflate ?? 0) : 1);
  const angle = f.motion?.heading ?? 0, c = Math.cos(angle), sn = Math.sin(angle);
  const ax = a.x - start.x, ay = a.y - start.y;
  const bx = b.x - end.x, by = b.y - end.y;
  const x = (ax * c + ay * sn) / sx, y = (-ax * sn + ay * c) / sy;
  const dx = (bx * c + by * sn) / sx - x, dy = (-bx * sn + by * c) / sy - y;
  const px = (3 + pad) / Math.abs(sx), py = (3 + pad) / sy + 8 * s.scale * s.flex;
  const left = (bounds[0] - 0.5) * size - offset - px;
  const right = (bounds[2] - 0.5) * size - offset + px;
  const top = (bounds[1] - 0.5) * size - py, bottom = (bounds[3] - 0.5) * size + py;
  let enter = 0, leave = 1;
  if (Math.abs(dx) < 1e-10) { if (x < left || x > right) return null; }
  else { const t1 = (left - x) / dx, t2 = (right - x) / dx;
    enter = Math.max(enter, Math.min(t1, t2)); leave = Math.min(leave, Math.max(t1, t2)); }
  if (Math.abs(dy) < 1e-10) { if (y < top || y > bottom) return null; }
  else { const t1 = (top - y) / dy, t2 = (bottom - y) / dy;
    enter = Math.max(enter, Math.min(t1, t2)); leave = Math.min(leave, Math.max(t1, t2)); }
  return enter <= leave ? enter : null;
}
export function isHidden(f: Fish) {
  "worklet";
  return (f.hidden ?? 0) > 0.2;
}
function makeFish(g: GameState, index: number): Fish {
  "worklet";
  const kind = g.level.roster[index] ?? 0,
    count = g.level.roster.length,
    burrows = SPECIES[kind].behaviour === "burrow",
    span = Math.max(90, g.height - g.surface - 225);
  // Turtles keep to middle water: in the top lane they would wall off every
  // deeper cast from the skiff.
  const baseY = burrows
    ? g.height - 150 - (index % 2) * 18
    : SPECIES[kind].behaviour === "protected"
      ? g.surface + 62 + (0.5 + (index % 2) * 0.25) * span
      : g.surface + 62 + (count <= 6 ? index / Math.max(1, count - 1) :
          (index === 5 ? 0.18 : (index % 5) / 4)) * span;
  // Spread slots across the whole water column; do not repeat the top lane.
  // Stagger the lanes horizontally.
  const x =
    index < Math.ceil(count * 0.6)
      ? 76 + (index % 2) * 55 + random(g) * 25
      : g.width - 100 + random(g) * 20;
  return {
    id: g.nextId++,
    x,
    y: baseY,
    baseY,
    kind,
    direction: index % 2 ? -1 : 1,
    turnIn: 3 + random(g) * 6,
    phase: random(g) * Math.PI * 2,
    old: { x, y: baseY },
    hp: SPECIES[kind].hp,
    hideIn: burrows ? 2.5 + random(g) * 3 : undefined,
  };
}
function fillFish(g: GameState) {
  "worklet";
  g.fish = [];
  for (let i = 0; i < g.level.roster.length; i++) g.fish.push(makeFish(g, i));
}
export function cancelAim(g: GameState) {
  "worklet";
  g.aim = null;
  g.aimTarget = null;
  g.charge = 0;
  g.fullChargeCue = false;
}
export function createGame(
  height = 844,
  seed = 12345,
  level: LevelRules = LEVELS[0],
): GameState {
  "worklet";
  const g: GameState = {
    phase: "ready",
    level,
    score: 0,
    remaining: level.seconds,
    shots: 0,
    hits: 0,
    catches: 0,
    chips: 0,
    width: 390,
    height,
    surface: height * 0.32,
    origin: { x: 234, y: height * 0.32 - 77 },
    elapsed: 0,
    cooldown: 0,
    fish: [],
    spear: null,
    offhand: null,
    pickups: [],
    skill: null,
    skillUses: 0,
    gifts: 0,
    volley: false,
    castCatches: 0,
    relicWave: 0,
    aim: null,
    charge: 0,
    armLift: 0,
    armPose: 0,
    facing: 1,
    turn: 0,
    turnFrom: 1,
    swing: 0,
    aimTarget: null,
    bursts: [],
    lastHit: 0,
    nextId: 0,
    seed: seed >>> 0,
    run: 0,
    recoil: 0,
    fullChargeCue: false,
    combo: 0,
    comboTime: 0,
    bestCombo: 0,
    cleared: false,
    rareIn: TUNING.rareFirst,
    rareCatches: 0,
    splashes: [],
    misses: 0,
    shake: 0,
    wind: 0,
    caught: SPECIES.map(() => 0),
    turtleHits: 0,
    extensions: 0,
    flare: 0,
    timeStop: 0,
  };
  g.origin = heroHand(g);
  fillFish(g);
  return g;
}
// Discard the entire interrupted run, including effects/projectiles and invalid values.
// Completed records live in useSave, outside this state, and are not touched.
export function rebuildGame(g: GameState, height: number, level: LevelRules) {
  "worklet";
  const fresh = createGame(height, Number.isFinite(g.seed) ? g.seed : 1, level);
  fresh.run = (Number.isFinite(g.run) ? g.run : 0) + 1;
  return fresh;
}
export function resizeGame(g: GameState, width: number, height: number) {
  "worklet";
  g.width = width;
  g.height = height;
  g.surface = height * 0.32;
  g.armLift = 0;
  g.origin = heroHand(g);
  fillFish(g);
  g.spear = null;
  g.offhand = null;
  cancelAim(g);
}
// The Android window height can be shorter than the view that actually fills
// the screen. Grow the stage to that view. An active run keeps its fish.
export function fitStage(g: GameState, height: number) {
  "worklet";
  if (!(height > 0) || Math.abs(g.height - height) < 1) return;
  if (g.phase !== "ready") {
    g.height = height;
    g.surface = height * 0.32;
    g.origin = heroHand(g);
    return;
  }
  resizeGame(g, 390, height);
}
// Shows a level's water and fish behind the pre-level card without starting play.
export function previewGame(g: GameState, level: LevelRules) {
  "worklet";
  g.phase = "ready";
  g.level = level;
  g.remaining = level.seconds;
  g.elapsed = 0;
  g.timeStop = 0;
  g.spear = null;
  g.offhand = null;
  g.pickups = [];
  g.skill = null;
  g.skillUses = 0;
  g.gifts = 0;
  g.volley = false;
  g.castCatches = 0;
  g.relicWave = 0;
  g.bursts = [];
  g.splashes = [];
  g.shake = 0;
  g.wind = windAt(level, 0);
  g.armLift = 0;
  g.armPose = 0;
  g.facing = 1;
  g.turn = 0;
  g.turnFrom = 1;
  g.swing = 0;
  g.origin = heroHand(g);
  cancelAim(g);
  fillFish(g);
}
export function startGame(g: GameState, level: LevelRules = g.level) {
  "worklet";
  g.run++;
  g.phase = "playing";
  g.level = level;
  g.score = 0;
  g.remaining = level.seconds;
  g.shots = 0;
  g.hits = 0;
  g.catches = 0;
  g.chips = 0;
  g.elapsed = 0;
  g.cooldown = 0;
  g.spear = null;
  g.offhand = null;
  g.pickups = [];
  g.skill = null;
  g.skillUses = 0;
  g.gifts = 0;
  g.volley = false;
  g.castCatches = 0;
  g.relicWave = 0;
  g.bursts = [];
  g.lastHit = 0;
  g.recoil = 0;
  g.armLift = 0;
  g.armPose = 0;
  g.facing = 1;
  g.turn = 0;
  g.turnFrom = 1;
  g.swing = 0;
  g.combo = 0;
  g.comboTime = 0;
  g.bestCombo = 0;
  g.cleared = false;
  g.rareIn = TUNING.rareFirst;
  g.rareCatches = 0;
  g.splashes = [];
  g.misses = 0;
  g.shake = 0;
  g.wind = windAt(level, 0);
  g.caught = SPECIES.map(() => 0);
  g.turtleHits = 0;
  g.extensions = 0;
  g.flare = 0;
  g.timeStop = 0;
  g.origin = heroHand(g);
  cancelAim(g);
  fillFish(g);
}

// Overtime after time-up: the same run carries on with its score, combo and fish.
export function extendGame(g: GameState, seconds: number) {
  "worklet";
  if (
    (g.phase !== "won" && g.phase !== "lost") ||
    g.extensions >= CONTINUE.perRun ||
    seconds !== CONTINUE.seconds
  )
    return;
  g.phase = "playing";
  g.remaining = CONTINUE.seconds;
  g.extensions++;
}
export function pauseGame(g: GameState) {
  "worklet";
  if (g.phase === "playing") {
    g.phase = "paused";
    cancelAim(g);
  }
}
export function resumeGame(g: GameState) {
  "worklet";
  if (g.phase === "paused") g.phase = "playing";
}
export function targetGame(g: GameState, point: Point) {
  "worklet";
  // Preparing the next cast is allowed while the previous spear is returning.
  if (g.phase !== "playing") return;
  g.aimTarget = point;
  const dx = point.x - g.origin.x,
    dy = Math.max(55, point.y - g.origin.y);
  const angle = Math.max(-1.05, Math.min(1.05, Math.atan2(dx, dy)));
  g.aim = { x: Math.sin(angle), y: Math.cos(angle) };
}
export function launchSpear(g: GameState, aimX: number, aimY: number) {
  "worklet";
  const speed = spearSpeed(g.charge),
    skill = g.skillUses > 0 ? g.skill : null,
    kungfu = skill === "kungfu",
    dir = Math.abs(aimX) > 0.12 ? Math.sign(aimX) : g.facing >= 0 ? 1 : -1,
    depth = Math.max(
      g.surface + 48,
      Math.min(g.height - 140, g.aimTarget?.y ?? g.surface + 140),
    ),
    aimXPoint = g.aimTarget?.x ?? g.origin.x + dir * 180;
  const spear: Spear = {
    x: g.origin.x + aimX * 36,
    y: g.origin.y + aimY * 36,
    vx: aimX * speed,
    vy: aimY * speed,
    rangeLeft:
      kungfu || skill === "storm" ? g.height + g.width : castRange(g) - 36,
    pierce:
      skill === "pierce" || kungfu || skill === "spin" || skill === "storm",
    heavy: skill === "heavy",
    gale: skill === "gale" || kungfu || skill === "storm",
    struck: [],
    connected: false,
    skill,
    target:
      skill === "storm"
        ? { x: Math.max(30, Math.min(g.width - 30, aimXPoint)), y: depth }
        : undefined,
    pulse: 0,
  };
  if (kungfu) {
    spear.x = Math.max(0, Math.min(g.width, aimXPoint));
    spear.y = depth;
    spear.vx = spear.vy = 0;
    spear.rangeLeft = g.width;
  }
  if (skill === "storm" && spear.target) {
    const dx = spear.target.x - g.origin.x,
      dy = spear.target.y - g.origin.y,
      length = Math.max(1, Math.hypot(dx, dy));
    spear.vx = (dx / length) * speed;
    spear.vy = (dy / length) * speed;
    spear.x = g.origin.x + (dx / length) * 36;
    spear.y = g.origin.y + (dy / length) * 36;
  }
  return spear;
}
export function releaseGame(g: GameState) {
  "worklet";
  if (
    !g.aim ||
    g.phase !== "playing" ||
    g.spear ||
    g.offhand ||
    g.cooldown > 0
  ) {
    cancelAim(g);
    return false;
  }
  if (g.skillUses > 0 && g.skill === "twin") {
    const angle = Math.atan2(g.aim.x, g.aim.y),
      side = g.aim.x >= 0 ? 0.16 : -0.16;
    // One spear stays on the aim so the cast you lined up still lands.
    g.spear = launchSpear(g, g.aim.x, g.aim.y);
    g.offhand = launchSpear(g, Math.sin(angle + side), Math.cos(angle + side));
  } else {
    g.spear = launchSpear(g, g.aim.x, g.aim.y);
    g.offhand = null;
  }
  if (g.skill === "freeze" && g.skillUses > 0) g.timeStop = 3;
  // One successful release consumes one use, including twin and area casts.
  // Both projectiles snapshot the technique before equipment is cleared.
  if (g.skill && g.skillUses > 0) {
    g.skillUses--;
    if (g.skillUses === 0) g.skill = null;
  }
  g.volley = false;
  g.castCatches = 0;
  g.shots++;
  g.cooldown = TUNING.cooldown;
  g.recoil = 1;
  // Follow-through. The arm eases into it after the hand has let go.
  g.swing = 1;
  cancelAim(g);
  return true;
}
function relicRoll(n: number) {
  "worklet";
  return (Math.imul(1664525, n | 0) + 1013904223) >>> 0;
}
function pushRelic(g: GameState, x: number, y: number, roll: number) {
  "worklet";
  const pool = g.level.manualPool ?? unlockedManuals(g.level.id - 1);
  if (pool.length === 0) return;
  g.pickups.push({
    id: g.nextId++,
    x: Math.max(40, Math.min(g.width - 40, x)),
    y: Math.max(g.surface + 64, Math.min(g.height - 170, y)),
    vx: ((roll % 1000) / 1000 - 0.5) * 36,
    life: TUNING.pickupLife,
    phase: ((roll >>> 10) % 628) / 100,
    skill: pool[roll % pool.length],
  });
  if (g.pickups.length > 3) g.pickups.shift();
}
function dropRelic(g: GameState, x: number, y: number) {
  "worklet";
  // Own roll, so a relic never reshuffles the river's motion.
  const roll = relicRoll(g.nextId * 13 + Math.floor(x + y));
  const side = roll % 2 ? 1 : -1;
  pushRelic(g, x + side * 52, y, roll);
}
function spawnDrifter(g: GameState) {
  "worklet";
  const roll = relicRoll(g.nextId * 17 + Math.floor(g.elapsed * 8) + 3);
  let x = g.width * 0.5,
    y = g.surface + 140;
  const band = Math.max(80, g.height - g.surface - 260);
  for (let n = 0; n < 6; n++) {
    const sample = relicRoll(roll + n * 97),
      cx = 64 + ((sample % 1000) / 1000) * (g.width - 128),
      cy = g.surface + 86 + (((sample >>> 10) % 1000) / 1000) * band;
    let crowded = false;
    for (let i = 0; i < g.fish.length; i++) {
      const f = g.fish[i],
        dx = f.x - cx,
        dy = f.y - cy;
      if (dx * dx + dy * dy < 130 * 130) {
        crowded = true;
        break;
      }
    }
    x = cx;
    y = cy;
    if (!crowded) break;
  }
  pushRelic(g, x, y, roll);
}
// One compact feedback group for a school; scoring still happens per fish.
export const MAX_HIT_EFFECTS = 3;
function addBurst(g: GameState, burst: Burst) {
  "worklet";
  if (burst.points > 0) {
    for (let i = g.bursts.length - 1; i >= 0; i--) {
      const previous = g.bursts[i];
      if (previous.points > 0 && g.elapsed - (previous.bornAt ?? -1) < 0.08) {
        const count = previous.catches ?? 1;
        previous.x = (previous.x * count + burst.x) / (count + 1);
        previous.y = (previous.y * count + burst.y) / (count + 1);
        previous.points += burst.points;
        previous.timeBonus = (previous.timeBonus ?? 0) + (burst.timeBonus ?? 0);
        previous.catches = count + 1;
        previous.rare = previous.rare || burst.rare;
        previous.multiplier = Math.max(previous.multiplier, burst.multiplier);
        if (burst.rare) previous.color = burst.color;
        return;
      }
    }
  }
  burst.bornAt = g.elapsed;
  burst.catches = burst.points > 0 ? 1 : 0;
  if (g.bursts.length >= MAX_HIT_EFFECTS) g.bursts.shift();
  g.bursts.push(burst);
}
function strikeFish(g: GameState, index: number, spear: Spear) {
  "worklet";
  const f = g.fish[index],
    s = SPECIES[f.kind],
    rare = (f.rare ?? 0) > 0;
  if (s.behaviour === "protected") {
    // The turtle shrugs off the spear and swims away; the player pays for it.
    const lost = Math.min(g.score, Math.abs(s.points));
    g.score -= lost;
    g.turtleHits++;
    g.combo = 0;
    g.comboTime = 0;
    g.shake = Math.max(g.shake, 0.6);
    f.flash = 0.4;
    f.direction = f.x >= spear.x ? 1 : -1;
    if (f.motion) f.motion.burst = 0.8;
    addBurst(g, {
      id: g.nextId++,
      x: f.x,
      y: f.y,
      life: BURST_LIFE,
      points: -lost,
      color: s.color,
      multiplier: 1,
      rare: false,
      chip: false,
    });

    return;
  }
  if (!g.volley) g.hits++;
  g.comboTime = TUNING.comboWindow;
  const hp = f.hp ?? 1,
    damage = spear.heavy ? 2 : 1;
  if (hp > damage) {
    f.hp = hp - damage;
    f.flash = 0.18;
    g.chips++;
    g.shake = Math.max(g.shake, 0.35);
    if (s.flees) {
      // Armoured strike: the fish survives, flinches and bolts away from the spear.
      if (f.motion) {
        f.motion.burst = 1.2;
        f.motion.vy += (random(g) - 0.5) * 80;
      }
      f.direction = f.x >= spear.x ? 1 : -1;
    }
    f.turnIn = 1.5 + random(g);
    addBurst(g, {
      id: g.nextId++,
      x: f.x,
      y: f.y,
      life: BURST_LIFE * 0.7,
      points: 0,
      color: "#C9D3D6",
      multiplier: 1,
      rare: false,
      chip: true,
      damage,
    });
  } else {
    // One release advances the chain once, even if a technique catches a school.
    let timeBonus = 0;
    if (g.castCatches === 0) {
      g.combo++;
      timeBonus = comboTimeReward(g.bestCombo, g.combo);
      g.remaining += timeBonus;
      g.bestCombo = Math.max(g.bestCombo, g.combo);
    }
    g.castCatches++;
    const multiplier = comboMultiplier(g.combo),
      points = Math.round(
        s.points * (rare ? TUNING.rareBonus : 1) * multiplier,
      );
    g.score += points;
    g.catches++;
    g.caught[f.kind] = (g.caught[f.kind] ?? 0) + 1;
    if (s.behaviour === "lantern") g.flare = TUNING.flareSeconds;
    if (s.relic) dropRelic(g, f.x, f.y);
    g.lastHit++;
    if (rare) g.rareCatches++;
    g.shake = Math.max(g.shake, rare || s.hp > 1 ? 1 : multiplier > 1 ? 0.55 : 0.3);
    addBurst(g, {
      id: g.nextId++,
      x: f.x,
      y: f.y,
      life: BURST_LIFE,
      points,
      timeBonus,
      color: rare ? "#F2C14E" : s.color,
      multiplier,
      rare: rare || s.hp > 1,
      chip: false,
    });
    const next = makeFish(g, index);
    next.x = next.direction > 0 ? -45 : g.width + 45;
    next.old = { x: next.x, y: next.y };
    g.fish[index] = next;
    if (g.score >= g.level.stars[0]) g.cleared = true;
  }
}

export function moveSpear(spear: Spear, wind: number, dt: number) {
  "worklet";
  if (!spear.gale) spear.vx += wind * dt;
  spear.x += spear.vx * dt;
  spear.y += spear.vy * dt;
}

// The turtle warning samples the same skill-aware path as the actual projectile.
export function aimBlocked(g: GameState) {
  "worklet";
  if (!g.aim || ((g.skill === "storm" || g.skill === "kungfu") && g.skillUses > 0)) return false;
  const fish = g.fish.filter((f) => SPECIES[f.kind].behaviour === "protected");
  if (!fish.length) return false;
  const angles = [Math.atan2(g.aim.x, g.aim.y)];
  if (g.skill === "twin" && g.skillUses > 0)
    angles.push(angles[0] + (g.aim.x >= 0 ? 0.16 : -0.16));
  for (const angle of angles) {
    const spear = launchSpear(g, Math.sin(angle), Math.cos(angle)),
      dt = 8 / spearSpeed(g.charge);
    let distance = 0;
    for (
      let sample = 0;
      sample < MAX_AIM_SAMPLES &&
      distance < spear.rangeLeft &&
      spear.x > -35 &&
      spear.x < g.width + 35 &&
      spear.y < g.height - 95;
      sample++
    ) {
      const start = { x: spear.x, y: spear.y };
      moveSpear(spear, g.wind, dt);
      for (const f of fish) {
        const pad = spear.skill === "spin" ? 25 : 0;
        if (fishImpactTime(start, spear, f, f, pad, f) !== null)
          return true;
      }
      distance += Math.hypot(spear.x - start.x, spear.y - start.y);
    }
  }
  return false;
}

function stepOneSpear(g: GameState, spear: Spear, dt: number) {
  "worklet";
  if (dt <= 0) return spear;
  if (spear.skill === "kungfu") {
    // Resolve the whole chosen row once. No descending attack or moving hit window.
    if (!spear.pulse) {
      const rowStart = {x: -40, y: spear.y}, rowEnd = {x: g.width + 40, y: spear.y};
      for (let i = 0; i < g.fish.length; i++) {
        const f = g.fish[i];
        if (isHidden(f) || SPECIES[f.kind].behaviour === "protected" ||
            spear.struck.includes(f.id) || f.x < -40 || f.x > g.width + 40) continue;
        if (fishImpactTime(rowStart, rowEnd, f, f, 0, f) === null) continue;
        spear.struck.push(f.id);
        f.hp = 1; // This three-use technique cleaves armor within its narrow row.
        strikeFish(g, i, spear);
        spear.struck.push(g.fish[i].id);
        spear.connected = true; g.volley = true;
      }
      if (!spear.connected) {g.misses++; g.combo = 0; g.comboTime = 0;}
    }
    spear.pulse = (spear.pulse ?? 0) + dt;
    return spear.pulse >= 0.26 ? null : spear;
  }
  const start = { x: spear.x, y: spear.y },
    speed = Math.max(1, Math.hypot(spear.vx, spear.vy)),
    flight = Math.min(dt, spear.rangeLeft / speed);
  // Heavenly Swords first travels from the hand, then expands at the aimed depth.
  if (spear.skill === "storm" && spear.target) {
    const delta = { x: spear.target.x - spear.x, y: spear.target.y - spear.y },
      distance = Math.hypot(delta.x, delta.y);
    if (!spear.pulse && distance > speed * flight) {
      spear.vx = (delta.x / distance) * speed;
      spear.vy = (delta.y / distance) * speed;
      spear.x += spear.vx * flight;
      spear.y += spear.vy * flight;
      return spear;
    }
    spear.x = spear.target.x;
    spear.y = spear.target.y;
    spear.pulse = (spear.pulse ?? 0) + dt;
    const radius = spear.pulse * 1150;
    for (let i = 0; i < g.fish.length; i++) {
      const f = g.fish[i];
      if (
        isHidden(f) ||
        SPECIES[f.kind].behaviour === "protected" ||
        spear.struck.includes(f.id)
      )
        continue;
      if (Math.hypot(f.x - spear.x, f.y - spear.y) <= radius) {
        spear.struck.push(f.id);
        strikeFish(g, i, spear);
        spear.struck.push(g.fish[i].id);
        spear.connected = true;
        g.volley = true;
      }
    }
    if (radius > Math.hypot(g.width, g.height)) {
      if (!spear.connected) {
        g.misses++;
        g.combo = 0;
        g.comboTime = 0;
      }
      return null;
    }
    return spear;
  }
  const moved = { ...spear };
  moveSpear(moved, g.wind, flight);
  spear.vx = moved.vx;
  spear.vy = moved.vy;
  const end = { x: moved.x, y: moved.y },
    fraction = flight / dt,
    events: { t: number; kind: number; index: number }[] = [];
  for (let i = 0; i < g.pickups.length; i++) {
    const relic = g.pickups[i],
      t = impactTime(start, end, relic, relic, 29, 33);
    if (t !== null) events.push({ t, kind: 0, index: i });
  }
  for (let i = 0; i < g.fish.length; i++) {
    const f = g.fish[i];
    if (isHidden(f) || spear.struck.indexOf(f.id) >= 0) continue;
    const fishEnd = {
        x: f.old.x + (f.x - f.old.x) * fraction,
        y: f.old.y + (f.y - f.old.y) * fraction,
      },
      t = fishImpactTime(start, end, f, fishEnd, spear.skill === "spin" ? 25 : 0);
    if (t !== null) events.push({ t, kind: 1, index: i });
  }
  events.sort((a, b) => a.t - b.t);
  let stopped = false,
    stopT = 1;
  const taken: number[] = [];
  for (const event of events) {
    if (event.kind === 0) {
      const relic = g.pickups[event.index];
      if (!relic || taken.indexOf(event.index) >= 0) continue;
      if (!g.volley) g.hits++;
      g.gifts++;
      g.skill = relic.skill;
      g.skillUses = TUNING.manualUses;
      taken.push(event.index);
      addBurst(g, {
        id: g.nextId++,
        x: relic.x,
        y: relic.y,
        life: BURST_LIFE,
        points: 0,
        color: "#F2C14E",
        multiplier: 1,
        rare: true,
        chip: false,
      });
      spear.connected = true;
      g.volley = true;
      if (!spear.pierce) {
        stopped = true;
        stopT = event.t;
        break;
      }
    } else {
      const fish = g.fish[event.index];
      if (!fish || spear.struck.indexOf(fish.id) >= 0) continue;
      const blocked = SPECIES[fish.kind].behaviour === "protected";
      spear.struck.push(fish.id);
      strikeFish(g, event.index, spear);
      if (g.fish[event.index].id !== fish.id)
        spear.struck.push(g.fish[event.index].id);
      spear.connected = true;
      g.volley = true;
      if (blocked || !spear.pierce) {
        stopped = true;
        stopT = event.t;
        break;
      }
    }
  }
  taken.sort((a, b) => b - a);
  for (const index of taken) g.pickups.splice(index, 1);

  const along = stopped ? stopT : 1;
  spear.x = start.x + (end.x - start.x) * along;
  spear.y = start.y + (end.y - start.y) * along;
  spear.rangeLeft = Math.max(0, spear.rangeLeft - speed * flight * along);
  if (stopped) return null;
  if (
    // range / speed can underflow to zero while range remains positive. A
    // sub-pixel remainder must finish the cast, or releaseGame stays blocked.
    spear.rangeLeft <= 1e-6 ||
    spear.y > g.height - 95 ||
    spear.x < -35 ||
    spear.x > g.width + 35
  ) {
    if (spear.y > g.surface && spear.x > 0 && spear.x < g.width) {
      g.splashes.push({
        id: g.nextId++,
        x: spear.x,
        y: spear.y,
        life: SPLASH_LIFE,
      });
      if (g.splashes.length > 3) g.splashes.shift();
    }
    const mate = g.spear === spear ? g.offhand : g.spear;
    if (!spear.connected && !mate && !g.volley) {
      g.misses++;
      g.combo = 0;
      g.comboTime = 0;
    }
    return null;
  }
  return spear;
}
function stepGame(g: GameState, dt: number) {
  "worklet";
  if (g.aim) g.charge = Math.min(1, g.charge + dt / TUNING.chargeSeconds);
  g.elapsed += dt;
  g.remaining = Math.max(0, g.remaining - dt);
  g.cooldown = Math.max(0, g.cooldown - dt);
  g.recoil = Math.max(0, g.recoil - dt * 5);
  g.shake = Math.max(0, g.shake - dt * 3.2);
  g.flare = Math.max(0, g.flare - dt);
  const frozen = g.timeStop > 0;
  g.timeStop = Math.max(0, g.timeStop - dt);
  g.wind = windAt(g.level, g.elapsed);
  // Compact in place: no new effect arrays on every physics substep.
  let live = 0;
  for (const burst of g.bursts) {
    burst.life -= dt;
    if (burst.life > 0) g.bursts[live++] = burst;
  }
  g.bursts.length = live;
  live = 0;
  for (const splash of g.splashes) {
    splash.life -= dt;
    if (splash.life > 0) g.splashes[live++] = splash;
  }
  g.splashes.length = live;
  // The combo window holds while a spear is in flight, so a long cast is never punished mid-air.
  if (g.combo > 0 && !g.spear && !g.offhand) {
    g.comboTime -= dt;
    if (g.comboTime <= 0) {
      g.combo = 0;
      g.comboTime = 0;
    }
  }
  g.rareIn -= dt;
  if (g.rareIn <= 0) {
    g.rareIn = g.level.rareEvery + random(g) * 6;
    const candidates = g.fish.filter(
      (f) =>
        !f.rare &&
        SPECIES[f.kind].hp === 1 &&
        SPECIES[f.kind].behaviour !== "protected" &&
        !isHidden(f) &&
        f.x > 70 &&
        f.x < g.width - 70,
    );
    if (candidates.length)
      candidates[Math.floor(random(g) * candidates.length)].rare =
        TUNING.rareLife;
  }

  const relicDue = Math.floor((g.elapsed + 5) / g.level.manualEvery);
  if (relicDue > g.relicWave) {
    g.relicWave = relicDue;
    if (g.pickups.length < 2) spawnDrifter(g);
  }
  const relicTop = g.surface + 64,
    relicBottom = g.height - 170;
  for (let i = g.pickups.length - 1; i >= 0; i--) {
    const relic = g.pickups[i];
    relic.life -= dt;
    relic.x += relic.vx * dt;
    relic.y += Math.sin(g.elapsed * 1.3 + relic.phase) * 16 * dt;
    if (relic.y < relicTop) relic.y = relicTop;
    if (relic.y > relicBottom) relic.y = relicBottom;
    if (relic.x < 36 || relic.x > g.width - 36) relic.vx *= -1;
    if (relic.life <= 0) g.pickups.splice(i, 1);
  }
  g.armLift += (g.charge - g.armLift) * (1 - Math.exp(-dt * 14));
  const aimX = g.aim?.x ?? 0;
  const side = g.facing >= 0 ? 1 : -1;
  if (g.turn > 0) {
    g.turn += dt / 0.16;
    if (g.turn >= 1) {
      g.facing = -g.turnFrom;
      g.turn = 0;
    }
  } else if ((aimX > 0.16 && side < 0) || (aimX < -0.16 && side > 0)) {
    g.turnFrom = side;
    g.turn = Math.min(1, dt / 0.16);
  }
  // The arm never snaps: it eases toward the cock, then through the throw.
  g.swing *= Math.exp(-dt * 6.5);
  const armTarget =
    (g.aim ? -g.charge * 1.2 : 0) + g.swing * 0.85 + aimX * 0.16;
  g.armPose += (armTarget - g.armPose) * (1 - Math.exp(-dt * 16));
  g.origin = heroHand(g);
  if (g.aim && g.aimTarget) targetGame(g, g.aimTarget);
  const speedScale = g.level.speed;
  // One brief encounter every third early level, replacing a normal fish.
  // A caught visitor respawns as a normal fish; it cannot recur this run.
  if (g.level.id >= 5 && g.level.id < 31 && g.level.id % 3 === 2 &&
      g.elapsed >= 20 && g.elapsed - dt < 20 &&
      !g.fish.some((f) => f.kind >= FISH.shark && f.kind <= FISH.grouper)) {
    const kinds = g.level.id >= 23 ? [FISH.shark, FISH.swordfish, FISH.hammerhead, FISH.grouper]
      : g.level.id >= 17 ? [FISH.shark, FISH.swordfish, FISH.hammerhead]
      : g.level.id >= 11 ? [FISH.shark, FISH.swordfish] : [FISH.shark];
    const index = g.fish.findIndex((f) => SPECIES[f.kind].behaviour !== "protected" &&
      (f.hp ?? 1) === SPECIES[f.kind].hp &&
      (g.level.seal.type !== "catch" || f.kind !== g.level.seal.fish));
    if (index >= 0) {
      const visitor = makeFish(g, index);
      visitor.kind = kinds[g.level.id % kinds.length];
      visitor.hp = SPECIES[visitor.kind].hp;
      visitor.x = -65;
      visitor.direction = 1;
      visitor.y = visitor.baseY = g.surface + (g.height - g.surface) * 0.55;
      visitor.old = { x: visitor.x, y: visitor.y };
      visitor.visitorUntil = g.elapsed + 12;
      g.fish[index] = visitor;
    }
  }
  for (let i = 0; i < g.fish.length; i++) {
    if (g.fish[i].visitorUntil !== undefined && g.elapsed >= g.fish[i].visitorUntil!) {
      g.fish[i] = makeFish(g, i);
      g.fish[i].x = -45;
      g.fish[i].old = { x: -45, y: g.fish[i].y };
      g.fish[i].direction = 1;
    }
  }
  for (const f of g.fish) {
    f.old.x = f.x;
    f.old.y = f.y;
    const spec = SPECIES[f.kind];
    if (f.rare) f.rare = Math.max(0, f.rare - dt);
    if (f.flash) f.flash = Math.max(0, f.flash - dt);
    if (frozen) continue;
    if (spec.behaviour === "burrow") {
      if ((f.hidden ?? 0) > 0) {
        f.hidden = Math.max(0, (f.hidden ?? 0) - dt);
        if (f.hidden === 0) f.hideIn = 3.5 + random(g) * 2.5;
      } else {
        f.hideIn = (f.hideIn ?? 3) - dt;
        if (f.hideIn <= 0) f.hidden = TUNING.hideSeconds;
      }
    }
    if (spec.behaviour === "puff" && (f.hp ?? 1) < spec.hp)
      f.inflate = Math.min(1, (f.inflate ?? 0) + dt * 4);
    const m =
      f.motion ??
      (f.motion = {
        vx: f.direction * spec.speed * speedScale,
        vy: 0,
        speed: spec.speed * speedScale,
        depth: f.baseY,
        burst: 0,
        nextBurst: 2.5 + f.phase,
        tailPhase: f.phase,
        heading: 0,
      });
    m.nextBurst -= dt;
    m.burst = Math.max(0, m.burst - dt * 0.9);
    if (m.nextBurst <= 0) {
      m.burst = Math.max(m.burst, spec.burst);
      m.nextBurst = spec.burstEvery + random(g) * 3;
    }
    const cruise =
      spec.speed *
      speedScale *
      (f.rare ? 1.2 : 1) *
      (1 - 0.55 * (f.inflate ?? 0)) *
      (isHidden(f) ? 0.3 : 1) *
      (0.94 +
        Math.sin(g.elapsed * 0.85 + f.phase) * 0.1 +
        Math.sin(g.elapsed * 0.37 + f.phase * 2) * 0.06 +
        m.burst);
    m.speed += (cruise - m.speed) * (1 - Math.exp(-dt * 2.8));
    f.turnIn -= dt;
    const margin = 45 + spec.speed * speedScale * 0.18;
    let turning = false;
    if (f.x < margin && f.direction < 0) {
      f.direction = 1;
      turning = true;
    } else if (f.x > g.width - margin && f.direction > 0) {
      f.direction = -1;
      turning = true;
    }
    if (f.turnIn <= 0) {
      if (random(g) < spec.turnChance) {
        f.direction *= -1;
        turning = true;
      }
      m.depth = f.baseY + (random(g) - 0.5) * spec.depthJitter;
      f.turnIn = spec.turnEvery + random(g) * spec.turnEvery * 0.67;
    }
    if (turning)
      m.depth =
        f.baseY + Math.sin(f.phase + g.elapsed) * spec.depthJitter * 0.5;
    m.depth = Math.max(g.surface + 45, Math.min(g.height - 135, m.depth));
    const vertical = spec.verticalTravel ?? 0;
    const swimDepth = vertical > 0
      ? Math.max(g.surface + 45, Math.min(g.height - 135,
          f.baseY + Math.sin(g.elapsed * 0.65 + f.phase) * vertical))
      : spec.behaviour !== "protected" && spec.behaviour !== "burrow" && f.baseY < g.surface + 150
        ? Math.max(g.surface + 45, Math.min(g.height - 135,
            m.depth + (0.5 - 0.5 * Math.cos(g.elapsed * 0.38 + f.phase)) *
              Math.min(110, (g.height - g.surface) * 0.22)))
        : m.depth;
    let separation = 0;
    for (const other of g.fish) {
      const dx = Math.abs(f.x - other.x);
      if (
        other.id !== f.id &&
        dx < 70 &&
        Math.abs(f.y - other.y) < 30 &&
        Math.abs(f.baseY - other.baseY) < 5
      )
        separation += (f.id < other.id ? -1 : 1) * (1 - dx / 70) * 19;
    }
    const desiredY =
      (swimDepth - f.y) * 1.15 +
      Math.sin(g.elapsed * 1.1 + f.phase) * spec.wobble +
      separation;
    m.vy += (desiredY - m.vy) * (1 - Math.exp(-dt * 2.6));
    m.vx += (f.direction * m.speed - m.vx) * (1 - Math.exp(-dt * spec.agility));
    f.x += m.vx * dt;
    f.y += m.vy * dt;
    if (f.x < 30 && f.old.x >= 30) {
      f.x = 30;
      f.direction = 1;
      m.vx = 0;
    }
    if (f.x > g.width - 30 && f.old.x <= g.width - 30) {
      f.x = g.width - 30;
      f.direction = -1;
      m.vx = 0;
    }
    f.y = Math.max(g.surface + 40, Math.min(g.height - 125, f.y));
    // Agile species also snap their bodies around faster.
    f.visualDirection =
      (f.visualDirection ?? f.direction) +
      (f.direction - (f.visualDirection ?? f.direction)) *
        (1 - Math.exp(-dt * (spec.agility > 7 ? 18 : 11)));
    const pitch = Math.max(
      vertical > 0 ? -0.7 : -0.28,
      Math.min(
        vertical > 0 ? 0.7 : 0.28,
        Math.atan2(m.vy, Math.max(20, Math.abs(m.vx))) * f.direction,
      ),
    );
    m.heading += (pitch - m.heading) * (1 - Math.exp(-dt * 5));
    m.tailPhase += dt * (5.5 + (m.speed / (spec.speed * speedScale)) * 4.5);
  }
  if (g.spear) g.spear = stepOneSpear(g, g.spear, dt);
  if (g.offhand) g.offhand = stepOneSpear(g, g.offhand, dt);
  if (g.remaining < 1e-8 && g.phase === "playing") {
    g.remaining = 0;
    g.phase = g.cleared ? "won" : "lost";
    cancelAim(g);
  }
}
// Progress toward the level's seal. `failed` is final for the run; `met` says the
// condition currently holds, so the seal is earned if the run ends cleared.
export function sealProgress(g: GameState) {
  "worklet";
  const seal = g.level.seal;
  if (seal.type === "catch") {
    const value = g.caught[seal.fish] ?? 0;
    return {
      value,
      target: seal.count,
      met: value >= seal.count,
      failed: false,
    };
  }
  if (seal.type === "combo")
    return {
      value: g.bestCombo,
      target: seal.count,
      met: g.bestCombo >= seal.count,
      failed: false,
    };
  if (seal.type === "golden")
    return {
      value: g.rareCatches,
      target: seal.count,
      met: g.rareCatches >= seal.count,
      failed: false,
    };
  if (seal.type === "steady")
    return {
      value: g.misses,
      target: seal.misses,
      met: g.misses <= seal.misses,
      failed: g.misses > seal.misses,
    };
  return {
    value: g.turtleHits,
    target: 0,
    met: g.turtleHits === 0,
    failed: g.turtleHits > 0,
  };
}
export function sealEarned(g: GameState) {
  "worklet";
  return g.phase === "won" && sealProgress(g).met;
}
export function advanceGame(g: GameState, dt: number) {
  "worklet";
  if (g.phase !== "playing" || !Number.isFinite(dt) || dt <= 0) return;
  let left = Math.min(dt, g.remaining);
  while (left > 1e-10 && g.phase === "playing") {
    const step = Math.min(left, 1 / 60);
    stepGame(g, step);
    left -= step;
  }
}
// A synchronous facade uses exactly the UI-thread rules for deterministic Node tests.
export class FishingGame implements GameState {
  phase!: Phase;
  level!: LevelRules;
  score!: number;
  remaining!: number;
  shots!: number;
  hits!: number;
  catches!: number;
  chips!: number;
  width!: number;
  height!: number;
  surface!: number;
  origin!: Point;
  elapsed!: number;
  cooldown!: number;
  fish!: Fish[];
  spear!: Spear | null;
  offhand!: Spear | null;
  pickups!: Pickup[];
  skill!: SkillId | null;
  skillUses!: number;
  gifts!: number;
  volley!: boolean;
  castCatches!: number;
  relicWave!: number;
  aim!: Point | null;
  charge!: number;
  armLift!: number;
  armPose!: number;
  facing!: number;
  turn!: number;
  turnFrom!: number;
  swing!: number;
  aimTarget!: Point | null;
  bursts!: Burst[];
  lastHit!: number;
  nextId!: number;
  seed!: number;
  run!: number;
  recoil!: number;
  fullChargeCue!: boolean;
  combo!: number;
  comboTime!: number;
  bestCombo!: number;
  cleared!: boolean;
  rareIn!: number;
  rareCatches!: number;
  splashes!: Splash[];
  misses!: number;
  shake!: number;
  wind!: number;
  caught!: number[];
  turtleHits!: number;
  extensions!: number;
  flare!: number;
  timeStop!: number;
  constructor(random = Math.random, level: LevelRules = LEVELS[0]) {
    Object.assign(
      this,
      createGame(844, Math.floor(random() * 4294967296), level),
    );
  }
  get castRange() {
    return castRange(this);
  }
  get accuracy() {
    return accuracy(this);
  }
  start(level?: LevelRules) {
    startGame(this, level);
  }
  pause() {
    pauseGame(this);
  }
  resume() {
    resumeGame(this);
  }
  extend(seconds: number) {
    extendGame(this, seconds);
  }
  resize(w: number, h: number) {
    resizeGame(this, w, h);
  }
  fitStage(h: number) {
    fitStage(this, h);
  }
  target(p: Point) {
    targetGame(this, p);
  }
  release() {
    return releaseGame(this);
  }
  cancelAim() {
    cancelAim(this);
  }
  update(dt: number) {
    advanceGame(this, dt);
  }
}
