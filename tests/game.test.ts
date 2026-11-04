import { test } from "node:test";
import assert from "node:assert/strict";
import {
  comboMultiplier,
  FishingGame,
  impactTime,
  TUNING,
  SPECIES,
} from "../src/game.ts";
import { LEVELS } from "../src/levels.ts";
import { FISH } from "../src/species.ts";
import { heroHand } from "../src/pose.ts";
const SECONDS = LEVELS[0].seconds,
  TARGET = LEVELS[0].stars[0];

test("swept collision catches a fish passed between frames and misses outside its body", () => {
  assert.equal(
    impactTime(
      { x: 0, y: 0 },
      { x: 0, y: 100 },
      { x: 0, y: 50 },
      { x: 0, y: 50 },
      20,
      10,
    ),
    0.4,
  );
  assert.equal(
    impactTime(
      { x: 30, y: 0 },
      { x: 30, y: 100 },
      { x: 0, y: 50 },
      { x: 0, y: 50 },
      20,
      10,
    ),
    null,
  );
  assert.notEqual(
    impactTime(
      { x: 0, y: 0 },
      { x: 0, y: 100 },
      { x: -50, y: 50 },
      { x: 50, y: 50 },
      20,
      10,
    ),
    null,
  );
});
test("ready, pause and background-equivalent state do not consume time or move fish", () => {
  const g = new FishingGame(() => 0.5);
  const initial = g.fish[0].x;
  g.update(10);
  assert.equal(g.remaining, SECONDS);
  assert.equal(g.fish[0].x, initial);
  g.start();
  g.target({ x: 200, y: 500 });
  g.pause();
  const snapshot = JSON.stringify(g);
  g.update(5);
  assert.equal(JSON.stringify(g), snapshot);
  assert.equal(g.release(), false);
  assert.equal(g.shots, 0);
  g.resume();
  g.update(1);
  assert.ok(Math.abs(g.remaining - (SECONDS - 1)) < 1e-6);
});
test("one projectile can catch only the first fish and score once", () => {
  const g = new FishingGame(() => 0.5);
  g.start();
  const x = g.origin.x;
  g.fish = [0, 1].map((_, i) => ({
    id: i,
    kind: 0,
    x,
    y: g.surface + 60 + i * 60,
    baseY: g.surface + 60 + i * 60,
    direction: 1,
    turnIn: 9,
    phase: 0,
    old: { x, y: 0 },
  }));
  g.target({ x, y: 700 });
  assert.equal(g.release(), true);
  assert.equal(g.release(), false);
  g.update(0.35);
  assert.equal(g.catches, 1);
  assert.equal(g.score, 10);
  assert.equal(g.shots, 1);
  assert.equal(g.spear, null);
  assert.equal(g.accuracy, 100);
});
function fishBelowHand(g: FishingGame, id: number, kind = 0) {
  return {
    id,
    kind,
    x: g.origin.x,
    y: g.surface + 60,
    baseY: g.surface + 60,
    direction: 1,
    turnIn: 99,
    phase: 0,
    old: { x: g.origin.x, y: g.surface + 60 },
  };
}
function castStraightDown(g: FishingGame) {
  g.target({ x: g.origin.x, y: 700 });
  assert.equal(g.release(), true);
  g.update(0.4);
}
test("reaching the target clears the level but play continues until time ends as a win", () => {
  const g = new FishingGame(() => 0.5);
  g.start();
  g.score = TARGET - 10;
  g.fish = [fishBelowHand(g, 10)];
  castStraightDown(g);
  assert.equal(g.phase, "playing");
  assert.ok(g.cleared);
  assert.equal(g.score, TARGET);
  g.update(80);
  assert.equal(g.phase, "won");
  assert.equal(g.remaining, 0);
  const finished = JSON.stringify(g);
  g.update(5);
  assert.equal(JSON.stringify(g), finished);
  g.start();
  assert.equal(g.phase, "playing");
  assert.equal(g.score, 0);
  assert.equal(g.remaining, SECONDS);
  assert.equal(g.shots, 0);
  assert.equal(g.catches, 0);
  assert.equal(g.combo, 0);
  assert.equal(g.bestCombo, 0);
  assert.equal(g.cleared, false);
  assert.equal(g.bursts.length, 0);
  assert.equal(g.splashes.length, 0);
  assert.equal(g.fish.length, g.level.roster.length);
});
test("quick consecutive catches build a combo multiplier and a miss breaks it", () => {
  assert.deepEqual(
    [1, 2, 3, 5, 6, 9].map(comboMultiplier),
    [1, 1, 1.5, 1.5, 2, 2],
  );
  const g = new FishingGame(() => 0.5);
  g.start();
  const scores: number[] = [];
  for (let i = 0; i < 6; i++) {
    g.fish = [fishBelowHand(g, 100 + i)];
    const before = g.score;
    castStraightDown(g);
    scores.push(g.score - before);
  }
  assert.deepEqual(scores, [10, 10, 15, 15, 15, 20]);
  assert.equal(g.combo, 6);
  assert.equal(g.bestCombo, 6);
  assert.equal(g.bursts.at(-1)!.multiplier, 2);
  g.fish = [];
  g.target({ x: g.origin.x, y: 700 });
  g.release();
  g.update(0.5);
  assert.equal(g.spear, null);
  assert.equal(g.combo, 0);
  assert.equal(g.bestCombo, 6);
  assert.equal(g.splashes.length, 1);
  assert.ok(g.splashes[0].y > g.surface);
});
test("a combo lapses when the next catch comes too late", () => {
  const g = new FishingGame(() => 0.5);
  g.start();
  g.fish = [fishBelowHand(g, 1)];
  castStraightDown(g);
  assert.equal(g.combo, 1);
  g.fish = [];
  g.update(TUNING.comboWindow + 0.1);
  assert.equal(g.combo, 0);
});
test("golden fish appear on schedule, expire, and pay the rare bonus", () => {
  const g = new FishingGame(() => 0.5);
  g.start();
  g.update(TUNING.rareFirst + 0.05);
  const golden = g.fish.filter((f) => (f.rare ?? 0) > 0);
  assert.equal(golden.length, 1);
  g.update(TUNING.rareLife);
  assert.equal(golden[0].rare, 0);

  const h = new FishingGame(() => 0.5);
  h.start();
  h.fish = [{ ...fishBelowHand(h, 7, 1), rare: 5 }];
  castStraightDown(h);
  assert.equal(h.score, SPECIES[1].points * TUNING.rareBonus);
  assert.equal(h.rareCatches, 1);
  assert.ok(h.bursts[0].rare);
  assert.ok(h.shake > 0);
});
test("timeout stops input, never makes time negative, and permits retry", () => {
  const g = new FishingGame(() => 0.5);
  g.start();
  g.update(SECONDS + 1);
  assert.equal(g.phase, "lost");
  assert.equal(g.remaining, 0);
  g.target({ x: 200, y: 500 });
  assert.equal(g.release(), false);
  assert.equal(g.shots, 0);
  g.start();
  assert.equal(g.phase, "playing");
  assert.equal(g.remaining, SECONDS);
});
test("a taller measured stage fills the view without clearing an active run", () => {
  const g = new FishingGame(() => 0.5);
  g.start();
  const height = g.height;
  const fish = g.fish.map((f) => f.y);
  g.fitStage(height);
  assert.equal(g.height, height);
  g.fitStage(height + 40);
  assert.equal(g.phase, "playing");
  assert.equal(g.height, height + 40);
  assert.equal(g.surface, (height + 40) * 0.32);
  assert.deepEqual(
    g.fish.map((f) => f.y),
    fish,
  );
  g.phase = "ready";
  g.fitStage(height + 80);
  assert.equal(g.height, height + 80);
  assert.ok(g.fish.every((f) => f.y > g.surface && f.y < g.height - 100));
});
test("time, motion and bounds remain stable on short and tall mobile screens", () => {
  for (const height of [694, 844, 950]) {
    const g = new FishingGame(() => 0.5);
    g.resize(390, height);
    g.start();
    for (let i = 0; i < 600; i++) g.update(1 / 30);
    assert.ok(Math.abs(g.remaining - (SECONDS - 20)) < 1e-5);
    assert.ok(
      g.fish.every(
        (f) => f.x >= 30 && f.x <= 360 && f.y > g.surface && f.y < height - 100,
      ),
    );
  }
});

test("holding charges range and speed, moving aim retains charge, charge caps and cancel clears it", () => {
  const g = new FishingGame(() => 0.5);
  g.start();
  g.fish = [];
  g.target({ x: g.origin.x, y: 700 });
  const near = g.castRange;
  g.update(0.6);
  assert.ok(Math.abs(g.charge - 0.5) < 1e-6);
  g.target({ x: g.origin.x + 30, y: 700 });
  assert.ok(Math.abs(g.charge - 0.5) < 1e-6);
  g.update(2);
  assert.equal(g.charge, 1);
  assert.ok(g.castRange > near * 2);
  const far = g.castRange;
  g.release();
  assert.equal(g.charge, 0);
  assert.equal(g.spear?.rangeLeft, far - 36);
  assert.ok(Math.hypot(g.spear!.vx, g.spear!.vy) > 800);
  g.update(2);
  assert.equal(g.spear, null);
  g.target({ x: 200, y: 700 });
  g.update(0.6);
  g.cancelAim();
  assert.equal(g.charge, 0);
  g.target({ x: 200, y: 700 });
  g.update(0.5);
  g.pause();
  assert.equal(g.charge, 0);
});
test("short cast stops before a distant fish while a full cast reaches it", () => {
  function setup() {
    const g = new FishingGame(() => 0.5);
    g.start();
    // Fish swims into the fully charged cast after the hold and flight time.
    const y = g.origin.y + 390;
    g.fish = [
      {
        id: 1,
        kind: 0,
        x: g.origin.x - 70,
        y,
        baseY: y,
        direction: 1,
        turnIn: 99,
        phase: 0,
        old: { x: 0, y: 0 },
      },
    ];
    g.target({ x: g.origin.x, y: 800 });
    return g;
  }
  const short = setup();
  short.release();
  short.update(1);
  assert.equal(short.catches, 0);
  assert.equal(short.spear, null);
  const full = setup();
  full.update(1.2);
  full.release();
  full.update(0.6);
  assert.equal(full.catches, 1);
});

test("plain serialized game state supports the entire UI-thread lifecycle without the class facade", async () => {
  const {
    createGame,
    startGame,
    targetGame,
    advanceGame,
    releaseGame,
    pauseGame,
    resumeGame,
  } = await import("../src/game.ts");
  const g = JSON.parse(JSON.stringify(createGame(844, 42)));
  startGame(g);
  targetGame(g, { x: 234, y: 700 });
  advanceGame(g, 0.8);
  assert.ok(g.charge > 0.6);
  releaseGame(g);
  advanceGame(g, 0.5);
  pauseGame(g);
  const stopped = JSON.stringify(g);
  advanceGame(g, 5);
  assert.equal(JSON.stringify(g), stopped);
  resumeGame(g);
  advanceGame(g, 100);
  assert.ok(g.phase === "won" || g.phase === "lost");
  assert.ok(g.remaining >= 0);
  startGame(g);
  assert.equal(g.run, 2);
  assert.equal(g.score, 0);
  assert.equal(g.remaining, SECONDS);
});
test("fish turn visually through the new direction instead of snapping", () => {
  const g = new FishingGame(() => 0.5);
  g.start();
  const f = g.fish[0];
  f.x = 359.9;
  f.direction = 1;
  f.visualDirection = 1;
  g.update(0.02);
  assert.equal(f.direction, -1);
  assert.ok(f.visualDirection! < 1 && f.visualDirection! > -1);
  g.update(0.5);
  assert.ok(f.visualDirection! < -0.9);
});

test("a stationary next hold can charge while the previous spear is still flying", () => {
  const g = new FishingGame(() => 0.5);
  g.start();
  g.fish = [];
  g.target({ x: 234, y: 700 });
  assert.equal(g.release(), true);
  assert.ok(g.spear);
  g.target({ x: 230, y: 700 });
  assert.ok(g.aim);
  g.update(1.2);
  assert.equal(g.spear, null);
  assert.ok(Math.abs(g.charge - 1) < 1e-9);
  assert.equal(g.release(), true);
  assert.equal(g.shots, 2);
});

test("charging raises the actual hand and release returns it smoothly, with aim tracking the moving grip", () => {
  const g = new FishingGame(() => 0.5);
  g.start();
  const resting = g.origin.y;
  const target = { x: 240, y: 700 };
  g.target(target);
  g.update(0.6);
  const halfway = g.origin.y;
  g.update(0.7);
  const raised = g.origin.y;
  assert.ok(halfway < resting - 8);
  assert.ok(raised < halfway - 8);
  assert.ok(
    Math.abs(
      g.aim!.x / g.aim!.y - (target.x - g.origin.x) / (target.y - g.origin.y),
    ) < 1e-9,
  );
  const hand = { ...g.origin },
    aim = { ...g.aim! };
  g.release();
  assert.ok(Math.abs(g.spear!.x - hand.x - aim.x * 36) < 1e-9);
  assert.ok(Math.abs(g.spear!.y - hand.y - aim.y * 36) < 1e-9);
  g.update(0.25);
  assert.ok(g.origin.y > raised + 15);
  assert.ok(g.armLift < 0.06);
  g.pause();
  const frozen = JSON.stringify(g);
  g.update(1);
  assert.equal(JSON.stringify(g), frozen);
});
test("fish use accelerating cruise and burst motion while preserving continuous positions and depth limits", () => {
  const g = new FishingGame(() => 0.5, LEVELS[2]);
  g.start();
  g.fish = g.fish.filter((f) => f.kind === 2);
  const f = g.fish[0];
  let minSpeed = Infinity,
    maxSpeed = 0,
    minY = f.y,
    maxY = f.y;
  for (let i = 0; i < 900; i++) {
    const old = { x: f.x, y: f.y };
    g.update(1 / 60);
    assert.ok(Math.abs(f.x - old.x) < 3.5);
    assert.ok(Math.abs(f.y - old.y) < 1.5);
    assert.ok(f.x >= 30 && f.x <= 360);
    assert.ok(f.y > g.surface + 39 && f.y < g.height - 124);
    assert.ok(Number.isFinite(f.motion!.heading));
    minSpeed = Math.min(minSpeed, f.motion!.speed);
    maxSpeed = Math.max(maxSpeed, f.motion!.speed);
    minY = Math.min(minY, f.y);
    maxY = Math.max(maxY, f.y);
  }
  assert.ok(maxSpeed - minSpeed > 20);
  assert.ok(maxY - minY > 5);
  assert.ok(f.motion!.tailPhase > 100);
});

test("the heroine turns on the deck and the hull stays where it is", () => {
  const g = new FishingGame(() => 0.2);
  g.start();
  g.elapsed = 0;
  g.facing = 1;
  g.turn = 0;
  g.armPose = 0;
  const right = heroHand(g).x;
  const hull = g.width / 2;
  g.facing = -1;
  const left = heroHand(g).x;
  // The hands mirror around her stance, which is not the middle of the hull.
  assert.ok(right > left);
  assert.ok(Math.abs(right + left) / 2 > hull - 40);
  g.facing = 1;
  g.aim = { x: -0.6, y: 0.8 };
  g.update(0.2);
  assert.equal(g.facing, -1);
  assert.equal(g.turn, 0);
});

test("a skill orb drifts into open water on its own", () => {
  const g = new FishingGame(() => 0.2, LEVELS[6]);
  g.start();
  assert.equal(g.pickups.length, 0);
  g.update(g.level.manualEvery - 5 + 0.2);
  assert.ok(g.pickups.length >= 1);
  const orb = g.pickups[0];
  assert.ok(orb.y > g.surface + 40 && orb.y < g.height - 120);
});

test("a relic fish drops a pickup and spearing it grants a three-use technique", () => {
  const g = new FishingGame(() => 0.2, LEVELS[6]);
  g.start();
  g.fish = [{ ...fishBelowHand(g, 1, FISH.iron), hp: 1 }];
  castStraightDown(g);
  assert.equal(g.catches, 1);
  assert.equal(g.pickups.length, 1);
  const relic = g.pickups[0];
  g.fish = [];
  g.pickups[0].x = g.origin.x;
  g.pickups[0].y = g.surface + 70;
  castStraightDown(g);
  assert.equal(g.pickups.length, 0);
  assert.equal(g.skill, relic.skill);
  assert.ok(g.skillUses > 0);
});

test("twin, piercing, level and heavy spears each change the cast", () => {
  const twin = new FishingGame(() => 0.4);
  twin.start();
  twin.skill = "twin";
  twin.skillUses = 3;
  twin.fish = [];
  twin.target({ x: twin.origin.x, y: 700 });
  assert.equal(twin.release(), true);
  assert.ok(twin.spear);
  assert.ok(twin.offhand);
  assert.notEqual(twin.spear.vx, twin.offhand.vx);

  const pierce = new FishingGame(() => 0.4);
  pierce.start();
  pierce.skill = "pierce";
  pierce.skillUses = 3;
  const x = pierce.origin.x;
  pierce.fish = [0, 1].map((i) => ({
    ...fishBelowHand(pierce, i),
    y: pierce.surface + 70 + i * 50,
    baseY: pierce.surface + 70 + i * 50,
    old: { x, y: pierce.surface + 70 + i * 50 },
  }));
  pierce.target({ x, y: 700 });
  pierce.charge = 1;
  pierce.release();
  pierce.update(0.35);
  assert.equal(pierce.catches, 2);
  assert.ok(pierce.spear);

  const level = new FishingGame(() => 0.4);
  level.start();
  level.skill = "kungfu";
  level.skillUses = 3;
  level.fish = [];
  level.aimTarget = { x: level.width * 0.8, y: level.surface + 160 };
  level.target({ x: level.width * 0.8, y: level.surface + 160 });
  level.release();
  assert.ok(level.spear);
  assert.equal(level.spear.vy, 0, "row cleaver starts at the chosen depth");
  assert.equal(level.spear.vx, 0);
  assert.equal(level.spear.y, level.surface + 160);
  level.update(0.3);
  assert.equal(level.spear, null, "the short row flash cannot block the next cast");

  const heavy = new FishingGame(() => 0.4);
  heavy.start();
  heavy.skill = "heavy";
  heavy.skillUses = 3;
  heavy.fish = [{ ...fishBelowHand(heavy, 3, FISH.iron), hp: 3 }];
  castStraightDown(heavy);
  assert.equal(heavy.catches, 0);
  assert.equal(heavy.chips, 1);
  assert.equal(heavy.fish[0].hp, 1);

  const gale = new FishingGame(() => 0.4);
  gale.start(LEVELS[8]);
  gale.skill = "gale";
  gale.skillUses = 3;
  gale.fish = [];
  gale.target({ x: gale.origin.x, y: 700 });
  gale.release();
  const vx = gale.spear!.vx;
  gale.update(0.2);
  assert.ok(gale.spear);
  assert.ok(Math.abs(gale.spear.vx - vx) < 1);
});
