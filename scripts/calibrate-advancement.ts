import fs from 'node:fs';
import { LEVELS } from '../src/levels.ts';
import { CASUAL, playLevel } from './bot.ts';
// Two stars are the progression gate. Avoid reusing the old mastery-oriented
// midpoint goal, which would turn this rule change into a sudden difficulty wall.
const report = LEVELS.map(level => {
  const scores = Array.from({length:24},(_,i)=>playLevel(level,3109+i*107,CASUAL).score).sort((a,b)=>a-b);
  const progress = Math.max(0,(level.id-7)/35);
  const percentile = level.id <= 6 ? .10 : .40 + .15*progress + (level.challenge ? .05 : 0);
  const round = (n:number)=>Math.round(n/10)*10;
  const opening = [170,250,320,380,440,480];
  const baseTwo = level.id <= 6 ? opening[level.id - 1] : Math.min(level.stars[2]-10, Math.max(level.stars[0]+30,
    round(scores[Math.floor(percentile*23)])));
  const two = level.id <= 6 ? baseTwo : Math.min(level.stars[2]-10,round(baseTwo*(1.10+.05*progress)));
  return {id:level.id, stars:[level.stars[0],two,level.stars[2]],advances:scores.filter(score=>score>=two).length, runs:scores.length};
});
fs.writeFileSync('/tmp/kff-two-star-calibration.json',JSON.stringify(report,null,2));
console.log('Calibrated 42 progression goals. Bot diagnostics, not measured player conversion.');
