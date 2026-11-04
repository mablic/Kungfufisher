import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame, startGame, targetGame, releaseGame, advanceGame, pauseGame, resumeGame, aimBlocked } from "../src/game.ts";
import { LEVELS } from "../src/levels.ts";
import { SKILLS } from "../src/skills.ts";
import { consumeSimulationFrame } from "../src/runtimeSafety.ts";

test("a spent sword with a positive subnormal range cannot lock the next cast", () => {
  const g = createGame(); startGame(g);
  g.fish = []; g.pickups = [];
  g.skill = "spin"; g.skillUses = 3;
  targetGame(g, { x: 247, y: 724 }); g.charge = 1;
  assert.equal(releaseGame(g), true);
  Object.assign(g.spear!, { x: 247.01949363130606, y: 723.932708224504,
    vx: 13.474231214125163, vy: 849.8931962859735, rangeLeft: 4.25e-322 });
  advanceGame(g, 0.5);
  assert.equal(g.spear, null);
  targetGame(g, { x: 200, y: 600 });
  assert.equal(releaseGame(g), true);
});

test("all 42 rivers and every technique finish casts and rounds under mixed refresh/interruptions", { timeout: 120000 }, () => {
  let casts = 0;
  for (const level of LEVELS) for (const skill of [null, ...SKILLS]) for (const seed of [1, 90210, 4294967295]) {
    const g = createGame(seed % 2 ? 844 : 932, seed, level);
    startGame(g);
    let carry = 0, flightAge = 0;
    const context = `level=${level.id},skill=${skill},seed=${seed}`;
    for (let frame = 0; frame < (level.seconds + 6) * 120 && g.phase === "playing"; frame++) {
      if (!g.spear && !g.offhand && g.cooldown === 0) {
        g.skill = skill; g.skillUses = 3;
        const fish = g.fish[frame % g.fish.length];
        targetGame(g, frame % 3 === 0 ? { x: frame % 2 ? -100 : g.width + 100, y: g.height + 100 } : fish);
        g.charge = (frame % 11) / 10;
        aimBlocked(g);
        if (releaseGame(g)) casts++;
        flightAge = 0;
      }
      if (frame % 700 === 350) {
        pauseGame(g); const time = g.remaining;
        advanceGame(g, 20); assert.equal(g.remaining, time);
        resumeGame(g);
      }
      const step = consumeSimulationFrame(carry, frame % 503 === 0 ? 1500 : 1000 / [60, 90, 120][frame % 3]);
      carry = step.carryMs;
      advanceGame(g, step.seconds);
      flightAge += step.seconds;
      assert.ok(Number.isFinite(g.remaining) && Number.isFinite(g.score), context);
      for (const spear of [g.spear, g.offhand]) if (spear) {
        assert.ok([spear.x, spear.y, spear.vx, spear.vy, spear.rangeLeft].every(Number.isFinite), context);
        assert.ok(flightAge < 6, `stuck projectile: ${context} frame=${frame} spear=${JSON.stringify(spear)}`);
      }
      assert.ok(g.bursts.length <= 3 && g.pickups.length <= 3, context);
    }
    assert.ok(g.phase === "won" || g.phase === "lost", context);
  }
  assert.ok(casts > 10000, `only ${casts} casts`);
  console.info(`Campaign stress: ${LEVELS.length * (SKILLS.length + 1) * 3} rounds, ${casts} casts`);
});
