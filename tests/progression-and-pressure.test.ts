import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canEnterLevel } from '../src/progression.ts';
import { highestClear, unlockedManuals } from '../src/skillProgression.ts';
import { impactRenderPressure } from '../src/renderPressure.ts';
import { createGame, launchSpear } from '../src/game.ts';
import { FOG_LIGHTS, FOG_SHADER } from '../src/fogShader.ts';

test('one star saves progress, two unlock next river; old played levels remain accessible',()=>{
  assert.ok(canEnterLevel({},1));
  assert.equal(canEnterLevel({1:{stars:1}},2),false);
  assert.ok(canEnterLevel({1:{stars:2}},2));
  assert.ok(canEnterLevel({1:{stars:3}},2));
  assert.ok(canEnterLevel({1:{stars:1},2:{stars:1}},2));
  assert.equal(canEnterLevel({1:{stars:1},2:{stars:1}},3),false);
  assert.equal(unlockedManuals(highestClear({6:{stars:1}})).length,0);
  assert.equal(unlockedManuals(highestClear({6:{stars:2}})).length,2);
});

test('school and area impact pressure simplifies decoration only while active',()=>{
  const g=createGame(); assert.equal(impactRenderPressure(g),false);
  g.bursts=[{id:1,x:10,y:10,life:.5,points:100,color:'#fff',multiplier:1,rare:false,chip:false,catches:3}];
  const before=JSON.stringify(g);
  assert.ok(impactRenderPressure(g)); assert.equal(JSON.stringify(g),before);
  g.bursts=[]; g.skill='storm';g.skillUses=3;g.spear=launchSpear(g,0,1);
  assert.equal(impactRenderPressure(g),false);
  g.spear.pulse=.1; assert.ok(impactRenderPressure(g));
  g.spear=null; assert.equal(impactRenderPressure(g),false);
  assert.equal(FOG_LIGHTS,12); assert.ok(FOG_SHADER.includes('lights[12]'));
});
