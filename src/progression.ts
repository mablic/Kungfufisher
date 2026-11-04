export const ADVANCE_STARS = 2;
export function canEnterLevel(records: Record<number, { stars: number }>, id: number) {
  // Keep already played rivers accessible when upgrading an existing save.
  return id === 1 || (records[id]?.stars ?? 0) > 0 ||
    (records[id - 1]?.stars ?? 0) >= ADVANCE_STARS;
}
