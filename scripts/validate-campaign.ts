// Independent balance validation; stores every level rather than stopping at the first failure.
import fs from "node:fs";
import { LEVELS } from "../src/levels.ts";
import { CASUAL, SKILLED, playLevel } from "./bot.ts";
const seeds = Array.from({ length: 24 }, (_, i) => 1101 + i * 101),
  rows = [];
for (const level of LEVELS) {
  const casual = seeds.map((s) => playLevel(level, s, CASUAL)),
    skilled = seeds.map((s) => playLevel(level, s, SKILLED));
  const r = {
    level: level.id,
    clear: casual.filter((r) => r.stars > 0).length,
    casualThree: casual.filter((r) => r.stars === 3).length,
    skilledThree: skilled.filter((r) => r.stars === 3).length,
    skilledSeals: skilled.filter((r) => r.seal).length,
    casualSeals: casual.filter((r) => r.seal).length,
  };
  const valid =
    r.clear >= (level.challenge ? 3 : 6) &&
    r.casualThree <= 3 &&
    r.skilledThree > 0 &&
    r.skilledSeals > 0 &&
    (level.id === 1 || r.casualSeals <= 21);
  rows.push({ ...r, valid });
  console.log(JSON.stringify({ ...r, valid }));
}
if (process.argv[2])
  fs.writeFileSync(process.argv[2], JSON.stringify({ seeds, rows }, null, 2));
const failures = rows.filter((r) => !r.valid);
if (failures.length) {
  console.error(JSON.stringify(failures));
  process.exitCode = 1;
}
