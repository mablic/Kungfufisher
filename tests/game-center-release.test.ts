import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('this release keeps local achievements without requesting Game Center signing capability',()=>{
  const config=JSON.parse(fs.readFileSync(new URL('../app.json',import.meta.url),'utf8')).expo;
  assert.equal(config.extra.gameCenterEnabled,false);
  assert.equal(config.plugins.includes('./plugins/withGameCenter.cjs'),false);
  assert.equal(config.ios.entitlements?.['com.apple.developer.game-center'],undefined);
  const hook=fs.readFileSync(new URL('../src/useGameCenter.ts',import.meta.url),'utf8');
  assert.ok(hook.includes('gameCenterEnabled === true'));
});
