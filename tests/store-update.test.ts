import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newerVersion,checkDue,appStoreUpdate,UPDATE_CHECK_INTERVAL} from '../src/storeUpdatePolicy.ts';
import {LEVELS} from '../src/levels.ts';

test('store versions compare numerically and never downgrade beta or invalid versions',()=>{
  assert.ok(newerVersion('1.10.0','1.9.9'));
  assert.ok(newerVersion('2.0','1.99.99'));
  assert.equal(newerVersion('1.2','1.2.0'),false);
  assert.equal(newerVersion('0.2.7','1.0.1'),false);
  for(const value of ['',null,'latest','1.2-beta','1..2','https://fake'])assert.equal(newerVersion(value,'1.0.0'),false);
});
test('daily checks recover from clock changes and invalid stored timestamps',()=>{
  const now=2*UPDATE_CHECK_INTERVAL;
  assert.equal(checkDue(now-100,now),false);
  assert.ok(checkDue(now-UPDATE_CHECK_INTERVAL,now));
  assert.ok(checkDue(now+100,now));assert.ok(checkDue(NaN,now));assert.ok(checkDue(0,now));
});
test('App Store identity and OS compatibility are checked before recommending an update',()=>{
  const app={trackId:6825627684,bundleId:'com.mablic.kungfufisher',version:'1.2.0',minimumOsVersion:'16.4'};
  assert.equal(appStoreUpdate({results:[app]},'1.1.0','18.0'),'1.2.0');
  assert.equal(appStoreUpdate({results:[app]},'1.2.0','18.0'),null);
  assert.equal(appStoreUpdate({results:[app]},'1.1.0','15.0'),null);
  assert.equal(appStoreUpdate({results:[{...app,bundleId:'other'}]},'1.1.0','18.0'),null);
  assert.equal(appStoreUpdate({results:[]},'1.1.0','18.0'),null);
  assert.equal(appStoreUpdate(null,'1.1.0','18.0'),null);
});
test('opening two-star goals stay gentle and post-tutorial increases retain distinct mastery goals',()=>{
  assert.deepEqual(LEVELS.slice(0,6).map(l=>l.stars[1]),[170,250,320,380,440,480]);
  assert.equal(LEVELS[6].stars[1],720);
  assert.equal(LEVELS[41].stars[1],1840);
  for(const level of LEVELS)assert.ok(level.stars[0]<level.stars[1]&&level.stars[1]<level.stars[2]);
});
