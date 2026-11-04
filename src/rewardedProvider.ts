import {
  adFailureStatus,
  type AdProvider,
  type AdResult,
  type RewardedStatus,
} from "./ads.ts";

// One owned ad. Loading is allowed only while the river is idle.
export type RewardedHandle = {
  on(
    event: "loaded" | "earned" | "closed" | "error",
    callback: (error?: unknown) => void,
  ): () => void;
  load(): void;
  show(): Promise<unknown>;
  destroy(): void;
};
export function createRewardedProvider(
  create: () => RewardedHandle,
  notify: () => void,
  now = Date.now,
  report: (status: RewardedStatus) => void = () => {},
) {
  let ad: RewardedHandle | null = null,
    off: (() => void)[] = [];
  let allowed = false,
    disposed = false,
    loaded = false,
    earned = false;
  let loadedAt = 0,
    loadingAt = 0,
    retryAt = 0,
    failures = 0;
  let pending: ((result: AdResult) => void) | null = null;
  function release() {
    off.forEach((remove) => remove());
    off = [];
    ad?.destroy();
    ad = null;
    loaded = false;
  }
  function finish(result: AdResult) {
    const resolve = pending;
    pending = null;
    release();
    notify();
    resolve?.(result);
    // Poll on the next idle tick, not during the native close transition.
  }
  function fail(error?: unknown) {
    report(adFailureStatus(error));
    failures++;
    retryAt = now() + Math.min(120000, 15000 * 2 ** Math.min(failures - 1, 3));
    finish(earned ? "rewarded" : "failed");
  }
  function tick() {
    if (disposed || !allowed || pending) return;
    if (ad && !loaded && now() - loadingAt >= 30000) {
      fail();
      return;
    }
    if (loaded && now() - loadedAt > 50 * 60000) {
      release();
      notify();
    }
    if (ad || now() < retryAt) return;
    earned = false;
    report("loading");
    try {
      ad = create();
      loadingAt = now();
      off = [
        ad.on("loaded", () => {
          loaded = true;
          loadedAt = now();
          failures = 0;
          report("ready");
          notify();
        }),
        ad.on("earned", () => {
          if (pending) earned = true;
        }),
        ad.on("closed", () => {
          report("unavailable");
          finish(earned ? "rewarded" : "dismissed");
        }),
        ad.on("error", fail),
      ];
      ad.load();
    } catch {
      fail();
    }
  }
  const provider: AdProvider = {
    ready: () =>
      !disposed && loaded && !pending && now() - loadedAt <= 50 * 60000,
    showRewarded: async () => {
      if (!provider.ready() || !ad) return "failed";
      loaded = false;
      earned = false;
      report("showing");
      const result = new Promise<AdResult>((resolve) => {
        pending = resolve;
      });
      notify();
      try {
        void ad.show().catch(fail);
      } catch {
        fail();
      }
      return result;
    },
  };
  return {
    provider,
    tick,
    setIdle(value: boolean) {
      allowed = value;
      if (value) tick();
    },
    dispose() {
      disposed = true;
      report("unavailable");
      finish(earned ? "rewarded" : "failed");
    },
  };
}
