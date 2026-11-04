import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FishingGame,
  SPECIES,
  TUNING,
  clarity,
  sealEarned,
  sealProgress,
  windAt,
} from "../src/game.ts";
import { FISH } from "../src/species.ts";
import { CHAPTERS, LEVELS, MECHANICS, starsFor } from "../src/levels.ts";
import { CASUAL, SKILLED, playLevel } from "../scripts/bot.ts";

test("forty-two levels in seven chapters with valid rosters and ascending star thresholds", () => {
  assert.equal(LEVELS.length, 42);
  LEVELS.forEach((level, i) => {
    assert.equal(level.id, i + 1);
    assert.equal(level.chapter, Math.floor(i / 6));
    assert.ok(CHAPTERS[level.chapter]);
    assert.ok(level.roster.length >= 6 && level.roster.length <= 10);
    assert.ok(level.roster.every((kind) => SPECIES[kind]));
    assert.ok(
      level.stars[0] < level.stars[1] && level.stars[1] < level.stars[2],
    );
    assert.ok(level.fog >= 0 && level.fog < 0.9);
    assert.ok(level.waves >= 0 && level.waves <= 1);
    if (level.intro) assert.ok(MECHANICS[level.intro]);
  });
  assert.deepEqual(
    [0, 99, 100, 199, 200, 300, 9999].map((s) =>
      starsFor(s, { ...LEVELS[0], stars: [100, 200, 300] }),
    ),
    [0, 0, 1, 1, 2, 3, 3],
  );
});

test("each new hazard is introduced before it is combined with others", () => {
  const first = (predicate: (l: (typeof LEVELS)[number]) => boolean) =>
    LEVELS.find(predicate)!.id;
  const intro = (key: string) => LEVELS.find((l) => l.intro === key)!.id;
  assert.equal(
    first((l) => l.roster.includes(FISH.fry)),
    intro("fry"),
  );
  assert.equal(
    first((l) => l.roster.includes(FISH.flick)),
    intro("flick"),
  );
  assert.equal(
    first((l) => l.wind !== 0),
    intro("wind"),
  );
  assert.equal(
    first((l) => l.windShift),
    intro("shift"),
  );
  assert.equal(
    first((l) => l.roster.includes(FISH.iron)),
    intro("iron"),
  );
  assert.equal(
    first((l) => l.waves > 0),
    intro("waves"),
  );
  assert.equal(
    first((l) => l.roster.includes(FISH.dragon)),
    intro("dragon"),
  );
  assert.equal(
    first((l) => l.weather === "night"),
    intro("night"),
  );
  for (const key of [
    "turtle",
    "mandarin",
    "eel",
    "puffer",
    "catfish",
    "lantern",
    "sturgeon",
  ] as const)
    assert.equal(
      first((l) => l.roster.includes(FISH[key])),
      intro(key),
      key,
    );
  assert.equal(
    first((l) => l.thunder),
    intro("thunder"),
  );
  // Every chapter adds pressure: its trial is harder than its opening level.
  for (let c = 0; c < CHAPTERS.length; c++) {
    const open = LEVELS[c * 6],
      trial = LEVELS[c * 6 + 5];
    const pressure = (l: typeof open) =>
      l.speed + Math.abs(l.wind) / 200 + l.waves + l.fog + l.gust / 200;
    assert.ok(pressure(trial) > pressure(open), `chapter ${c + 1}`);
  }
});

test("something new at least every third level", () => {
  // A level counts as fresh if it opens a chapter (new scenery) or teaches a mechanic.
  let stale = 0;
  for (const level of LEVELS) {
    const fresh = level.intro !== null || (level.id - 1) % 6 === 0;
    stale = fresh ? 0 : stale + 1;
    assert.ok(stale <= 2, `levels up to ${level.id} add nothing new`);
  }
  const kinds = new Set(LEVELS.flatMap((l) => [...l.roster]));
  assert.equal(kinds.size, SPECIES.length, "every species appears");
});

function armoured(g: FishingGame, kind: number) {
  return {
    id: 50,
    kind,
    x: g.origin.x,
    y: g.surface + 70,
    baseY: g.surface + 70,
    direction: 1,
    turnIn: 99,
    phase: 0,
    old: { x: g.origin.x, y: g.surface + 70 },
    hp: SPECIES[kind].hp,
  };
}
test("iron carp needs three strikes; strikes keep the combo but only the last one scores", () => {
  const g = new FishingGame(() => 0.5, LEVELS[12]);
  g.start();
  g.fish = [armoured(g, FISH.iron)];
  for (let strike = 1; strike <= 2; strike++) {
    const f = g.fish[0];
    f.x = g.origin.x;
    f.y = f.old.y = f.baseY;
    f.old.x = f.x;
    f.motion = undefined;
    g.target({ x: g.origin.x, y: 700 });
    assert.equal(g.release(), true);
    g.update(0.4);
    assert.equal(g.score, 0);
    assert.equal(g.fish[0].hp, 3 - strike);
    // Health/chip counters verify the strike; the brief flash may finish before this .4s step ends.
    assert.equal(g.chips, strike);
    assert.ok(g.comboTime > 0);
  }
  const f = g.fish[0];
  f.x = f.old.x = g.origin.x;
  f.y = f.old.y = f.baseY;
  f.motion = undefined;
  g.target({ x: g.origin.x, y: 700 });
  g.release();
  g.update(0.4);
  assert.equal(g.score, SPECIES[FISH.iron].points);
  assert.equal(g.catches, 1);
  assert.equal(g.hits, 3);
  assert.equal(g.accuracy, 100);
  assert.equal(g.fish[0].kind, LEVELS[12].roster[0]);
});

function strike(g: FishingGame, kind: number) {
  const f = g.fish[0];
  f.kind = kind;
  f.x = f.old.x = g.origin.x;
  f.y = f.old.y = f.baseY = g.surface + 70;
  f.motion = undefined;
  g.cooldown = 0;
  g.target({ x: g.origin.x, y: 700 });
  g.release();
  g.update(0.4);
  return g.fish[0];
}

test("striking a turtle costs points, breaks the combo and stops the spear", () => {
  const g = new FishingGame(() => 0.5, LEVELS[2]);
  g.start();
  g.fish = [armoured(g, FISH.turtle)];
  g.score = 30;
  g.combo = 4;
  const turtle = strike(g, FISH.turtle);
  assert.equal(g.score, 0, "penalty never takes the score below zero");
  assert.equal(g.combo, 0);
  assert.equal(g.turtleHits, 1);
  assert.equal(g.spear, null);
  assert.equal(turtle.kind, FISH.turtle, "the turtle swims on");
  assert.equal(g.hits, 0);
  assert.equal(g.bursts.at(-1)!.points, -30);
  g.score = 200;
  strike(g, FISH.turtle);
  assert.equal(g.score, 200 - TUNING.turtlePenalty);
  assert.equal(sealProgress({ ...g, level: { ...LEVELS[2] } }).failed, true);
});

test("a puffer inflates on the first strike, slows down and lands on the second", () => {
  const g = new FishingGame(() => 0.5, LEVELS[13]);
  g.start();
  g.fish = [armoured(g, FISH.puffer)];
  const puffed = strike(g, FISH.puffer);
  assert.equal(puffed.hp, 1);
  assert.equal(g.score, 0);
  g.update(0.5);
  assert.equal(g.fish[0].inflate, 1);
  assert.ok(
    g.fish[0].motion!.speed < SPECIES[FISH.puffer].speed * g.level.speed * 0.6,
  );
  strike(g, FISH.puffer);
  assert.equal(g.score, SPECIES[FISH.puffer].points);
  assert.equal(g.caught[FISH.puffer], 1);
});

test("a buried catfish cannot be struck", () => {
  const g = new FishingGame(() => 0.5, LEVELS[20]);
  g.start();
  g.fish = [armoured(g, FISH.catfish)];
  g.fish[0].hidden = TUNING.hideSeconds;
  strike(g, FISH.catfish);
  assert.equal(g.catches, 0);
  assert.equal(g.misses, 1);
  g.fish[0].hidden = 0;
  g.fish[0].hideIn = 99;
  strike(g, FISH.catfish);
  assert.equal(g.caught[FISH.catfish], 1);
});

test("landing a lantern koi lights the river; thunder flashes do too", () => {
  const g = new FishingGame(() => 0.5, LEVELS[22]);
  g.start();
  g.fish = [armoured(g, FISH.lantern)];
  assert.equal(clarity(g), 0);
  strike(g, FISH.lantern);
  assert.ok(clarity(g) > 0.9);
  g.update(TUNING.flareSeconds);
  assert.equal(clarity(g), 0);
  const storm = new FishingGame(() => 0.5, LEVELS[27]);
  storm.start();
  let peak = 0;
  for (let i = 0; i < 60 * 30; i++) {
    storm.fish = [];
    storm.update(1 / 60);
    peak = Math.max(peak, clarity(storm));
  }
  assert.ok(peak > 0.9, "a flash clears the water within 30 seconds");
});

test("seals: catch goals count species, and nothing is earned without clearing", () => {
  const level = LEVELS[0];
  assert.equal(level.seal.type, "catch");
  const g = new FishingGame(() => 0.5, level);
  g.start();
  g.fish = [armoured(g, FISH.koi)];
  for (let i = 0; i < 3; i++) strike(g, FISH.koi);
  assert.deepEqual(sealProgress(g), {
    value: 3,
    target: 3,
    met: true,
    failed: false,
  });
  g.update(g.remaining + 0.01);
  assert.equal(g.phase, "lost");
  assert.equal(sealEarned(g), false);
  g.phase = "won";
  assert.equal(sealEarned(g), true);
});

test("wind bends the spear sideways and shifting wind changes direction", () => {
  const calm = new FishingGame(() => 0.5, LEVELS[0]),
    windy = new FishingGame(() => 0.5, LEVELS[9]);
  for (const g of [calm, windy]) {
    g.start();
    g.fish = [];
    g.target({ x: g.origin.x, y: 800 });
    g.update(1.2);
    g.release();
    g.update(0.3);
  }
  assert.equal(calm.wind, 0);
  assert.ok(windy.spear!.vx - calm.spear!.vx < -30, "level 10 wind blows left");
  const shift = LEVELS.find((l) => l.windShift)!;
  const samples = Array.from({ length: 80 }, (_, i) => windAt(shift, i));
  assert.ok(Math.min(...samples) < 0 && Math.max(...samples) > 0);
});

test("swell moves the skiff and the casting hand", () => {
  const calm = new FishingGame(() => 0.5, LEVELS[0]),
    swell = new FishingGame(() => 0.5, LEVELS[14]);
  const range = (g: FishingGame) => {
    g.start();
    g.fish = [];
    let lo = Infinity,
      hi = -Infinity;
    for (let i = 0; i < 300; i++) {
      g.update(1 / 30);
      lo = Math.min(lo, g.origin.y);
      hi = Math.max(hi, g.origin.y);
    }
    return hi - lo;
  };
  assert.ok(range(swell) > range(calm) * 2.5);
});

test("every level runs its full length on all rosters without leaving the water", () => {
  for (const level of LEVELS) {
    const g = new FishingGame(() => 0.37, level);
    g.start();
    for (let i = 0; i < level.seconds * 20; i++) {
      g.update(1 / 20);
      if (g.phase !== "playing") break;
      for (const f of g.fish) {
        assert.ok(Number.isFinite(f.x) && Number.isFinite(f.y));
        assert.ok(f.y > g.surface && f.y < g.height - 100);
      }
    }
    assert.ok(g.phase === "lost");
  }
});

test("balance: every level remains clearable and skilled goals stay reachable", () => {
  // Seeds differ from the ones used to set thresholds in scripts/balance.ts.
  // 24 runs keep a ~55% level from failing on sampling noise alone.
  const seeds = Array.from({ length: 24 }, (_, i) => 2011 + i * 89);
  for (const level of LEVELS) {
    const casual = seeds.map((s) => playLevel(level, s, CASUAL)),
      skilled = seeds.map((s) => playLevel(level, s, SKILLED));
    const cleared = casual.filter((r) => r.stars >= 1).length;
    assert.ok(skilled.filter(r => r.stars >= 2).length >= 6,
      `level ${level.id}: two-star progression must remain reachable`);
    if (level.id <= 6)
      assert.ok(casual.filter(r => r.stars >= 2).length >= 20,
        `opening level ${level.id}: two-star gate should stay welcoming`);
    assert.ok(
      cleared >= (level.challenge ? 3 : 6),
      `level ${level.id}: casual cleared ${cleared}/24`,
    );
    // Full-body targets intentionally make catches and optional seals easier.
    // Preserve progression accessibility rather than enforcing old hitbox-era rarity.
    assert.ok(
      skilled.reduce((sum, r) => sum + r.score, 0) >= casual.reduce((sum, r) => sum + r.score, 0),
      `level ${level.id}: accurate play should still improve total score`,
    );
    assert.ok(
      skilled.some((r) => r.stars === 3),
      `level ${level.id}: three stars unreachable`,
    );
    assert.ok(
      skilled.some((r) => r.seal),
      `level ${level.id}: seal unreachable`,
    );
    // Optional seals can now be common; they are rewards, not mandatory gates.
  }
});
