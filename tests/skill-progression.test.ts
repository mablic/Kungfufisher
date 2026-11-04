import { test } from "node:test";
import assert from "node:assert/strict";
import { unlockedManuals, highestClear, MANUAL_UNLOCKS, MANUAL_LESSON } from "../src/skillProgression.ts";
import { SKILLS } from "../src/skills.ts";
import { FishingGame } from "../src/game.ts";
import { LEVELS } from "../src/levels.ts";

test("four chapter rewards unlock two unique manuals each, all available in final chapter", () => {
  assert.deepEqual([0,5,6,17,18,29,30,35,36,42].map(n => unlockedManuals(n).length), [0,0,2,2,4,4,6,6,8,8]);
  assert.equal(new Set(MANUAL_UNLOCKS.flatMap(r => r.skills)).size, SKILLS.length);
  assert.ok(MANUAL_UNLOCKS.every(r => r.skills.length === 2));
  assert.deepEqual([...unlockedManuals(36)].sort(), [...SKILLS].sort());
  for (const skill of SKILLS) assert.ok(MANUAL_LESSON[skill].length > 60);
  assert.equal(highestClear({6:{stars:2},18:{stars:1},5:{stars:3}}),6);
});

test("real drifter drops respect progress and unlocked manuals remain in replay runs", () => {
  for (const id of [1,6,7,18,19,30,31,36,37,42]) {
    const g = new FishingGame(() => .2, LEVELS[id - 1]); g.start(); g.fish = [];
    const allowed = unlockedManuals(id - 1);
    g.update(g.level.manualEvery - 5 + .3);
    assert.equal(g.pickups.length > 0, allowed.length > 0, `level ${id}`);
    for (const pickup of g.pickups) assert.ok(allowed.includes(pickup.skill));
  }
  const replay = new FishingGame(() => .2, { ...LEVELS[0], manualPool: unlockedManuals(36) });
  replay.start(); replay.fish = []; replay.update(replay.level.manualEvery - 5 + .3);
  assert.equal(replay.pickups.length, 1);
  const locked = new FishingGame(() => .2, { ...LEVELS[41], manualPool: [] });
  locked.start(); locked.fish = []; locked.update(30);
  assert.equal(locked.pickups.length, 0, "explicit saved progress wins over selected level");
});

test("six opening levels stay gentle and subsequent chapters increase score and handling pressure", () => {
  for (const level of LEVELS.slice(0,6)) {
    assert.ok(level.speed <= .94); assert.equal(level.roster.length,6);
    assert.equal(level.wind,0); assert.equal(level.waves,0); assert.ok(level.seconds >= 60);
  }
  assert.ok(LEVELS[6].speed > LEVELS[5].speed);
  assert.ok(LEVELS[41].manualEvery > LEVELS[6].manualEvery);
  assert.ok(LEVELS[41].speed > 1.2);
});

test("enlarged manual can be collected near its visible cover edge", () => {
  const g = new FishingGame(() => .2, LEVELS[6]); g.start(); g.fish = [];
  g.pickups = [{ id:999, x:g.origin.x + 25, y:g.surface + 70, vx:0, life:14, phase:0, skill:"twin" }];
  g.target({x:g.origin.x,y:700}); g.charge=1; g.release(); g.update(.4);
  assert.equal(g.gifts,1); assert.equal(g.skill,"twin"); assert.equal(g.skillUses,3);
});
