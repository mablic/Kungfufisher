# Game Center deferred for this release

The first fully reproduced EAS local archive failed because the stored App Store provisioning profile lacked the Game Center capability/entitlement requested by the application. Expo Doctor and Pods had passed; the earlier generic local-build exit code concealed the signing cause.

At the user's request, this release does not use Game Center:

- Removed withGameCenter from the active Expo plugin list.
- Set extra.gameCenterEnabled=false. The hook does not load/authenticate/report through the native Game Center bridge unless this flag is explicitly true.
- Removed the entitlement from the existing ignored native iOS target as well. Expo introspection confirms both public and generated iOS entitlements are empty.
- Retained local achievements, local saved records and artwork. The UI describes local progress and hides Game Center connection/sync actions.
- Retained dormant native module/plugin sources for a future explicitly enabled release. Merely linking GameKit does not call its authentication or reporting functions.

Signing credentials were checked with the existing Apple login session. The project association to the old provisioning profile was removed and a fresh App Store profile was created with the same existing distribution certificate. No certificate was revoked, and no store submission was performed.

Validation: TypeScript, 15 achievement/privacy/update tests and the dedicated deferred-Game-Center release guard test pass. A subsequent EAS local build uses current Expo 58.0.23 / React Native 0.88.1 and is recorded in build/ios-local.log; see the task's final result for archive status.

To enable Game Center in a later release, explicitly set the flag true, restore the plugin, enable/verify the App ID capability in Apple Developer, configure achievements in App Store Connect, and regenerate a matching provisioning profile. EAS CLI capability synchronization alone should not be assumed to enable Game Center automatically.

Final validation: EAS local production build succeeded and exported build/KungFuFisher-local-verify.ipa (about 40.9 MB). The archived application reports version 0.2.7, build 9. Its actual signed entitlements were decoded and do not contain Game Center. The IPA has not been submitted to App Store Connect; no physical gameplay/FPS test is claimed.
