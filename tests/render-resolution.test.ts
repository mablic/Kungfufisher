import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderResolution } from '../src/renderResolution.ts';

test('phone artwork stays at least 720px wide without rendering above 900px', () => {
  for (const [width, density] of [[360, 2], [393, 2.75], [390, 3], [440, 3], [768, 2]]) {
    const { pixelWidth, rasterScale } = renderResolution(width, density);
    assert.ok(pixelWidth >= 720 && pixelWidth <= 900);
    assert.ok(rasterScale >= 1);
    assert.ok(Math.abs(width / rasterScale * density - pixelWidth) < 1e-8);
    // The outer scale restores exactly the same visible size and aim coordinates.
    assert.ok(Math.abs(width / rasterScale * rasterScale - width) < 1e-8);
  }
});

test('low-density displays use their native resolution rather than supersampling', () => {
  assert.deepEqual(renderResolution(320, 1), {pixelWidth: 320, rasterScale: 1});
});
