import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FishingGame, comboTimeReward, launchSpear} from '../src/game.ts';
import {aimPreview} from '../src/aimPreview.ts';
import {LEVELS} from '../src/levels.ts';

test('charged and skill aim previews stop at the finger rather than the deep riverbed', () => {
  for(const skill of [null, 'storm', 'spin', 'twin', 'freeze'] as const) {
    const g = new FishingGame(() => 0.5); g.start();
    g.skill = skill; g.skillUses = 3; g.charge = 1;
    g.target({x:g.origin.x + 50, y:g.surface + 140});
    const before = JSON.stringify(g);
    const points = aimPreview(g), last = points.at(-1)!;
    assert.ok(last.y <= g.aimTarget!.y + 1e-6);
    assert.ok(last.d <= Math.hypot(g.aimTarget!.x-g.origin.x,g.aimTarget!.y-g.origin.y)+1e-6);
    assert.equal(JSON.stringify(g), before, 'preview does not mutate gameplay');
    assert.ok(points.length <= 160);
  }
});

test('wind and short charge retain real trajectory and reachable range', () => {
  const g = new FishingGame(() => 0.5, LEVELS[9]); g.start();
  g.target({x:250,y:g.height-160}); g.charge=0;
  const spear = launchSpear(g,g.aim!.x,g.aim!.y), points=aimPreview(g);
  assert.ok(points.at(-1)!.d <= spear.rangeLeft+36+1e-6);
  assert.ok(points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
  g.pause(); assert.equal(aimPreview(g).length,1);
});

test('combo time awards only first 3/6 milestones and cannot be farmed', () => {
  let best=0, total=0;
  for(const combo of [1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6]) {
    total += comboTimeReward(best,combo); best=Math.max(best,combo);
  }
  assert.equal(total,4);
});

test('a real third consecutive catch grants two seconds and labels the reward', () => {
  const g=new FishingGame(()=>0.5);g.start();g.combo=g.bestCombo=2;
  const f=g.fish[0];f.x=g.origin.x;f.y=f.baseY=g.surface+100;f.old={x:f.x,y:f.y};
  g.fish=[f];g.timeStop=3;g.target(f);g.charge=1;g.release();
  const before=g.remaining;g.update(0.5);
  assert.equal(g.catches,1);assert.equal(g.bestCombo,3);
  assert.ok(Math.abs(g.remaining-(before-0.5+2))<1e-8);
  assert.equal(g.bursts.at(-1)?.timeBonus,2);
  g.start();assert.equal(g.bestCombo,0);
});
