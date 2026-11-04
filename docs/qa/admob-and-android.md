# AdMob and Android performance — 2026-10-22

## Report and scope

The reported Android device is a Google Pixel 8 running the game inside Expo Go. Development-mode timings cannot establish installed Release performance. No physical Android device is currently attached over ADB. No cloud build or store rollout was requested by this change.

## Implementation

- Native Google Mobile Ads 17.4.0, separate iOS/Android App IDs and rewarded units supplied by the publisher. App IDs are Expo plugin configuration; unit IDs are selected by platform in `src/useAdMob.ts`.
- UMP refresh and consent form before SDK initialization; request only when `canRequestAds` is true. A required consent form pauses a running game; it does not auto-resume it. No forced ATT permission or reward conditional on consent. The iOS non-tracking configuration removes ATT usage text; disable any AdMob IDFA message for this iOS app.
- Non-personalized requests. These can still process identifiers and other data; they do not justify “no data collected.” Measurement initialization delayed in native config. Ad initialization/loading optimizations enabled on Android. SKAdNetwork identifiers copied from Google's iOS quick-start on 2026-10-22.
- Late ad availability enables the persistent optional-continue button in the existing results sheet; it does not replace results with an ad modal.
- One owned rewarded ad; no banner/interstitial/App Open ad, no automatic display. Load/retry begins only at idle, not during active fishing; an already-started network load can complete later. One five-second idle poll, exponential backoff 15–120 seconds, 30-second load timeout and 50-minute cache expiry. After close, listeners and the native handle are released.
- +15 seconds only after an earned-reward event and ad close, once per run. Early dismissal, missing inventory and load/show failures award no time. An SDK error after an earned reward preserves that earned reward. Duplicate taps cannot replay inventory. Background changes never automatically resume the river. Game music and effects pause while watching.
- Required privacy-options link on the home screen; opening it discards cached inventory before applying changed choices. Gameplay and retries remain available without an ad.
- Expo Go skips SDK import. Native development builds and `preview` use Google test units; `production` uses live units. `EXPO_PUBLIC_ADMOB_TEST_ADS=true` also forces test units for local Release tests.

## Rendering changes

Android's effect ceiling is minimal from the first frame, including after stable-frame windows. Scene raster dimensions are divided by 1.75 (about 33% of full-resolution pixels). The HUD remains native resolution. Tail mesh deformation, armor-hit blur and rare-fish sparkles are removed at minimal; movement, turn animation, gold highlighting, armor pips, aiming, fog visibility holes and collision logic remain. Weather uses the existing reduced-rain path.

At 90/120 Hz the simulation publishes at most 60 state snapshots per second. A fractional accumulator preserves elapsed time at 30/60/90/120 Hz; late-frame catch-up remains capped at 100 ms. This reduces derived-value work on high-refresh devices. It is a work cap, not a measured 60 FPS guarantee. A 60 Hz device may see benefits chiefly from reduced GPU work.

## Publisher setup before release

1. In AdMob, configure and publish Privacy & messaging for applicable regions and disable the iOS IDFA message. The code does not create these dashboard messages.
2. Publish a privacy policy reflecting AdMob, update the store Data safety / App Privacy answers, and verify app-ads.txt against the developer website associated with the listings. A draft is in `store/metadata/privacy-policy-draft.md`; publisher identity and retention fields still require actual business details.
3. Google Play Advertising ID declaration: Yes for this new AdMob build; advertising is included in this version. AD_ID is explicit in Expo config and present in the generated Android manifest. Select actual purposes based on SDK disclosures, including advertising and any applicable analytics/fraud-prevention purposes.
4. `npm run build:android:test` creates a Release APK through EAS preview with test ads. It incurs normal EAS build usage; it has not been run here. Install on Pixel 8, test in airplane mode and with test ads. Production: `npm run build:android`; iOS: `npm run build:ios`. Expo Go and OTA reloads cannot add native SDKs.
5. Verify reward/close ordering, early dismiss, duplicate taps, home/background/resume and changed privacy choices in installed builds. Repeat level 13 Lotus Wheel and late storm/shark stages, cold and after 15 minutes. Capture Android frame-time p95/p99 and jank in Release; no physical-device FPS claim is made by simulation tests.

## Source references

- https://docs.page/invertase/react-native-google-mobile-ads/installation/expo
- https://docs.page/invertase/react-native-google-mobile-ads/european-user-consent
- https://developers.google.com/admob/ios/quick-start
- https://developers.google.com/admob/android/privacy/play-data-disclosure

## Verification completed

- 66/66 regression tests passed, including reward lifecycle failures and 30/60/90/120 Hz clock preservation.
- TypeScript and both platform Hermes production exports passed. Expo Doctor: 20/20 checks.
- Android Release manifest merger passed; merged App ID and AD_ID verified. AdMob native Release Kotlin compilation passed on the project's RN 0.88 / Expo 58 configuration. This is not a full signed APK build.
- iOS prebuild generated the correct App ID, delayed measurement, 50 SKAdNetwork entries (ATT text removed in the non-tracking update). iOS native SDK compilation and live ad serving remain unverified.
- Physical Pixel 8 / iPhone device frame-time measurements remain unverified. Test in an installed Release build before making smoothness claims.
