import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FishingGame,
  MAX_HIT_EFFECTS,
  launchSpear,
  moveSpear,
  aimBlocked,
  TUNING,
} from "../src/game.ts";
import { FISH } from "../src/species.ts";
import { LEVELS } from "../src/levels.ts";
import { heroPose, heroHand } from "../src/pose.ts";

function fish(
  g: FishingGame,
  id: number,
  kind = FISH.jade as number,
  x = g.origin.x,
  y = g.surface + 90,
  hp = 1,
) {
  return {
    id,
    kind,
    x,
    y,
    baseY: y,
    old: { x, y },
    direction: 1,
    turnIn: 99,
    phase: 0,
    hp,
  };
}
test("spinning sword reaches beside its centre line and strikes armor only once per cast", () => {
  const g = new FishingGame(() => 0.5);
  g.start();
  g.skill = "spin";
  g.skillUses = 3;
  g.fish = [fish(g, 900, FISH.iron, g.origin.x + 32, g.surface + 90, 3)];
  g.target({ x: g.origin.x, y: 700 });
  g.charge = 1;
  g.release();
  g.update(0.4);
  assert.equal(g.chips, 1);
  assert.equal(g.fish[0].hp, 2);
  assert.equal(g.spear?.skill, "spin");
});
test("screen technique is consumed once, spares turtles and buried fish and never re-hits respawns", () => {
  const g = new FishingGame(() => 0.5);
  g.start();
  g.skill = "storm";
  g.skillUses = 3;
  const y = g.surface + 170;
  g.fish = [
    fish(g, 901, FISH.jade, 80, y),
    fish(g, 902, FISH.iron, 150, y, 3),
    fish(g, 903, FISH.turtle, 250, y),
    { ...fish(g, 904, FISH.catfish, 320, y), hidden: 2.5, hideIn: 9 },
  ];
  g.target({ x: 200, y });
  g.charge = 1;
  g.release();
  assert.equal(g.skill, "storm");
  assert.equal(g.skillUses, 2);
  assert.equal(g.spear?.skill, "storm");
  g.update(1.7);
  assert.equal(g.catches, 1);
  assert.equal(g.chips, 1);
  assert.equal(g.fish[1].hp, 2);
  assert.equal(g.turtleHits, 0);
  assert.equal(g.caught[FISH.catfish], 0);
  assert.equal(
    g.accuracy,
    100,
    "multiple targets still count as a single successful cast",
  );
  assert.equal(g.spear, null);
});
test("pausing freezes equipped technique, gifts, boat, fish and active sword", () => {
  const g = new FishingGame(() => 0.5);
  g.start(LEVELS[28]);
  g.skill = "twin";
  g.skillUses = 3;
  g.target({ x: 200, y: 700 });
  g.release();
  g.pause();
  const saved = JSON.stringify(g);
  g.update(5);
  assert.equal(JSON.stringify(g), saved);
  g.resume();
  g.update(0.1);
  assert.equal(g.skillUses, 2);
});
test("in-flight sword keeps its technique after the final use is consumed or equipment is replaced", () => {
  const g = new FishingGame(() => 0.5);
  g.start();
  g.fish = [];
  g.skill = "pierce";
  g.skillUses = 1;
  g.target({ x: 200, y: 700 });
  g.charge = 1;
  g.release();
  g.update(0.05);
  assert.equal(g.skill, null);
  assert.equal(g.spear?.skill, "pierce");
  assert.equal(g.spear?.pierce, true);
});
test("row cleaver ignores wind and spares protected creatures", () => {
  const g = new FishingGame(() => 0.5);
  g.start();
  g.skill = "kungfu";
  g.skillUses = 3;
  g.target({ x: g.origin.x, y: g.surface + 90 });
  g.charge = 1;
  g.fish = [fish(g, 909, FISH.turtle, g.origin.x + 90, g.surface + 90)];
  assert.equal(aimBlocked(g), false);
  const p = launchSpear(g, g.aim!.x, g.aim!.y),
    q = structuredClone(p);
  for (let i = 0; i < 40; i++) {
    moveSpear(p, 1000, 1 / 120);
    moveSpear(q, 0, 1 / 120);
  }
  assert.deepEqual(p, q);
});
test("strong late-level swell drifts sideways more than early swell and hand stays anchored", () => {
  const g = new FishingGame(() => 0.5);
  g.start();
  let calm = 0,
    rolling = 0,
    storm = 0;
  for (let i = 0; i < 300; i++) {
    g.elapsed = i * 0.1;
    g.level = { ...LEVELS[0], waves: 0 };
    calm = Math.max(calm, Math.abs(heroPose(g).x - g.width / 2));
    g.level = { ...LEVELS[0], waves: 0.5 };
    rolling = Math.max(rolling, Math.abs(heroPose(g).x - g.width / 2));
    g.level = { ...LEVELS[0], waves: 0.85 };
    storm = Math.max(storm, Math.abs(heroPose(g).x - g.width / 2));
    assert.ok(Number.isFinite(heroHand(g).x));
    assert.ok(heroPose(g).x > 114 && heroPose(g).x < 276);
  }
  assert.equal(calm, 0);
  assert.ok(rolling > 8);
  assert.ok(storm > rolling * 2);
});

test("every technique grants exactly three casts, including twins and the screen wave", () => {
  for (const skill of [
    "twin",
    "pierce",
    "kungfu",
    "spin",
    "gale",
    "heavy",
    "storm",
    "freeze",
  ] as const) {
    const g = new FishingGame(() => 0.5);
    g.start();
    g.fish = [];
    g.skill = skill;
    g.skillUses = TUNING.manualUses;
    g.update(11);
    g.pickups = [];
    g.relicWave = 100000;
    assert.equal(g.skillUses, 3, `${skill}: waiting must not consume uses`);
    for (let i = 0; i < 3; i++) {
      g.target({ x: g.origin.x, y: g.surface + 120 });
      g.charge = 1;
      assert.equal(g.release(), true);
      assert.equal(g.skillUses, 2 - i);
      assert.equal(g.spear?.skill, skill);
      if (skill === "twin") assert.equal(g.offhand?.skill, skill);
      assert.equal(g.skill, i === 2 ? null : skill);
      g.update(2.4);
    }
    g.target({ x: g.origin.x, y: 700 });
    g.release();
    assert.equal(
      g.spear?.skill,
      null,
      `${skill}: fourth cast uses the normal sword`,
    );
    assert.equal(g.offhand, null);
  }
});
test("cancelled holds and rejected releases consume no use; a new manual resets to three", () => {
  const g = new FishingGame(() => 0.5);
  g.start();
  g.fish = [];
  g.skill = "twin";
  g.skillUses = 3;
  assert.equal(g.release(), false);
  assert.equal(g.skillUses, 3);
  g.target({ x: g.origin.x, y: 700 });
  g.pause();
  g.resume();
  assert.equal(g.release(), false);
  assert.equal(g.skillUses, 3);
  g.skill = "heavy";
  g.skillUses = 1;
  g.pickups = [
    {
      id: 999,
      x: g.origin.x,
      y: g.surface + 65,
      vx: 0,
      life: 14,
      phase: 0,
      skill: "twin",
    },
  ];
  g.target({ x: g.origin.x, y: 700 });
  g.charge = 1;
  g.release();
  g.update(0.3);
  assert.equal(g.skill, "twin");
  assert.equal(g.skillUses, 3);
  assert.equal(g.gifts, 1);
});

test("effect budget reacts to sustained load and recovers slowly without flickering", async () => {
  const { nextEffectBudget } = await import("../src/effectBudget.ts");
  let budget = {
    quality: "full" as "full" | "balanced" | "minimal",
    slow: 0,
    fast: 0,
  };
  budget = nextEffectBudget(budget, 25, 8);
  assert.equal(budget.quality, "full");
  budget = nextEffectBudget(budget, 16.7, 0);
  assert.equal(budget.quality, "full");
  budget = nextEffectBudget(budget, 25, 8);
  budget = nextEffectBudget(budget, 25, 8);
  assert.equal(budget.quality, "balanced");
  for (let i = 0; i < 5; i++) budget = nextEffectBudget(budget, 16.7, 0);
  assert.equal(budget.quality, "balanced");
  budget = nextEffectBudget(budget, 16.7, 0);
  assert.equal(budget.quality, "full");
});

test("extended render pressure enables minimal effects and recovers one step at a time", async () => {
  const { nextEffectBudget } = await import("../src/effectBudget.ts");
  let budget = {
    quality: "balanced" as "full" | "balanced" | "minimal",
    slow: 0,
    fast: 0,
  };
  budget = nextEffectBudget(budget, 24, 9);
  budget = nextEffectBudget(budget, 24, 9);
  assert.equal(budget.quality, "minimal");
  for (let i = 0; i < 6; i++) budget = nextEffectBudget(budget, 16.7, 0);
  assert.equal(budget.quality, "balanced");
  for (let i = 0; i < 6; i++) budget = nextEffectBudget(budget, 16.7, 0);
  assert.equal(budget.quality, "full");
});

test("an area cast advances the combo only once even when it catches several fish", () => {
  const g = new FishingGame(() => 0.5);
  g.start();
  g.skill = "storm";
  g.skillUses = 3;
  g.fish = [
    fish(g, 2001, FISH.jade, 90, g.surface + 160),
    fish(g, 2002, FISH.jade, 180, g.surface + 160),
    fish(g, 2003, FISH.jade, 270, g.surface + 160),
  ];
  g.target({ x: 190, y: g.surface + 160 });
  g.charge = 1;
  g.release();
  g.update(1.8);
  assert.equal(g.catches, 3);
  assert.equal(g.combo, 1);
  assert.equal(g.bestCombo, 1);
  assert.equal(g.skillUses, 2);
  assert.equal(g.score, 30);
});

test("school catches preserve all rewards but use one combined score effect", () => {
  const g = new FishingGame(() => 0.5);
  g.start();
  g.skill = "storm";
  g.skillUses = 3;
  g.fish = Array.from({ length: 24 }, (_, i) =>
    fish(
      g,
      4000 + i,
      FISH.jade,
      190 + (i % 6) * 0.1,
      g.surface + 160 + Math.floor(i / 6) * 0.1,
    ),
  );
  g.target({ x: 190, y: g.surface + 160 });
  g.charge = 1;
  g.release();
  // Begin at the full-screen impact to isolate simultaneous hit pressure.
  g.spear!.pulse = 0.5;
  for (let frame = 0; frame < 120 && g.catches === 0; frame++)
    g.update(1 / 120);
  assert.equal(g.catches, 24);
  assert.equal(g.score, 240);
  assert.equal(g.combo, 1);
  assert.equal(g.skillUses, 2);
  assert.equal(g.bursts.length, 1);
  assert.equal(g.bursts[0].points, 240);
  assert.equal(g.bursts[0].catches, 24);
  g.update(1);
  assert.equal(g.bursts.length, 0);
});

test("armored schools cap feedback without dropping strikes or health", () => {
  const g = new FishingGame(() => 0.5);
  g.start();
  g.skill = "storm";
  g.skillUses = 3;
  g.fish = Array.from({ length: 24 }, (_, i) =>
    fish(
      g,
      5000 + i,
      FISH.iron,
      190 + (i % 6) * 0.1,
      g.surface + 160 + Math.floor(i / 6) * 0.1,
      3,
    ),
  );
  g.target({ x: 190, y: g.surface + 160 });
  g.charge = 1;
  g.release();
  // Begin at the full-screen impact to isolate simultaneous hit pressure.
  g.spear!.pulse = 0.5;
  for (let frame = 0; frame < 120 && g.chips === 0; frame++) g.update(1 / 120);
  assert.equal(g.chips, 24);
  assert.equal(g.catches, 0);
  assert.equal(g.score, 0);
  assert.ok(g.fish.every((f) => f.hp === 2));
  assert.equal(g.bursts.length, MAX_HIT_EFFECTS);
});

test("production balanced ceiling never restores costly full effects", async () => {
  const { nextEffectBudget } = await import("../src/effectBudget.ts");
  let budget = {
    quality: "minimal" as "minimal" | "balanced" | "full",
    slow: 0,
    fast: 0,
  };
  for (let i = 0; i < 60; i++)
    budget = nextEffectBudget(budget, 16.7, 0, "balanced");
  assert.equal(budget.quality, "balanced");
});
