# Game Center release setup

## Included in the app

- Local Achievements sheet on the home screen (12 goals, progress bars, completion).
- iOS GameKit authentication at startup without making sign-in mandatory for play.
- Native Apple achievements dashboard opened from that sheet.
- Incremental achievement reporting from existing persisted level records.
- Failed reports retry from those records on foreground/home return. No invented
  cumulative catch counts, duplicate rewards from replayed levels, or new server.
- Successful reports are deduplicated per Game Center player. Native reporting
  checks player identity again before submitting and merges Apple's prior progress.
- Android and Expo Go show local achievements without loading an absent iOS bridge.
- No friend-list permission, multiplayer or leaderboard is included in this change.

## Required Apple configuration (not performed by this coding task)

1. Apple Developer → Certificates, Identifiers & Profiles → Identifiers →
   `com.mablic.kungfufisher`: enable Game Center if not already enabled.
2. App Store Connect → Apps → Kung Fu Fisher (Apple ID `6825627684`) → Game Center
   → Achievements. Create the 12 achievements using `store/game-center/achievements.csv`.
   CSV is a copy/paste preparation sheet, not an automatic App Store Connect import.
   Use the exact IDs; do not substitute the AdMob App ID. All are visible,
   non-repeatable, and localized to English (US). Total: 570 points.
3. For each achievement enter the reference name, points, display name, pre-earned
   and earned descriptions from the CSV. Upload its matching 1024×1024 RGB PNG
   from `store/game-center/icons/` (72dpi; artwork is centered for circular masks).
4. Enable Game Center for the next iOS app version. Add the new achievements to
   that version's review submission as directed by App Store Connect. They need
   Apple approval before becoming available to customers.
5. Rebuild the native iOS app. EAS Prebuild automatically discovers the local
   module under `modules/` and the entitlement plugin. For the existing local
   `ios/` checkout, install pods (`cd ios` then `pod install`) before building;
   do not run a destructive clean prebuild over custom native changes.
6. The provisioning profile must include Game Center. When EAS/Xcode asks to
   regenerate a profile after enabling the capability, allow it. Reuse the same
   bundle ID. Verify the signed archive's entitlement is true.
7. Install the new build on a physical iPhone/TestFlight and perform the checklist
   below before production. Expo Go and an existing TestFlight binary cannot gain
   this native module through a JavaScript-only update.

## Physical-device QA

- Fresh install: Game Center initialization can be dismissed; normal fishing works.
- Signed-in install: name appears and Game Center opens/closes from Achievements.
- Existing save: valid existing milestones report without replaying every river.
- Earn 3-streak, clear a level, return home: progress is visible locally and in Apple.
- Reopen the app: completed achievements do not repeatedly show new banners.
- Offline: finish a level, close/reopen, restore network, return home/retry Game Center.
- Switch Game Center accounts: in-flight batches must not be credited to the wrong
  player; acknowledgement caches are scoped by ID. The underlying local level save
  remains shared on the device; this feature is not account-based save migration.
- Show the Game Center dashboard while ad consent is due: no stacked native dialogs,
  game is paused if a native Game Center presentation occurs during a run.
- Confirm ads, no-sign-in gameplay, Android and Expo Go still work.

## Review notes / privacy wording

Game Center is optional. No separate game registration is required. Apple handles
Game Center sign-in. The app uses the Game Center player identifier/display name
and submits achievement IDs and percentage progress to Apple. Gameplay saves
remain on the device; this is not cloud level-save synchronization. Include Game
Center among external services in review notes and update the published privacy
policy to describe this use. Review App Privacy responses for the shipping build
and Apple/AdMob behavior rather than assuming Game Center means no data is used.

Suggested review instructions: Launch the app, dismiss or complete Apple's Game
Center sign-in, tap Achievements on the home screen. Earn a 3-catch streak or clear
one river, then return home to see achievement progress. Tap Open Game Center to
view Apple's achievements dashboard. The game remains playable without sign-in.

## References

- https://developer.apple.com/documentation/gamekit/initializing-and-configuring-game-center
- https://developer.apple.com/help/app-store-connect/configure-game-center/manage-achievements/
- https://developer.apple.com/help/app-store-connect/reference/game-center/achievements/

## Verification completed in this workspace

- TypeScript passed; 11 achievement/configuration tests passed.
- iOS and Android production Hermes exports passed.
- Expo autolinking discovered KungFuGameCenter and generated its module provider.
- Config introspection confirmed `com.apple.developer.game-center = true`.
- CocoaPods installed all dependencies after refreshing its local spec index.
- Xcode compiled the real KungFuGameCenter target and its dependencies for arm64
  iOS Simulator successfully (code signing disabled for this compile check).
- All 12 images were generated and checked as 1024×1024 RGB, 72dpi; one was
  visually inspected. CSV IDs and image dimensions are covered by tests.
- No App Store Connect achievement records were created and no signed app was
  uploaded. Authenticated physical-device/TestFlight QA remains required after
  the Apple configuration. A module compile is not a signed full-app archive.
