import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FishingGame, fishImpactTime } from '../src/game.ts';
import { SPECIES } from '../src/species.ts';
import { FISH_ART_BOUNDS } from '../src/fishArtBounds.ts';

test('head, middle and tail register for every species facing either way and diving', () => {
  const g = new FishingGame(() => 0.5); g.start(); g.update(1 / 60);
  for (let kind = 0; kind < SPECIES.length; kind++) {
    const s = SPECIES[kind], b = FISH_ART_BOUNDS[s.atlas][s.cell];
    for (const direction of [-1, 1]) for (const angle of [-0.3, 0, 0.3]) {
      const f = {...g.fish[0], kind, x: 200, y: 450, direction, visualDirection: direction,
        old: {x: 200, y: 450}, motion: {...g.fish[0].motion!, heading: angle}};
      for (const t of [0.03, 0.5, 0.97]) {
        const x = ((b[0] + (b[2] - b[0]) * t - 0.5) * 82 - s.offset) * s.scale * direction;
        const y = ((b[1] + b[3]) / 2 - 0.5) * 82 * s.scale;
        const p = {x: 200 + x * Math.cos(angle) - y * Math.sin(angle),
          y: 450 + x * Math.sin(angle) + y * Math.cos(angle)};
        assert.notEqual(fishImpactTime(p, p, f), null, `${s.name}, ${direction}, ${angle}, ${t}`);
      }
      assert.equal(fishImpactTime({x: -200, y: -200}, {x: -100, y: -100}, f), null);
    }
  }
});

test('a real spear aimed at the rear of a jade carp catches it', () => {
  const g = new FishingGame(() => 0.5); g.start();
  const f = g.fish[0]; f.x = 200; f.y = f.baseY = g.surface + 150;
  f.direction = f.visualDirection = 1; f.old = {x: f.x, y: f.y};
  g.fish = [f]; g.timeStop = 3;
  g.target({x: f.x - 35, y: f.y}); g.charge = 1; g.release();
  for(let i = 0; i < 90; i++) g.update(1 / 60);
  assert.equal(g.catches, 1);
});
