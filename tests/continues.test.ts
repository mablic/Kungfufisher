import { test } from "node:test";
import assert from "node:assert/strict";
import { FishingGame } from "../src/game.ts";
import { LEVELS } from "../src/levels.ts";
import { CONTINUE, continueOffer } from "../src/continues.ts";
import { CASUAL, playLevel } from "../scripts/bot.ts";

function ended(levelId: number, score: number, extensions = 0) {
  const level = LEVELS[levelId - 1];
  return {
    phase: score >= level.stars[0] ? ("won" as const) : ("lost" as const),
    score,
    elapsed: level.seconds,
    level,
    extensions,
  };
}

test("overtime resumes the same run with its score", () => {
  const g = new FishingGame(() => 0.42, LEVELS[4]);
  g.start(LEVELS[4]);
  g.score = 300;
  g.combo = 3;
  g.update(LEVELS[4].seconds + 1);
  assert.equal(g.phase, "lost");
  g.extend(CONTINUE.seconds);
  assert.equal(g.phase, "playing");
  assert.equal(g.remaining, CONTINUE.seconds);
  assert.equal(g.score, 300);
  assert.equal(g.extensions, 1);
  g.update(CONTINUE.seconds + 1);
  assert.ok(g.phase === "won" || g.phase === "lost");
});

test("one optional continue rescues a miss or pursues the next star", () => {
  const level = LEVELS[9],
    clear = level.stars[0];
  assert.equal(CONTINUE.adSeconds, 30);
  assert.equal(CONTINUE.perRun, 1);
  // Every death, including a hopeless score and the opening levels.
  assert.equal(continueOffer(ended(10, clear - 40))?.kind, "rescue");
  assert.equal(
    continueOffer(ended(10, Math.round(clear * 0.2)))?.kind,
    "rescue",
  );
  assert.equal(continueOffer(ended(1, 0))?.kind, "rescue");
  // One chance, then the run is over.
  assert.equal(continueOffer(ended(10, clear - 40, 1)), null);
  assert.equal(continueOffer(ended(10, clear))?.kind, "star");
  assert.equal(continueOffer(ended(10, level.stars[1] - 30))?.needed, 30);
  assert.equal(continueOffer(ended(10, level.stars[2])), null);
  assert.equal(continueOffer(ended(10, clear, 1)), null);
});

test("one accepted continue does not hand casual players three stars", () => {
  let offers = 0,
    threeStars = 0,
    runs = 0;
  for (const id of [5, 9, 15, 21, 27])
    for (let seed = 1; seed <= 12; seed++) {
      let rescue = false;
      const run = playLevel(LEVELS[id - 1], 9000 + seed, CASUAL, (g) => {
        const offer = continueOffer(g);
        if (offer?.kind === "rescue") rescue = true;
        return offer?.seconds ?? 0;
      });
      runs++;
      if (run.stars === 3) threeStars++;
      if (rescue) offers++;
    }
  assert.ok(offers > 0);
  assert.ok(
    threeStars / runs <= 0.2,
    `casual three stars ${threeStars}/${runs}`,
  );
});

test("overtime is exactly fifteen seconds, once per run, and preserves manual uses", () => {
  const g = new FishingGame(() => 0.5);
  g.start();
  g.skill = "spin";
  g.skillUses = 2;
  g.update(g.remaining + 1);
  const score = g.score;
  g.extend(30);
  assert.equal(g.phase, "lost");
  assert.equal(g.extensions, 0);
  g.extend(15);
  assert.equal(g.remaining, 15);
  assert.equal(g.skillUses, 2);
  assert.equal(g.score, score);
  g.update(16);
  g.extend(15);
  assert.notEqual(g.phase, "playing");
  assert.equal(g.extensions, 1);
});
