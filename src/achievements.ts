import type {LevelRecord} from './save';
import {LEVELS} from './levels.ts';

type Metric = 'clears' | 'stars' | 'combo' | 'seals';
const entry = (key: string, title: string, detail: string, metric: Metric, target: number, points: number) =>
  ({id: `com.mablic.kungfufisher.achievement.${key}`, title, detail, metric, target, points});
export const ACHIEVEMENTS = [
  entry('first_river', 'First Catch of Glory', 'Clear your first river.', 'clears', 1, 10),
  entry('mistwood_master', 'Beyond Mistwood', 'Clear 6 different rivers.', 'clears', 6, 20),
  entry('river_wanderer', 'River Wanderer', 'Clear 18 different rivers.', 'clears', 18, 40),
  entry('jianghu_legend', 'Jianghu Legend', 'Clear all 42 rivers.', 'clears', 42, 100),
  entry('star_seeker', 'Star Seeker', 'Collect 30 stars.', 'stars', 30, 20),
  entry('star_master', 'Star Master', 'Collect 90 stars.', 'stars', 90, 50),
  entry('perfect_rivers', 'Perfect Rivers', 'Collect all 126 stars.', 'stars', 126, 100),
  entry('flow_beginner', 'Find Your Flow', 'Reach a 3-catch streak in one run.', 'combo', 3, 10),
  entry('flow_master', 'Unbroken Blade', 'Reach a 6-catch streak in one run.', 'combo', 6, 30),
  entry('flow_legend', 'Twelve Without Fear', 'Reach a 12-catch streak in one run.', 'combo', 12, 60),
  entry('seal_keeper', 'Seal Keeper', 'Earn 6 different river seals.', 'seals', 6, 30),
  entry('seal_legend', 'Master of Every River', 'Earn all 42 river seals.', 'seals', 42, 100),
] as const;
export function achievementProgress(records: Record<number, LevelRecord>) {
  const metrics = {clears: 0, stars: 0, combo: 0, seals: 0};
  for(const level of LEVELS) {
    const record = records[level.id]; if(!record) continue;
    const stars = Number.isFinite(record.stars) ? Math.max(0, Math.min(3, Math.floor(record.stars))) : 0;
    metrics.stars += stars; if(stars > 0) metrics.clears++;
    if(stars > 0 && record.seal) metrics.seals++;
    if(Number.isFinite(record.bestCombo)) metrics.combo = Math.max(metrics.combo, record.bestCombo);
  }
  return ACHIEVEMENTS.map(a => ({...a, value: Math.min(a.target, Math.max(0, metrics[a.metric])),
    percent: Math.min(100, Math.floor(Math.max(0, metrics[a.metric]) / a.target * 100))}));
}
