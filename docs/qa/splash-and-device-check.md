# Wuxia launch screen and device performance comparison

## Artwork and behavior

`assets/branding/splash-mark-v1.png` was generated with the built-in imagegen
using the prompt recorded in `assets/branding/PROMPTS.md`. It combines a jian,
two carp and gold water flourishes on genuine transparency. The 200dp native
logo stays inside Android's 96dp safe mask radius (measured visible radius 92.3dp
at alpha>50). `store/branding/splash-preview-v1.png` is a composed design preview,
not a physical-device screenshot.

Native splash and React loading share #0B2423 and the centered 200dp emblem.
React adds serif Kung Fu Fisher typography, restrained framing and loading text.
The first React layout releases the native splash; font/art loading remains
visible as a real React page, with the existing retry/recovery action. There is
no artificial minimum delay or wait for ads/Game Center/network responses.
The artwork overlay fades out in 180ms using the native animation driver and
unmounts after loading. No splash artwork is drawn during gameplay.

The official expo-splash-screen plugin is configured for future EAS/prebuilds.
Only splash mods were applied to existing native directories, preserving local
Android signing, R8 fixes, iOS ad configuration and Game Center entitlements.
The splash-specific Android theme uses light system icons, and the iOS launch
status bar is light. In-game StatusBar styling remains controlled by React.

## Completed verification

- TypeScript passed; config introspection preserved Game Center and the light
  iOS launch status bar.
- Image alpha and Android mask safe area were measured; the composed portrait
  preview was visually inspected.
- CocoaPods installed the splash module successfully.
- Real ExpoSplashScreen module/dependency compilation passed on arm64 iOS Simulator.
- ibtool compiled the launch storyboard without errors or warnings.
- Android Release Kotlin compilation, JS/assets bundling and resource processing
  passed. iOS production Hermes export passed.
- No signed full app archive, physical cold-start timing or physical FPS test
  was performed. Expo Go does not reproduce the final native splash accurately.

## iPhone 17 Pro Max report

The user confirmed the stuttering was observed in a connected development build.
This does not establish whether production also stutters or which subsystem is
responsible. React Native's developer tools/checks can add runtime overhead; the
game normally executes on the phone, not the computer. HUD values are already
quantized/state-driven; code inspection did not establish a per-frame React HUD
publication bug. Simulation snapshots are currently capped at 60Hz, independent
of a ProMotion display's maximum refresh rate. Clear hitches still need measurement.

Run `npm run ios:release:device` (local Release, no Metro server, choose the iPhone).
After installation, close the app, disconnect the cable and launch it normally.
Compare the same river/settings during idle swimming, dragging aim, and multi-fish
techniques. Keep the current artwork resolution; a blurry development build is
not a substitute for a Release performance measurement. If hitches persist, use
Xcode Instruments on that device (Time Profiler / animation hitches / graphics),
then optimize the measured cost. Frame unit tests and simulator compiles alone
cannot certify 60fps on the user's phone.

References:
- https://docs.expo.dev/versions/latest/sdk/splash-screen/
- https://reactnative.dev/docs/performance.html
