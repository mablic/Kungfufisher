# New creatures, Time Seal, and production advertising

## Gameplay

- Stable fish IDs 18 and 19 append reef squid and golden seahorse (vertical
  drift). Both are protected hazards: seahorses cost 20 points, squid cost 30
  points, and turtles retain their 50-point penalty (scores never go below zero).
  breaks the combo, and never counts as a catch. Red minus badges and the first
  seahorse stage's tutorial explain the penalty. First appearances
  are levels 12 and 6; both return in later chapter trials. Existing IDs and
  saved progression remain compatible. Fish count stays at eight or fewer.
- Original vector artwork is retained in
  `assets/art/source/reef-creatures-atlas.svg`. The bundled transparent PNG is
  rasterized ahead of time with rsvg-convert; no runtime SVG generation occurs.
- Time Seal is a three-cast manual. Each successful release sets three seconds
  of fish stasis, without stacking. Spears can still catch frozen fish. The
  level clock, waves, and boat continue; pausing stops both timers. Restart
  clears the effect. Its cyan color, clock/pause emblem and HUD countdown explain
  the effect. It is included in the Skills guide automatically.
- Visitor species changes now remount only that slot's renderer. Previously
  slot art and dimensions came from the static roster, so an early visiting
  shark could retain a small fish's appearance. The ocean atlas is now available
  on early visitor stages. A numeric species key avoids sending positions to
  React every frame.

## Verified source configuration

- iOS app ID: ca-app-pub-4796172198731860~4824989178
- iOS rewarded unit: ca-app-pub-4796172198731860/9929142044
- Android app ID: ca-app-pub-4796172198731860~3383914993
- Android rewarded unit: ca-app-pub-4796172198731860/8262379140
- EAS production explicitly sets EXPO_PUBLIC_ADMOB_TEST_ADS=false. Preview and
  testflight-test-ads explicitly set true. Development uses test units; Expo Go
  cannot run the native ads SDK. Production uses the supplied platform unit.
- The optional overtime offer grants +15s only on earned reward, once per run.
  No automatic interstitial, banner or app-open ad has been added. Unavailable
  inventory never blocks free retry. Consent gating and non-personalized ad
  configuration remain enabled.

## Outstanding account/website validation

A live request on this task found https://tradepartner.fyi/app-ads.txt serving
HTML (HTTP 200), not an app-ads.txt seller record. The candidate publisher record
is in `store/metadata/app-ads.txt` and copied to the existing website project's
`public/app-ads.txt`. This is a local change, not a deployed website. Compare it
with the personalized snippet from AdMob, deploy that file to the domain root,
and confirm AdMob verification. The three-field DIRECT seller record uses the
publisher ID present in the supplied app/ad-unit IDs.

In AdMob, link the separate iOS and Android apps to their actual public store
listings and check readiness, policy restrictions, and app-ads.txt verification.
Google's documentation places the developer website in iOS Marketing URL and
Google Play Store listing contact details. A support link alone should not be
assumed to populate the developer website field.

Building production does not publish an app: upload the iOS binary to App Store
Connect and the Android AAB to Play Console, complete review, then release.
Account readiness and live ad fill have not been verified by a signed physical
build in this workspace. A working test ad validates the client flow, not real
inventory. Use Google's test ads/test devices for QA rather than repeatedly
viewing live ads.

Official references:
https://support.google.com/admob/answer/9363762?hl=en
https://support.google.com/admob/answer/10564477?hl=en
https://developers.google.com/admob/ios/test-ads
