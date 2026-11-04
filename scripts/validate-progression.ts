import fs from 'node:fs';
import { LEVELS } from '../src/levels.ts';
import { CASUAL, SKILLED, playLevel } from './bot.ts';
const report = LEVELS.map(level => {
  const casual=Array.from({length:24},(_,i)=>playLevel(level,2011+i*89,CASUAL));
  const skilled=Array.from({length:24},(_,i)=>playLevel(level,2011+i*89,SKILLED));
  return {id:level.id, casualClears:casual.filter(r=>r.stars>0).length,
    skilledThree:skilled.filter(r=>r.stars===3).length,
    skilledSeals:skilled.filter(r=>r.seal).length,
    maxSkilled:Math.max(...skilled.map(r=>r.score)),
    totalCasual:casual.reduce((sum,r)=>sum+r.score,0), totalSkilled:skilled.reduce((sum,r)=>sum+r.score,0)};
});
fs.writeFileSync(process.argv[2] ?? '/tmp/kff-progression-validation.json', JSON.stringify(report,null,2));
console.log(JSON.stringify(report.filter(r=>!r.skilledThree || !r.skilledSeals || r.casualClears<6 || r.totalSkilled<r.totalCasual)));
