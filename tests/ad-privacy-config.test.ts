import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import { shouldStartNativeAds } from "../src/ads.ts";
const require = createRequire(import.meta.url);
const {
  configureAppDelegate,
  stripTrackingDescription,
} = require("../plugins/withNonTrackingAds.cjs");

test("ads stay unloaded unless this binary contains the native module", () => {
  assert.equal(shouldStartNativeAds("android", "storeClient", "expo", false), false);
  assert.equal(shouldStartNativeAds("android", "bare", null, false), false);
  assert.equal(shouldStartNativeAds("android", "bare", "expo", true), false);
  assert.equal(shouldStartNativeAds("web", "bare", null, true), false);
  assert.equal(shouldStartNativeAds("android", "bare", null, true), true);
  assert.equal(shouldStartNativeAds("ios", "standalone", "standalone", true), true);
});

test("production uses real ads and test distributions explicitly retain test ads", () => {
  const eas = JSON.parse(fs.readFileSync(new URL("../eas.json", import.meta.url), "utf8"));
  assert.equal(eas.build.production.env.EXPO_PUBLIC_ADMOB_TEST_ADS, "false");
  assert.equal(eas.build["testflight-test-ads"].env.EXPO_PUBLIC_ADMOB_TEST_ADS, "true");
  assert.equal(eas.build.preview.env.EXPO_PUBLIC_ADMOB_TEST_ADS, "true");
  const app = JSON.parse(fs.readFileSync(new URL("../app.json", import.meta.url), "utf8")).expo;
  const ads = app.plugins.find((p: any) => Array.isArray(p) && p[0] === "react-native-google-mobile-ads")[1];
  assert.equal(ads.iosAppId, "ca-app-pub-4796172198731860~4824989178");
  assert.equal(ads.androidAppId, "ca-app-pub-4796172198731860~3383914993");
});

test("release shrinking retains reflective Room and InputMerger constructors", () => {
  const app = JSON.parse(fs.readFileSync(new URL("../app.json", import.meta.url), "utf8")).expo;
  const android = app.plugins.find((p: any) => Array.isArray(p) && p[0] === "expo-build-properties")[1].android;
  // Class-only keep rules lose constructors under AGP 9 strict full mode.
  for (const base of ["androidx.room.RoomDatabase", "androidx.work.InputMerger"])
    assert.ok(android.extraProguardRules.includes(`-keep class * extends ${base} { public <init>(); }`));
});

test("native ad privacy settings precede React startup and remain idempotent on prebuild", () => {
  const source = `import Expo\nclass AppDelegate {\n public override func application(_ app: UIApplication, didFinishLaunchingWithOptions options: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {\n let delegate = ReactNativeDelegate()\n return super.application(app, didFinishLaunchingWithOptions: options)\n }\n}`;
  const once = configureAppDelegate(source),
    twice = configureAppDelegate(once);
  assert.equal(twice.match(/import GoogleMobileAds/g)?.length, 1);
  assert.equal(
    twice.match(/setPublisherFirstPartyIDEnabled\(false\)/g)?.length,
    1,
  );
  assert.ok(twice.includes("publisherPrivacyPersonalizationState = .disabled"));
  assert.ok(
    twice.indexOf("setPublisherFirstPartyIDEnabled") <
      twice.indexOf("ReactNativeDelegate()"),
  );
  assert.throws(
    () => configureAppDelegate("class Unsupported {}"),
    /launch method not found/,
  );
});
test("prebuild strips stale ATT text without deleting unrelated privacy configuration", () => {
  const plist = {
    NSUserTrackingUsageDescription: "old",
    GADApplicationIdentifier: "app",
    GADDelayAppMeasurementInit: true,
    SKAdNetworkItems: [{ SKAdNetworkIdentifier: "network" }],
  };
  const result = stripTrackingDescription(plist);
  assert.equal(Object.hasOwn(result, "NSUserTrackingUsageDescription"), false);
  assert.equal(result.GADApplicationIdentifier, "app");
  assert.equal(result.GADDelayAppMeasurementInit, true);
  assert.equal(result.SKAdNetworkItems.length, 1);
});
test("EAS receives the privacy plugin after the ads plugin and no tracking prompt text", () => {
  const config = JSON.parse(
    fs.readFileSync(new URL("../app.json", import.meta.url), "utf8"),
  ).expo;
  const adsIndex = config.plugins.findIndex(
    (p: any) => Array.isArray(p) && p[0] === "react-native-google-mobile-ads",
  );
  assert.ok(
    config.plugins.indexOf("./plugins/withNonTrackingAds.cjs") > adsIndex,
  );
  assert.equal(
    config.plugins[adsIndex][1].userTrackingUsageDescription,
    undefined,
  );
  assert.equal(config.ios.infoPlist.NSUserTrackingUsageDescription, undefined);
});
