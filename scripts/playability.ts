// Experience report: reward rhythm, dead time, tension and a simulated
// campaign funnel. Run: node --experimental-strip-types scripts/playability.ts
import { LEVELS, starsFor } from "../src/levels.ts";
import { CASUAL, SKILLED, playLevel, type Skill } from "./bot.ts";

const RUNS = 40;
// Players improve: halfway between casual and skilled by the second half.
const LEARNED: Skill = {
  name: "learned",
  aimError: (CASUAL.aimError + SKILLED.aimError) / 2,
  reaction: (CASUAL.reaction + SKILLED.reaction) / 2,
  windRead: (CASUAL.windRead + SKILLED.windRead) / 2,
  leadError: (CASUAL.leadError + SKILLED.leadError) / 2,
  caution: (CASUAL.caution + SKILLED.caution) / 2,
};
const median = (values: number[]) => {
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};
const pct = (part: number, whole: number) => Math.round((100 * part) / whole);

type Run = ReturnType<typeof playLevel>;
const pools: { casual: Run[]; learned: Run[] }[] = [];
const rows = [];
for (const level of LEVELS) {
  const casual = Array.from({ length: RUNS }, (_, i) =>
      playLevel(level, 1000 + i, CASUAL),
    ),
    learned = Array.from({ length: RUNS }, (_, i) =>
      playLevel(level, 2000 + i, LEARNED),
    );
  pools.push({ casual, learned });
  const lost = casual.filter((r) => r.stars === 0),
    near = lost.filter((r) => r.score >= level.stars[0] * 0.85),
    cleared = casual.filter((r) => r.clearedAt >= 0);
  rows.push({
    id: level.id,
    name: level.name,
    clear: pct(casual.length - lost.length, RUNS),
    nearMiss: lost.length ? pct(near.length, lost.length) : 0,
    catchPerMin: +(
      median(casual.map((r) => r.catches)) /
      (level.seconds / 60)
    ).toFixed(1),
    first: +median(casual.map((r) => r.firstCatch)).toFixed(1),
    drought: Math.round(median(casual.map((r) => r.drought))),
    idlePct: pct(median(casual.map((r) => r.idle)), level.seconds),
    clearAtPct: cleared.length
      ? pct(median(cleared.map((r) => r.clearedAt)), level.seconds)
      : -1,
    golden: `${median(casual.map((r) => r.golden))}/${median(casual.map((r) => r.goldenSeen))}`,
    streaks: median(casual.map((r) => r.streaks)),
    turtle: +(casual.reduce((a, r) => a + r.turtleHits, 0) / RUNS).toFixed(2),
    seal: pct(casual.filter((r) => r.seal).length, RUNS),
  });
}
console.table(rows);

// Campaign funnel: players play in order, retrying on failure. Each failure
// raises the chance they quit; a clear resets it.
let state = 12345;
const rand = () => {
  state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  return state / 4294967296;
};
const PLAYERS = 1000;
const reached = new Array(LEVELS.length + 1).fill(0),
  attempts = new Array(LEVELS.length).fill(0),
  quits = new Array(LEVELS.length).fill(0);
let minutes = 0,
  finishers = 0;
for (let p = 0; p < PLAYERS; p++) {
  let played = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    reached[i]++;
    const pool = i < 10 ? pools[i].casual : pools[i].learned;
    let fails = 0,
      done = false;
    while (!done) {
      attempts[i]++;
      played += LEVELS[i].seconds / 60 + 0.3;
      const run = pool[Math.floor(rand() * pool.length)];
      if (starsFor(run.score, LEVELS[i]) >= 1) done = true;
      else {
        fails++;
        if (rand() < 0.08 + 0.1 * fails) break;
      }
    }
    if (!done) {
      quits[i]++;
      break;
    }
    // Natural attrition: some players leave even after a clear.
    if (rand() < 0.015) {
      quits[i]++;
      break;
    }
    if (i === LEVELS.length - 1) finishers++;
  }
  minutes += played;
}
console.table(
  LEVELS.map((level, i) => ({
    id: level.id,
    reached: pct(reached[i], PLAYERS),
    tries: +(attempts[i] / Math.max(1, reached[i])).toFixed(2),
    quitHere: pct(quits[i], PLAYERS),
  })),
);
console.log(
  `finish campaign: ${pct(finishers, PLAYERS)}%  ·  mean playtime ${Math.round(minutes / PLAYERS)} min`,
);
