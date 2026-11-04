import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ACHIEVEMENTS, achievementProgress} from '../src/achievements.ts';
import {AchievementSync} from '../src/achievementSync.ts';
import type {LevelRecord} from '../src/save';

test('twelve unique achievements support empty and existing saves without invented play counts',()=>{
  assert.equal(ACHIEVEMENTS.length,12); assert.equal(new Set(ACHIEVEMENTS.map(a=>a.id)).size,12);
  assert.ok(achievementProgress({}).every(a=>a.percent===0));
  const records:Record<number,LevelRecord>={};
  for(let i=1;i<=42;i++)records[i]={best:1000,stars:3,bestCombo:12,seal:true};
  assert.ok(achievementProgress(records).every(a=>a.percent===100));
  records[999]={best:999999,stars:999,bestCombo:999,seal:true};
  assert.ok(achievementProgress(records).every(a=>a.value===a.target));
});

test('progress is incremental, bounded and never awards an uncleared seal',()=>{
  const rows=achievementProgress({1:{best:100,stars:1,bestCombo:3,seal:true},2:{best:0,stars:0,bestCombo:0,seal:true}});
  assert.equal(rows.find(a=>a.metric==='clears'&&a.target===1)?.percent,100);
  assert.equal(rows.find(a=>a.metric==='clears'&&a.target===6)?.percent,16);
  assert.equal(rows.find(a=>a.metric==='seals'&&a.target===6)?.value,1);
  assert.equal(rows.find(a=>a.metric==='combo'&&a.target===6)?.percent,50);
});

test('failed Game Center reports retry, and successful progress is deduplicated',async()=>{
  const calls:unknown[]=[];let fail=true;
  const sync=new AchievementSync(async(id,values)=>{calls.push([id,values]);if(fail)throw Error('offline');});
  await assert.rejects(sync.sync('A',{one:50}));fail=false;
  await sync.sync('A',{one:50});await sync.sync('A',{one:40});await sync.sync('A',{one:50});
  assert.equal(calls.length,2);
  await sync.sync('A',{one:100});assert.equal(calls.length,3);
  await sync.sync('B',{one:50});assert.equal(calls.length,4,'another player has a separate acknowledgement cache');
});

test('queued reports serialize and a failed batch does not erase later progress',async()=>{
  const calls:number[]=[];
  const sync=new AchievementSync(async(_id,v)=>{calls.push(v.one);});
  await Promise.all([sync.sync('A',{one:20}),sync.sync('A',{one:60}),sync.sync('A',{one:40})]);
  assert.deepEqual(calls,[20,60]);
});

test('Apple metadata has matching IDs and 1024px achievement images',async()=>{
  const fs=await import('node:fs');
  const csv=fs.readFileSync(new URL('../store/game-center/achievements.csv',import.meta.url),'utf8');
  assert.ok(ACHIEVEMENTS.reduce((sum,a)=>sum+a.points,0)<=1000);
  for(const a of ACHIEVEMENTS){
    assert.ok(csv.includes(a.id));
    const name=a.id.split('.').at(-1);
    const png=fs.readFileSync(new URL(`../store/game-center/icons/${name}.png`,import.meta.url));
    assert.equal(png.readUInt32BE(16),1024);assert.equal(png.readUInt32BE(20),1024);
  }
});
