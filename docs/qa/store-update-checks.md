# Store update checks and raised two-star goals

## Behavior

- Release app checks quietly after the home screen/artwork is ready, with a 1.8s startup delay. The same installed app checks at most once per 24 hours; failed attempts are throttled too. Network requests time out and never block gameplay.
- iOS compares the installed native CFBundleShortVersionString with the Apple lookup result for App Store ID 6825627684. It verifies the bundle ID, numerical version ordering and minimum iOS compatibility. Storefront country is converted to alpha-2 using Foundation region names; device region is the fallback if StoreKit has no storefront. Update opens the fixed App Store URL.
- Android uses Google Play app-update 2.1.0, including Play's account/rollout/device eligibility. It skips installs not owned by the Play Store. The custom English prompt starts a flexible update when allowed; otherwise it opens the fixed Play listing. Google Play consent is required. Download completion prompts for restart only on the home screen. A persistent pending flag handles process termination and resume; repeat download-ready reminders are throttled to a day. Only checks for an accepted download's status can bypass the normal daily availability check.
- A store result that arrives during gameplay is queued for home. Presentation is gated against ads, consent, Game Center, guides, achievements, loading/error screens and inactive app state. A short touch-blocking home overlay prevents a new game starting while handing off to the native update flow. No force-update rule, private backend, OTA bundle swapping, or simulation-frame polling was added.
- Debug / Expo Go builds skip the feature. iOS sandbox receipt / TestFlight installs skip public-store comparisons. A new native build is required; older installed builds without this feature cannot receive the prompt retroactively.
- First six two-star targets remain 170/250/320/380/440/480. Levels 7–42 receive roughly 10% rising to 15% higher two-star targets, rounded to 10 points. One- and three-star targets, fish population, artwork resolution and simulation are unchanged. The existing two-star gate, paired manual milestones and optional +15s ad continuation remain.

## Verification

- TypeScript; update policy / progression / continuation tests; independent-seed balance checks for all 42 levels, including two-star accessibility and welcoming first-six goals.
- Android module Release Kotlin compilation and app Release Kotlin/Java compilation succeeded.
- CocoaPods installed KungFuStoreUpdate; its arm64 iOS Simulator native target and dependencies compiled successfully.
- Android/iOS production Hermes exports succeeded.

No live store update or physical-device installation was completed. Store QA needs a lower installed build and a higher eligible release with the same signing/app identity. On Android, test an account that owns the app through Google Play, accept/cancel the flexible flow, finish download while playing, return home, postpone/restart, kill/reopen during download, and test offline behavior. On iOS, verify with an actual App Store install; TestFlight intentionally will not prompt against the public release. Check regions, minimum-OS filtering, Later behavior, ads/Game Center exclusivity and saved-progress retention.

Sources: https://developer.android.com/guide/playcore/in-app-updates/kotlin-java and https://performance-partners.apple.com/search-api . No store submission or paid cloud build was performed.
