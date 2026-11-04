import { test } from "node:test";
import assert from "node:assert/strict";
import { FishingGame } from "../src/game.ts";
import { LEVELS } from "../src/levels.ts";
import { FISH, SPECIES } from "../src/species.ts";

test("Time Seal freezes fish, keeps the level clock running, expires and resumes movement", () => {
  const g = new FishingGame(() => 0.5); g.start();
  g.update(1);
  g.skill = "freeze"; g.skillUses = 3;
  g.target({ x: 390, y: 800 }); g.release();
  assert.equal(g.skillUses, 2);
  assert.equal(g.timeStop, 3);
  g.spear = null;
  const positions = g.fish.map(f => ({ x: f.x, y: f.y }));
  const before = g.remaining;
  g.update(2);
  assert.deepEqual(g.fish.map(f => ({ x: f.x, y: f.y })), positions);
  assert.ok(Math.abs(g.remaining - (before - 2)) < 1e-6);
  g.pause(); const frozen = g.timeStop; g.update(10); assert.equal(g.timeStop, frozen);
  g.resume(); g.update(1.2);
  assert.equal(g.timeStop, 0);
  assert.notDeepEqual(g.fish.map(f => ({ x: f.x, y: f.y })), positions);
});

test("Time Seal permits real catches, never stacks time and resets on restart", () => {
  const g = new FishingGame(() => 0.5); g.start();
  const f = g.fish[0];
  f.x = g.origin.x; f.y = f.baseY = g.surface + 70; f.old = { x: f.x, y: f.y };
  g.fish = [f];
  g.skill = "freeze"; g.skillUses = 3;
  g.target({ x: f.x, y: f.y }); g.charge = 1; assert.equal(g.release(), true);
  g.update(0.5); assert.equal(g.catches, 1);
  g.target({ x: 200, y: 600 }); assert.equal(g.release(), true);
  assert.equal(g.timeStop, 3);
  g.start(); assert.equal(g.timeStop, 0);
});

test("new species have distinct art cells and enter the campaign without increasing populations", () => {
  assert.equal(SPECIES[FISH.squid].atlas, 3);
  assert.equal(SPECIES[FISH.seahorse].atlas, 3);
  assert.notEqual(SPECIES[FISH.squid].cell, SPECIES[FISH.seahorse].cell);
  assert.equal(LEVELS.find(l => l.roster.includes(FISH.seahorse))!.id, 6);
  assert.equal(LEVELS.find(l => l.roster.includes(FISH.squid))!.id, 12);
  assert.ok(LEVELS.filter(l => l.roster.includes(FISH.squid)).length >= 3);
  assert.ok(LEVELS.every(l => l.roster.length <= 8));
});
