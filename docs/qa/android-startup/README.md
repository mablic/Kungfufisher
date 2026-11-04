# Android version 7 startup crash

## Reproduced failure

The reporter installed versionCode 7 from Google Play on Android 14. The local
versionCode 7 AAB was converted with bundletool 1.18.3 and installed on a clean
Android 13/API 33 arm64 emulator. Conversion changed only the installation
packaging and test signature; it did not rebuild or unminify the app code.
It crashes before React Native renders, with:

```
Unable to get provider androidx.startup.InitializationProvider
Failed to create an instance of androidx.work.impl.WorkDatabase
```

`version-7-crash.txt` retains the actual log. `version-7-artifact.txt` records the
local AAB hash. The local R8 usage report explicitly lists the public no-argument
constructor of `androidx.work.impl.WorkDatabase_Impl` as removed; the relevant
excerpt is in `version-7-r8-removed.txt`. Resolved manifest merger reports show
WorkManager 2.7.0 and Room 2.2.5. Their old class-only consumer keep rules do not
retain the reflective constructors under the current strict R8 optimization.
WorkManager is initialized by AndroidX Startup before app UI or JS ad consent.
This is separate from the Play Console advertising-ID declaration check.

## Fix

`app.json` > expo-build-properties > android.extraProguardRules adds narrowly
scoped public no-argument constructor rules for subclasses of RoomDatabase and
InputMerger. R8 remains enabled. The source configuration survives EAS Prebuild;
editing only an ignored local android/ file would not fix a cloud build.
The same two rules were applied to the local generated ProGuard file solely to
validate a native minified Release rebuild without overwriting local signing
customizations. Existing user ad keep rules and version settings are preserved.

## Verification procedure

1. Build an optimized release with `:app:assembleRelease` or `:app:bundleRelease`.
2. Check the new mapping/usage output: WorkDatabase_Impl's public constructor
   must remain; it must not be listed as removed.
3. Install the minified Release APK (or device APKs generated from the release
   AAB), not Expo Go. Cold-launch repeatedly without Metro.
4. Check `adb logcat -b crash -d` and verify that the app's process survives and
   the actual home screen renders. Enter gameplay and background/return.
5. Repeat on the reported Android 14 physical device with a newly uploaded
   build before promoting beyond testing. Simulator startup cannot certify
   physical GPU behavior, ad inventory, or every Android model.

For publication use a new versionCode greater than 7. Current EAS profiles use
remote version management; changing only app.json's local versionCode does not
necessarily change the uploaded code. Never re-upload the old version 7 AAB.

Related upstream Expo reports:
https://github.com/expo/expo/issues/52173
https://github.com/expo/expo/issues/51337

## Additional loading gate found during native testing

The constructor fix allowed React Native to start (no fatal crash), but the
release could remain on the asset-loading overlay. Background image loading
and its readiness effect were nested under the separate Skia Canvas tree.
Readiness is now owned by the React Native Ocean component: it loads the
background alongside the other images, waits for all required images, and
notifies the app from its own effect. Backdrop receives an already loaded image
and is a rendering-only component. TypeScript and the six Android configuration
checks pass. Native cold-launch results are recorded after the final rebuild.

EAS Android remote versionCode was read as 6 while Play already had 7. It was
synchronized to 7 and re-read as 7. Production autoIncrement will therefore use
8 on the next build unless another build increments it first. No paid EAS build
or store submission was performed by this task.

## Completed native verification (2026-10-30)

- Optimized native Release builds succeeded with R8 enabled. The final
  diagnostic/recovery build reused the verified native R8 output.
- The Room and InputMerger no-argument constructors appear in the new R8 seeds
  report and are absent from its removed-members list.
- Three consecutive cold launches passed on the isolated API 33 arm64 emulator,
  with an empty crash buffer. `fixed-cold-launches.txt` retains each launch/PID.
- The real home screen rendered after restart (see
  `fixed-home-after-restarts-api33.png`). Entered level 1, cast and caught a fish
  for 10 points, then backgrounded/returned. The app correctly displayed its
  paused state (`fixed-game-api33.png`, `fixed-return-api33.png`).
- TypeScript and all six targeted Android/config regression checks passed.
- QA used the rebuilt minified package with versionCode 7 solely for local
  comparison. After validation, app.json and the existing local Gradle metadata
  were aligned to 0.2.5 / versionCode 8 for the next publication. Rebuild before
  upload; the old AAB at version 7 still contains the original crash.
- No physical Android 14 device was connected. This does not certify physical
  FPS, every Android device, or live ad fill. Install the next closed-test build
  on the reporter's Android 14 phone to confirm that device's behavior.

The SDK also logged a publisher-configuration warning that no UMP privacy form
was configured for the Android AdMob app ID. This did not cause the reproduced
startup crash. Configure/verify applicable privacy messages and app readiness in
AdMob separately; the client does not bypass consent or fabricate ad rewards.
