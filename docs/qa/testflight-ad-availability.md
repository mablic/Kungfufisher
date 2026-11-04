# TestFlight rewarded-ad availability — 2026-10-23

User reported no rewarded offer after losing in TestFlight 0.2.2 (3). This report alone does not prove whether initialization, consent, connectivity or live inventory failed. That installed build predates this change.

## Client issue fixed

The prior UI latched readiness at the instant a run ended. If false, the offer was hidden for that run even if a load completed afterward. Now the results sheet owns a persistent optional-continue section for eligible runs (ended, fewer than three stars, extension not used). A ready ad enables Watch ad +15s; loading, no-fill, network, consent and generic errors have non-blocking status text. Late inventory updates the same section without replacing results with a modal. Results/pause content scrolls on shorter screens. Free retry/next-level/map remain available. Failed/dismissed ads do not permanently suppress another available attempt, and only a genuinely earned reward can extend the run once.

SDK load failures publish classified status rather than remaining silent in Release UI. About exposes a local Ad support reference with the SDK error code and source; it excludes raw error messages and is not uploaded to a new analytics service. No ad supply, account approval or callback is fabricated.

## TestFlight isolation build

`npm run build:ios:test-ads` uses profile `testflight-test-ads`, extending the ordinary production native configuration with `EXPO_PUBLIC_ADMOB_TEST_ADS=true`. This is a store/TestFlight-compatible Release build with Google test units, not Expo Go's simulated countdown. Submit the resulting iOS build to TestFlight, install the new build number, and test ad presentation/close/reward. Test ads must not be promoted as revenue-generating live inventory. Ordinary `npm run build:ios` retains the supplied live units.

This task did not run a paid EAS build, upload a binary, edit the AdMob dashboard or install anything on the user's physical iPhone. A fresh TestFlight install/update is required; existing build (3) will not receive source changes automatically.

## Acceptance

- Lose a run while native loading is still pending; verify visible loading state and free retry.
- Complete loading after results are visible; same Watch ad button becomes enabled, no modal replaces the screen.
- No-fill/network/consent/init failure gives status rather than hiding the section. About support reference can be included in a support report.
- Successful test ad + close grants exactly +15s once; early dismiss, failed load/show and duplicate taps do not.
- Fewer than three stars may continue, even after a clear; three stars/already extended should not offer another continue.
- Check short-screen scrolling, guide/pause, music and background transitions on installed iOS/Android builds.

Production ad availability and AdMob account readiness remain unverified. A successful test-unit view can validate the client path but does not prove live account/ad-unit serving is approved.

## Verification and limits

78 full regression tests passed after the status/result changes; the final ad-focused suite passed 16 tests after adding idle-only initialization retry (30-second minimum delay), consent-info refresh retry and support diagnostics. TypeScript and both production Hermes exports passed. The existing privacy form is not repeatedly presented on an automatic retry; failed consent-info network refresh can retry while idle.

A simulator UI verification attempt was interrupted by device-window control changes and was not completed. No physical TestFlight ad view, real ad fill or screenshot proof of the updated results layout is claimed. The installed 0.2.2 (3) remains unchanged until the user builds/uploads/installs a newer build.
