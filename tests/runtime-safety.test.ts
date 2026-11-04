import { test } from "node:test";
import assert from "node:assert/strict";
import { frameStepSeconds, heartbeatExpired } from "../src/runtimeSafety.ts";
import { FishingGame, rebuildGame } from "../src/game.ts";
import { LEVELS } from "../src/levels.ts";
import { FISH, SPECIES } from "../src/species.ts";

test("late and invalid frames cannot cause a UI catch-up spiral", () => {
  for (const invalid of [NaN, Infinity, -1, 0])
    assert.equal(frameStepSeconds(invalid), 0);
  assert.equal(frameStepSeconds(10000), 0.1);
  assert.ok(Math.abs(frameStepSeconds(1000 / 60) - 1 / 60) < 1e-9);
});

test("stall detection is disabled for background and paused runs", () => {
  assert.equal(heartbeatExpired(10000, 0, false, true), false);
  assert.equal(heartbeatExpired(10000, 0, true, false), false);
  assert.equal(heartbeatExpired(5900, 0, true, true), false);
  assert.equal(heartbeatExpired(6100, 0, true, true), true);
});

test("recovery reconstructs a corrupt level-13 run instead of resuming its effects", () => {
  const g = new FishingGame(() => 0.5, LEVELS[12]);
  g.start();
  g.skill = "spin";
  g.skillUses = 2;
  g.score = 220;
  g.target({ x: 220, y: 700 });
  g.charge = 1;
  g.release();
  g.fish[0].x = NaN;
  const recovered = rebuildGame(g, g.height, LEVELS[12]);
  assert.equal(recovered.phase, "ready");
  assert.equal(recovered.run, g.run + 1);
  assert.equal(recovered.score, 0);
  assert.equal(recovered.spear, null);
  assert.equal(recovered.aim, null);
  assert.equal(recovered.skill, null);
  assert.equal(recovered.bursts.length, 0);
  assert.ok(
    recovered.fish.every((f) => Number.isFinite(f.x) && Number.isFinite(f.y)),
  );
  assert.equal(g.score, 220, "rebuilding does not mutate an existing snapshot");
});

test("level 13 spin survives repeated casts, pauses and resumed frames across seeds", () => {
  for (let seed = 1; seed <= 20; seed++) {
    const g = new FishingGame(() => seed / 21, LEVELS[12]);
    g.start();
    for (
      let frame = 0;
      frame < (g.level.seconds + 6) * 60 && g.phase === "playing";
      frame++
    ) {
      if (!g.spear && g.cooldown === 0) {
        g.skill = "spin";
        g.skillUses = 3;
        const f = g.fish[frame % g.fish.length];
        g.target({ x: f.x, y: f.y });
        g.charge = 0.8;
        g.release();
      }
      if (frame % 240 === 120) {
        g.pause();
        const time = g.remaining;
        g.update(30);
        assert.equal(g.remaining, time);
        g.resume();
      }
      g.update(frameStepSeconds(frame % 179 === 0 ? 1500 : 1000 / 60));
      assert.ok(Number.isFinite(g.score) && Number.isFinite(g.remaining));
      assert.ok(g.bursts.length <= 3 && g.pickups.length <= 3);
      assert.ok(
        g.fish.every((f) => Number.isFinite(f.x) && Number.isFinite(f.y)),
      );
    }
    assert.ok(g.phase === "lost" || g.phase === "won");
  }
});

test("expanded campaign has bounded populations, every-third trials and large fish", () => {
  assert.equal(LEVELS.length, 42);
  assert.equal(SPECIES.length, 20);
  for (const level of LEVELS) {
    assert.equal(level.challenge, level.id % 3 === 0);
    assert.ok(level.roster.length <= 8);
    assert.ok(level.manualEvery >= 10);
  }
  assert.ok(LEVELS.slice(30).some((l) => l.roster.includes(FISH.shark)));
  assert.ok(LEVELS.slice(30).some((l) => l.roster.includes(FISH.hammerhead)));
});
