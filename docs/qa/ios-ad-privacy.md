# iOS ad privacy configuration — 2026-10-23

## Changes

- Remove the AdMob Expo plugin's `userTrackingUsageDescription` option.
- A final custom Expo config plugin removes any stale `NSUserTrackingUsageDescription` from the generated Info.plist. This survives EAS prebuild rather than depending on editing the ignored `ios/` directory.
- Before React, UMP or JS can initialize/load ads, native AppDelegate calls Google's `setPublisherFirstPartyIDEnabled(false)` and sets `publisherPrivacyPersonalizationState = .disabled`.
- Retain per-request `requestNonPersonalizedAdsOnly: true`, delayed measurement initialization, real UMP consent checks, privacy choices and optional rewarded +15 seconds. No forced child/under-age classification, fabricated consent strings, user-ID targeting or mediation adapters are added.
- Retain SKAdNetwork declarations; privacy-preserving aggregate attribution is different from requesting ATT permission.

The installed RN ads library 17.4.0 exposes `setPublisherFirstPartyIdEnabled` in JS but implements it as a resolving stub. Calling that method would not apply the native setting. This implementation uses the documented native iOS APIs instead and does not modify node_modules.

## Required account and release steps

1. AdMob > Privacy & messaging: disable/unpublish the IDFA explainer message for the iOS Kung Fu Fisher app. Retain/configure applicable regional privacy consent messages. No AdMob account setting was changed here. Do not configure other advertising partners to perform tracking.
2. Rebuild with `npm run build:ios`, upload, wait for processing, and select the new build in App Store Connect. Version 0.2.1 can be retained while the production build number increases remotely. Existing uploaded binaries still contain their old Info.plist.
3. Inspect the actual signed IPA Info.plist: NSUserTrackingUsageDescription must be absent. Install the exact build on a supported physical iPhone. Test first launch, regional consent, ad privacy options, early close and earned +15 seconds. Confirm no ATT prompt or native crash. Fresh install and upgrade from an earlier build should both be tested.
4. App Privacy must still include actual SDK collection and purposes. Non-personalized ads can use identifiers for frequency capping, aggregate reporting and fraud prevention. These code changes do not certify that every downstream data use is outside Apple's tracking definition. Verify account settings, SDK privacy reports and final binary behavior before declaring no tracking. Never select “no data collected” simply because ATT text was removed.
5. Publish the updated privacy policy. The separate website source has been prepared locally; it has not been deployed.
6. The prior 2.1 completeness request is separate: provide physical-device recording and all six review-note items.

Android configuration is not changed by this iOS plugin; its existing Advertising ID declaration remains applicable.

## References

- https://developers.google.com/admob/ios/privacy/strategies
- https://developers.google.com/admob/ios/targeting
- https://support.google.com/admob/answer/7676680
- https://developer.apple.com/app-store/app-privacy-details/

## Completed checks

69 regression tests passed, including three config-plugin tests covering startup ordering, repeated prebuild and stale ATT text removal. TypeScript and Expo Doctor (20/20) passed; iOS Hermes production export passed. Repeated iOS prebuild verified the native opt-out calls and confirmed that generated Info.plist has no NSUserTrackingUsageDescription. Native iOS compilation, signed IPA inspection and physical-device/network verification remain outstanding; no EAS build, upload, store declaration edit or AdMob dashboard change was performed.
