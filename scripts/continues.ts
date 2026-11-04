// Tunes rewarded overtime: how often it is offered, and how often a watched ad
// actually pays off. Run: node --experimental-strip-types scripts/continues.ts [--sweep]
import { CASUAL, SKILLED, playLevel, type Skill } from "./bot.ts";
import { LEVELS, starsFor } from "../src/levels.ts";
import { CONTINUE, continueOffer } from "../src/continues.ts";

const RUNS = 40;
const MID: Skill = {
  name: "learned",
  aimError: (CASUAL.aimError + SKILLED.aimError) / 2,
  reaction: (CASUAL.reaction + SKILLED.reaction) / 2,
  windRead: (CASUAL.windRead + SKILLED.windRead) / 2,
  leadError: (CASUAL.leadError + SKILLED.leadError) / 2,
  caution: (CASUAL.caution + SKILLED.caution) / 2,
};

type Tally = {
  runs: number;
  losses: number;
  rescueOffers: number;
  rescued: number;
  wins: number;
  starOffers: number;
  starGained: number;
  ads: number;
  wasted: number;
};
function blank(): Tally {
  return {
    runs: 0,
    losses: 0,
    rescueOffers: 0,
    rescued: 0,
    wins: 0,
    starOffers: 0,
    starGained: 0,
    ads: 0,
    wasted: 0,
  };
}

function measure(levelId: number, skill: Skill, tally: Tally) {
  const level = LEVELS[levelId - 1];
  for (let seed = 1; seed <= RUNS; seed++) {
    let first: "rescue" | "star" | null = null,
      startStars = 0,
      ads = 0,
      paidOff = 0;
    const run = playLevel(level, 5000 + seed, skill, (g) => {
      const stars = starsFor(g.score, level);
      if (ads > 0 && stars > startStars + paidOff) paidOff++;
      const offer = continueOffer(g);
      if (!offer) return 0;
      if (!first) {
        first = offer.kind;
        startStars = stars;
      }
      ads++;
      return offer.seconds;
    });
    const stars = starsFor(run.score, level);
    tally.runs++;
    tally.ads += ads;
    // An ad "wastes" the player's time if it earned nothing new.
    if (ads > 0 && stars === startStars) tally.wasted += ads;
    if (first === "rescue" || (!first && stars === 0)) {
      tally.losses++;
      if (first) {
        tally.rescueOffers++;
        if (stars > 0) tally.rescued++;
      }
    } else {
      tally.wins++;
      if (first === "star") {
        tally.starOffers++;
        if (stars > startStars) tally.starGained++;
      }
    }
  }
}

const pct = (a: number, b: number) => (b ? Math.round((100 * a) / b) : 0);
function summary(t: Tally) {
  return {
    rescueOffered: pct(t.rescueOffers, t.losses),
    rescued: pct(t.rescued, t.rescueOffers),
    starOffered: pct(t.starOffers, t.wins),
    starGained: pct(t.starGained, t.starOffers),
    adsPerRun: Math.round((t.ads / t.runs) * 100) / 100,
    wastedAds: pct(t.wasted, t.ads),
  };
}

if (process.argv.includes("--sweep")) {
  const rows = [];
  for (const seconds of [10, 15, 30]) {
    Object.assign(CONTINUE, { seconds });
    const t = blank();
    for (const level of LEVELS)
      if (level.id % 3 === 0)
        measure(level.id, level.id <= 10 ? CASUAL : MID, t);
    rows.push({ seconds, ...summary(t) });
  }
  Object.assign(CONTINUE, { seconds: 15 });
  console.table(rows);
} else {
  const rows = [],
    all = blank();
  for (const level of LEVELS) {
    const t = blank();
    measure(level.id, level.id <= 10 ? CASUAL : MID, t);
    for (const key of Object.keys(t) as (keyof Tally)[]) all[key] += t[key];
    rows.push({ id: level.id, name: level.name, ...summary(t) });
  }
  console.table(rows);
  console.log("all levels:", summary(all));
}
