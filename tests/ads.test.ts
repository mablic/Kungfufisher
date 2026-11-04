import { test } from "node:test";
import assert from "node:assert/strict";
import {
  setAdProvider,
  showRewarded,
  rewardedReady,
  subscribeRewarded,
} from "../src/ads.ts";

test("rewarded provider only returns earned rewards; missing, failed and skipped ads grant none", async () => {
  setAdProvider(null);
  assert.equal(await showRewarded("overtime"), "failed");
  for (const result of ["dismissed", "failed", "rewarded"] as const) {
    setAdProvider({ ready: () => true, showRewarded: async () => result });
    assert.equal(await showRewarded("overtime"), result);
  }
  setAdProvider({
    ready: () => true,
    showRewarded: async () => {
      throw Error("network");
    },
  });
  assert.equal(await showRewarded("overtime"), "failed");
  setAdProvider(null);
});
test("two rapid ad requests cannot award the same view twice; availability updates", async () => {
  let finish: ((value: "rewarded") => void) | undefined,
    notices = 0,
    views = 0;
  const unsubscribe = subscribeRewarded(() => notices++);
  setAdProvider({
    ready: () => true,
    showRewarded: () => {
      views++;
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
  });
  assert.equal(rewardedReady(), true);
  const first = showRewarded("overtime");
  assert.equal(rewardedReady(), false);
  assert.equal(await showRewarded("overtime"), "failed");
  assert.equal(views, 1);
  finish!("rewarded");
  assert.equal(await first, "rewarded");
  assert.equal(rewardedReady(), true);
  assert.ok(notices >= 3);
  unsubscribe();
  setAdProvider(null);
});

test("ad availability publishes late loading and distinguishes no-fill from network failures", async () => {
  const { getRewardedStatus, setRewardedStatus, adFailureStatus } =
    await import("../src/ads.ts");
  setRewardedStatus("loading");
  assert.equal(getRewardedStatus(), "loading");
  setRewardedStatus("ready");
  assert.equal(getRewardedStatus(), "ready");
  assert.equal(adFailureStatus({ code: "googleMobileAds/no-fill" }), "no_fill");
  assert.equal(
    adFailureStatus({ code: "googleMobileAds/network-error" }),
    "network",
  );
  assert.equal(adFailureStatus(null), "failed");
  setRewardedStatus("unavailable");
});

test("support diagnostics retain the SDK code without exposing error messages", async () => {
  const { reportAdDiagnostic, getRewardedDiagnostic } = await import(
    "../src/ads.ts"
  );
  reportAdDiagnostic("consent", {
    code: "invalid-app-id",
    message: "private debug content",
  });
  assert.equal(getRewardedDiagnostic(), "consent: invalid-app-id");
  assert.equal(getRewardedDiagnostic().includes("private"), false);
  reportAdDiagnostic("Ready");
  assert.equal(getRewardedDiagnostic(), "Ready");
});
