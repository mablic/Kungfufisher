import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FishingGame, aimBlocked} from '../src/game.ts';
import {FISH,SPECIES} from '../src/species.ts';
import {aimPreview} from '../src/aimPreview.ts';

test('chosen row clears both sides and armor instantly without descending through other fish',()=>{
  const g=new FishingGame(()=>0.5);g.start();const y=g.surface+220,base=g.fish[0];
  const kinds=[FISH.jade,FISH.iron,FISH.shark,FISH.turtle,FISH.squid,FISH.seahorse,FISH.jade,FISH.jade];
  g.fish=kinds.map((kind,i)=>({...base,id:900+i,kind,hp:SPECIES[kind].hp,
    x:40+i*40,y:i===6?y-100:i===7?y+100:y,baseY:i===6?y-100:i===7?y+100:y,
    old:{x:40+i*40,y:i===6?y-100:i===7?y+100:y}}));
  g.skill='kungfu';g.skillUses=3;g.timeStop=3;g.target({x:190,y});g.charge=0;
  const points=aimPreview(g);assert.ok(points.every(p=>p.y===y));
  assert.equal(points[0].x,0);assert.equal(points.at(-1)!.x,g.width);
  assert.equal(aimBlocked(g),false);g.release();
  assert.equal(g.spear?.y,y);assert.equal(g.spear?.vy,0);
  g.update(1/120);assert.equal(g.catches,3);assert.equal(g.skillUses,2);assert.equal(g.combo,1);
  for(const id of [903,904,905,906,907])assert.ok(g.fish.some(f=>f.id===id),`fish ${id} must survive`);
  assert.equal(g.turtleHits,0);assert.ok(g.bursts.length<=3);
  g.update(0.3);assert.equal(g.spear,null);assert.equal(g.catches,3);
});

test('row strike respects pause and records an empty row only once',()=>{
  const g=new FishingGame(()=>0.5);g.start();g.fish=[];g.skill='kungfu';g.skillUses=3;
  g.target({x:80,y:g.surface+150});g.release();g.pause();g.update(5);
  assert.equal(g.misses,0);g.resume();g.update(0.05);assert.equal(g.misses,1);
  g.update(0.3);assert.equal(g.misses,1);assert.equal(g.spear,null);
});
