import fs from 'node:fs';
import { LEVELS } from '../src/levels.ts';
import { CASUAL, SKILLED, playLevel } from './bot.ts';
const seeds = Array.from({length:24}, (_,i) => 1101+i*101);
const output = LEVELS.map(level => {
  if(level.id <= 6) return {id:level.id, stars:level.stars};
  const casual=seeds.map(seed=>playLevel(level,seed,CASUAL).score).sort((a,b)=>a-b);
  const skilled=seeds.map(seed=>playLevel(level,seed,SKILLED).score).sort((a,b)=>a-b);
  const progress=(level.id-7)/35;
  const percentile=.28+progress*.22+(level.challenge ? .10 : 0);
  const round=(n:number)=>Math.max(10,Math.round(n/10)*10);
  const one=round(casual[Math.floor(percentile*23)]);
  const three=Math.max(one+200,round(skilled[Math.floor(.70*23)]));
  // Smooth two difficulty spikes found with the independent validation seeds.
  const adjustments: Record<number, number[]> = {20:[440,920,1400],24:[1050,1860,2670]};
  const stars=adjustments[level.id] ?? [one,round((one+three)/2),three];
  return {id:level.id,stars,casualClears:casual.filter(score=>score>=stars[0]).length,skilledThree:skilled.filter(score=>score>=stars[2]).length};
});
const report = process.argv[2] ?? '/tmp/kff-progression-calibration.json';
fs.writeFileSync(report,JSON.stringify(output,null,2));
console.log('Calibrated',output.length,'levels; bot estimates only.');
