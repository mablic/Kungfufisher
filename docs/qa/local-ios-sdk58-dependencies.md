# Local iOS dependency repair (2026-11-04)

- Expo Doctor's two failing checks were SDK 58 dependency mismatches (eight packages) and overly broad ios/android gitignore patterns that also ignored local Expo module sources.
- Ran Expo's compatible dependency alignment. Expo is now ~58.0.23, React Native 0.88.1, safe-area-context ~5.11.1; package-lock.json is updated.
- Restricted native generated directory exclusions to /ios/ and /android/. Game Center and store-update module source directories are no longer ignored.
- Removed the duplicate dark splash configuration because the app explicitly uses a light interface. The same deep-teal splash image/background remain.
- Updated the update-handoff overlay to StyleSheet.absoluteFill, matching the refreshed React Native type surface.
- Expo Doctor subsequently passed 20/20. Dependency compatibility check and TypeScript pass. Thirteen configuration/update/resolution/worklet tests pass.
- Refreshed ignored local CocoaPods state after the SDK patch; production EAS local builds create a fresh native project from source.

CocoaPods messages saying a dependency 'has added N script phases' are advisory, not build-failure reports. These libraries use build phases for configuration-specific framework preparation. A final local archive/signing/upload result must be verified separately; no signed archive or submission is asserted here.
