// Keep artwork resolution independent of the adaptive decoration budget.
// A fixed 900px ceiling bounds fragment/shader work on high-density phones.
export function renderResolution(width: number, pixelRatio: number) {
  const nativeWidth = width * pixelRatio;
  const pixelWidth = Math.min(nativeWidth, 900);
  return { pixelWidth, rasterScale: nativeWidth / pixelWidth };
}
