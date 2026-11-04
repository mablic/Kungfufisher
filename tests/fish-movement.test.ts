import { test } from "node:test";
import assert from "node:assert/strict";
import { FishingGame } from "../src/game.ts";
import { LEVELS } from "../src/levels.ts";
import { FISH } from "../src/species.ts";

test("koi rise and dive visibly, stay in water, and pause with the clock", () => {
  const g = new FishingGame(() => 0.5);
  g.start();
  const fish = g.fish.find(f => f.kind === FISH.koi)!;
  fish.y = fish.baseY = g.surface + 220;
  let low = fish.y, high = fish.y;
  for (let frame = 0; frame < 1200; frame++) {
    g.update(1 / 60);
    low = Math.min(low, fish.y); high = Math.max(high, fish.y);
    assert.ok(fish.y >= g.surface + 40 && fish.y <= g.height - 125);
  }
  assert.ok(high - low > 100, `vertical travel only ${high - low}`);
  g.pause(); const y = fish.y; g.update(10); assert.equal(fish.y, y);
});

test("early big fish appear briefly, at most once per window, without extra fish", () => {
  for (const id of [1, 4, 5, 6, 7, 11, 17, 23]) {
    const g = new FishingGame(() => 0.5, LEVELS[id - 1]); g.start();
    const count = g.fish.length;
    g.update(19.9);
    assert.ok(!g.fish.some(f => f.kind >= FISH.shark && f.kind <= FISH.grouper));
    g.update(0.2);
    const visitor = g.fish.find(f => f.visitorUntil !== undefined);
    assert.equal(!!visitor, id >= 5 && id % 3 === 2, `level ${id}`);
    assert.equal(g.fish.length, count);
    if (!visitor) continue;
    assert.equal(visitor.visitorUntil! > g.elapsed, true);
    // Model a catch: a replacement normal fish must not cause a second visitor
    // to spawn in the same window.
    g.fish[g.fish.indexOf(visitor)] = { ...visitor, kind: FISH.jade, hp: 1, visitorUntil: undefined };
    g.update(2);
    assert.ok(!g.fish.some(f => f.visitorUntil !== undefined));
    g.update(36);
    assert.ok(!g.fish.some(f => f.visitorUntil !== undefined));
    assert.equal(g.fish.length, count);
  }
});

test("uncaught visitors leave after twelve seconds without removing protected fish", () => {
  const g = new FishingGame(() => 0.5, LEVELS[4]); g.start();
  const turtleIds = g.fish.filter(f => f.kind === FISH.turtle).map(f => f.id);
  g.update(20.1);
  assert.equal(g.fish.filter(f => f.visitorUntil !== undefined).length, 1);
  g.update(12.1);
  assert.ok(!g.fish.some(f => f.visitorUntil !== undefined));
  assert.deepEqual(g.fish.filter(f => f.kind === FISH.turtle).map(f => f.id), turtleIds);
});

test("surface fish dive into the water column without increasing population", () => {
  const g = new FishingGame(() => 0.5, LEVELS[0]); g.start();
  const fish = g.fish[0];
  const count = g.fish.length;
  let deepest = fish.y;
  for (let i = 0; i < 1800; i++) {
    g.update(1 / 60);
    deepest = Math.max(deepest, fish.y);
    for (const f of g.fish)
      assert.ok(f.y >= g.surface + 40 && f.y <= g.height - 125);
  }
  assert.ok(deepest - fish.baseY > 70);
  assert.equal(g.fish.length, count);
});

test("starting lanes do not repeat the surface lane in any level", () => {
  for (const level of LEVELS) {
    const g = new FishingGame(() => 0.5, level);
    assert.ok(g.fish.filter(f => f.baseY < g.surface + 100).length <= 1, `level ${level.id}`);
  }
});

test("first six levels have a gentle six-fish learning curve", () => {
  for (const level of LEVELS.slice(0, 6)) {
    assert.equal(level.roster.length, 6);
    assert.ok(level.speed <= 0.94);
    assert.ok(level.seconds >= 60);
    assert.ok(level.stars[0] <= 320);
    assert.equal(level.assist, 1);
  }
  assert.equal(LEVELS[6].roster.length, 8);
});
