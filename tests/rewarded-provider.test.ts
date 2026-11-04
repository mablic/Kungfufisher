import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createRewardedProvider,
  type RewardedHandle,
} from "../src/rewardedProvider.ts";
import { consumeSimulationFrame } from "../src/runtimeSafety.ts";

function fixture() {
  let time = 0,
    loads = 0,
    destroyed = 0;
  const listeners = new Map<string, () => void>();
  const handle: RewardedHandle = {
    on(event, fn) {
      listeners.set(event, fn);
      return () => {
        listeners.delete(event);
      };
    },
    load() {
      loads++;
    },
    show: async () => {},
    destroy() {
      destroyed++;
    },
  };
  const c = createRewardedProvider(
    () => handle,
    () => {},
    () => time,
  );
  return {
    c,
    emit: (event: string) => listeners.get(event)?.(),
    advance: (ms: number) => {
      time += ms;
    },
    loads: () => loads,
    destroyed: () => destroyed,
  };
}
test("ads preload only at idle and grant a reward after earned + closed", async () => {
  const f = fixture();
  f.c.tick();
  assert.equal(f.loads(), 0);
  f.c.setIdle(true);
  assert.equal(f.loads(), 1);
  f.emit("loaded");
  f.c.setIdle(false);
  assert.equal(f.c.provider.ready(), true);
  const result = f.c.provider.showRewarded("overtime");
  assert.equal(await f.c.provider.showRewarded("overtime"), "failed");
  f.emit("earned");
  assert.equal(f.c.provider.ready(), false);
  f.emit("closed");
  assert.equal(await result, "rewarded");
  assert.equal(f.destroyed(), 1);
  f.c.tick();
  assert.equal(f.loads(), 1);
  f.c.setIdle(true);
  assert.equal(f.loads(), 2);
  f.c.dispose();
});
test("closing early or a failed view grants no time; failed loads back off", async () => {
  const f = fixture();
  f.c.setIdle(true);
  f.emit("loaded");
  const result = f.c.provider.showRewarded("overtime");
  f.emit("closed");
  assert.equal(await result, "dismissed");
  f.c.tick();
  f.emit("error");
  f.c.tick();
  assert.equal(f.loads(), 2);
  f.advance(15000);
  f.c.tick();
  assert.equal(f.loads(), 3);
  f.emit("loaded");
  const failed = f.c.provider.showRewarded("overtime");
  f.emit("error");
  assert.equal(await failed, "failed");
  f.c.dispose();
});
test("expiry and disposal cannot replay a loaded ad", async () => {
  const f = fixture();
  f.c.setIdle(true);
  f.emit("loaded");
  f.advance(51 * 60000);
  assert.equal(f.c.provider.ready(), false);
  f.c.tick();
  assert.equal(f.loads(), 2);
  f.emit("loaded");
  const result = f.c.provider.showRewarded("overtime");
  f.c.dispose();
  assert.equal(await result, "failed");
  assert.equal(f.c.provider.ready(), false);
  f.c.setIdle(true);
  assert.equal(f.loads(), 2);
});
test("rejected native show resolves failure and cleans listeners", async () => {
  const listeners = new Map<string, () => void>();
  let disposed = false;
  const c = createRewardedProvider(
    () => ({
      on(event, fn) {
        listeners.set(event, fn);
        return () => {
          listeners.delete(event);
        };
      },
      load() {},
      show: async () => {
        throw Error("not active");
      },
      destroy() {
        disposed = true;
      },
    }),
    () => {},
  );
  c.setIdle(true);
  listeners.get("loaded")!();
  assert.equal(await c.provider.showRewarded("overtime"), "failed");
  assert.equal(disposed, true);
  assert.equal(listeners.size, 0);
  c.dispose();
});
test("simulation limits high-refresh work to 60 updates without slowing the clock", () => {
  for (const hz of [30, 60, 90, 120]) {
    let carry = 0,
      seconds = 0,
      updates = 0;
    for (let i = 0; i < hz * 10; i++) {
      const step = consumeSimulationFrame(carry, 1000 / hz);
      carry = step.carryMs;
      seconds += step.seconds;
      if (step.seconds > 0) updates++;
    }
    assert.ok(Math.abs(seconds - 10) < 0.002, `${hz} Hz clock`);
    assert.ok(updates <= 600, `${hz} Hz updates`);
  }
  assert.ok(consumeSimulationFrame(0, 10000).seconds <= 0.101);
});

test("a load with no native completion eventually retries with backoff", () => {
  const f = fixture();
  f.c.setIdle(true);
  f.advance(30000);
  f.c.tick();
  assert.equal(f.destroyed(), 1);
  f.c.tick();
  assert.equal(f.loads(), 1);
  f.advance(15000);
  f.c.tick();
  assert.equal(f.loads(), 2);
  f.c.dispose();
});

test("a native error after earning the reward does not discard the earned time", async () => {
  const f = fixture();
  f.c.setIdle(true);
  f.emit("loaded");
  const result = f.c.provider.showRewarded("overtime");
  f.emit("earned");
  f.emit("error");
  assert.equal(await result, "rewarded");
  f.emit("closed");
  assert.equal(f.c.provider.ready(), false);
  f.c.dispose();
});

test("a slow native load can become ready after the run ends", async () => {
  let callback: (() => void) | undefined;
  const statuses: string[] = [];
  const c = createRewardedProvider(
    () => ({
      on(event, fn) {
        if (event === "loaded") callback = fn;
        return () => {};
      },
      load() {},
      show: async () => {},
      destroy() {},
    }),
    () => {},
    Date.now,
    (status) => statuses.push(status),
  );
  c.setIdle(true);
  assert.equal(c.provider.ready(), false);
  assert.equal(statuses.at(-1), "loading");
  c.setIdle(false);
  c.setIdle(true);
  callback!();
  assert.equal(c.provider.ready(), true);
  assert.equal(statuses.at(-1), "ready");
  c.dispose();
});
