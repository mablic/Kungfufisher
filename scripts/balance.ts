// Prints bot scores per level and the star thresholds the difficulty curve implies.
// Run: node --experimental-strip-types scripts/balance.ts
import fs from "node:fs";
import { LEVELS } from "../src/levels.ts";
import { CASUAL, SKILLED, survey } from "./bot.ts";

const round = (v: number) => Math.max(10, Math.round(v / 10) * 10);
const rows = [];
const distributions: unknown[] = [];
for (const level of LEVELS) {
  const casual = survey(level, CASUAL, 60),
    skilled = survey(level, SKILLED, 60),
    progress = (level.id - 1) / (LEVELS.length - 1);
  const percentile = (scores: number[], p: number) =>
    scores[Math.min(scores.length - 1, Math.floor(scores.length * p))];
  // Tutorial stays accessible. Two buildup stages target ~70% to 50% casual clears;
  // every third stage targets ~45% to 35%. These are bot estimates, not ad guarantees.
  const one = round(
      percentile(
        casual.scores,
        level.id === 1
          ? 0.2
          : level.challenge
            ? 0.55 + 0.1 * progress
            : 0.3 + 0.2 * progress,
      ),
    ),
    three = Math.max(
      one + 20,
      round(percentile(skilled.scores, 0.55 + 0.2 * progress)),
      round(percentile(casual.scores, 0.975)),
    ),
    two = round((one + three) / 2);
  distributions.push({
    id: level.id,
    casual: casual.scores,
    skilled: skilled.scores,
  });
  rows.push({
    id: level.id,
    name: level.name,
    casual: Math.round(casual.mean),
    cAcc: Math.round(casual.accuracy),
    cShots: Math.round(casual.shots),
    skilled: Math.round(skilled.mean),
    sAcc: Math.round(skilled.accuracy),
    cSeal: Math.round(casual.seals * 100),
    sSeal: Math.round(skilled.seals * 100),
    current: level.stars.join("/"),
    suggested: [one, two, three].join("/"),
  });
}
console.table(rows);
if (process.argv.includes("--json"))
  console.log(
    JSON.stringify(rows.map((r) => r.suggested.split("/").map(Number))),
  );

const report = process.argv.indexOf("--report");
if (report >= 0 && process.argv[report + 1])
  fs.writeFileSync(
    process.argv[report + 1],
    JSON.stringify({ seeds: 60, rows, distributions }, null, 2),
  );
