import { test } from "node:test";
import assert from "node:assert/strict";
import { FishingGame, aimBlocked } from "../src/game.ts";
import { FISH } from "../src/species.ts";

for (const [kind, penalty] of [[FISH.squid, 30], [FISH.seahorse, 20], [FISH.turtle, 50]]) {
  test(`protected species ${kind} warns, deducts points once and cannot be caught`, () => {
    const g = new FishingGame(() => 0.5); g.start();
    const f = g.fish[0]; f.kind = kind; f.hp = 1;
    f.x = g.origin.x; f.y = f.baseY = g.surface + 70;
    f.old = { x: f.x, y: f.y }; g.fish = [f];
    g.score = 100; g.combo = 4; g.timeStop = 3;
    g.target({ x: f.x, y: f.y }); g.charge = 1;
    assert.equal(aimBlocked(g), true);
    g.release(); g.update(0.5);
    assert.equal(g.score, 100 - penalty); assert.equal(g.combo, 0);
    assert.equal(g.catches, 0); assert.equal(g.caught[kind], 0);
    assert.equal(g.fish[0].id, f.id);
    assert.equal(g.spear, null);
  });
  test(`protected species ${kind} never takes the score below zero`, () => {
    const g = new FishingGame(() => 0.5); g.start();
    const f = g.fish[0]; f.kind = kind; f.hp = 1;
    f.x = g.origin.x; f.y = f.baseY = g.surface + 70;
    f.old = { x: f.x, y: f.y }; g.fish = [f];
    g.score = 10; g.timeStop = 3;
    g.target({ x: f.x, y: f.y }); g.charge = 1; g.release(); g.update(0.5);
    assert.equal(g.score, 0);
  });
  test(`screen wave spares protected species ${kind}`, () => {
    const g = new FishingGame(() => 0.5); g.start();
    const f = g.fish[0]; f.kind = kind; f.hp = 1; g.fish = [f];
    g.score = 100; g.skill = "storm"; g.skillUses = 3;
    g.target({ x: f.x, y: f.y }); g.charge = 1; g.release(); g.update(3);
    assert.equal(g.score, 100); assert.equal(g.catches, 0);
  });
}
