// Apple reports are monotonic and scoped to the authenticated player. Failed
// batches remain unacknowledged; persisted game records supply them next time.
export class AchievementSync {
  private acknowledged = new Map<string, Record<string, number>>();
  private chain: Promise<unknown> = Promise.resolve();
  private report: (playerID: string, values: Record<string, number>) => Promise<unknown>;
  constructor(report: (playerID: string, values: Record<string, number>) => Promise<unknown>) { this.report = report; }
  sync(playerID: string, values: Record<string, number>) {
    const work = this.chain.catch(() => {}).then(async () => {
      const known = this.acknowledged.get(playerID) ?? {};
      const pending = Object.fromEntries(Object.entries(values).filter(([id, value]) =>
        Number.isFinite(value) && value > (known[id] ?? 0) && value <= 100));
      if(!Object.keys(pending).length) return;
      await this.report(playerID, pending);
      this.acknowledged.set(playerID, {...known, ...pending});
    });
    this.chain = work;
    return work;
  }
}
