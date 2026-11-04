import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {impactPriority,nextImpactGate} from '../src/impactFeedback.ts';
import {FishingGame} from '../src/game.ts';
import {FISH} from '../src/species.ts';

test('a school suppresses repeated cues while a heavy or warning cue can upgrade a light hit',()=>{
  let gate={at:-Infinity,priority:0};let count=0;
  for(let t=0;t<90;t+=5){const next=nextImpactGate(gate,t,impactPriority('hit0'));if(next){gate=next;count++;}}
  assert.equal(count,1);
  const heavy=nextImpactGate(gate,85,impactPriority('heavy'))!;assert.ok(heavy);
  assert.equal(nextImpactGate(heavy,86,impactPriority('hit4')),null);
  assert.ok(nextImpactGate(heavy,87,impactPriority('protected')));
  assert.ok(nextImpactGate(heavy,180,impactPriority('hit0')));
});

test('ordinary catches cannot overwrite a simultaneous armored-fish finishing impact',()=>{
  const g=new FishingGame(()=>0.5);g.start();g.skill='storm';g.skillUses=3;
  const base=g.fish[0];g.fish=[FISH.iron,FISH.jade].map((kind,i)=>({...base,id:900+i,kind,hp:1,
    x:190,y:g.surface+160,baseY:g.surface+160,old:{x:190,y:g.surface+160}}));
  g.target({x:190,y:g.surface+160});g.charge=1;g.release();g.spear!.pulse=0.5;
  for(let i=0;i<120&&g.catches===0;i++)g.update(1/120);
  assert.equal(g.catches,2);assert.ok(g.shake>0.8);
  assert.ok(g.bursts.length<=3);assert.equal(g.bursts[0].rare,true);
});

test('an armored strike reports actual damage without granting catch points',()=>{
  const g=new FishingGame(()=>0.5);g.start();const f=g.fish[0];
  f.kind=FISH.iron;f.hp=3;f.x=g.origin.x;f.y=f.baseY=g.surface+100;f.old={x:f.x,y:f.y};g.fish=[f];g.timeStop=3;
  g.skill='heavy';g.skillUses=3;g.target(f);g.charge=1;g.release();g.update(0.3);
  assert.equal(f.hp,1);assert.equal(g.score,0);assert.equal(g.bursts.at(-1)?.damage,2);
});

test('all eight impact clips are short mono PCM with safe peaks and a fast attack',()=>{
  for(const name of ['hit-0','hit-1','hit-2','hit-3','hit-4','chip','heavy','rare']){
    const wav=fs.readFileSync(new URL(`../assets/audio/${name}.wav`,import.meta.url));
    assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(wav.readUInt16LE(22),1);
    const rate=wav.readUInt32LE(24),samples=wav.readUInt32LE(40)/2;
    assert.ok(samples/rate<=0.66);let peak=0,early=0;
    for(let i=0;i<samples;i++){const v=Math.abs(wav.readInt16LE(44+i*2));peak=Math.max(peak,v);if(i<rate*0.02)early=Math.max(early,v);}
    assert.ok(peak>1000&&peak<30000);assert.ok(early>peak*0.5,`${name} attack too slow`);
  }
});
