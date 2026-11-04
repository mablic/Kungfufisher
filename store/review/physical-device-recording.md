# Apple review: physical-device recording

Apple specifically requested a recording on a physical device running the latest operating system. This cannot be fulfilled by the repository, simulation tests, Expo Go or a simulator video. The existing `store/ios-creative/app-preview-886x1920.mp4` is a marketing preview, not evidence satisfying this request.

## Record the submitted build

1. On a physical iPhone, check Settings > General > Software Update for the latest compatible public iOS. Record the actual installed version; do not infer it from the calendar or a simulator.
2. Install the exact new Release/TestFlight build that will be selected in App Store Connect. Note its version/build and the device model. A JavaScript-only reload cannot install the AdMob native module or the new in-app guide.
3. Enable iPhone screen recording before launching the game. Start the video on the Home Screen, then launch Kung Fu Fisher. Do not include private notifications, Apple IDs or credentials.
4. Show any consent form naturally. Declining tracking must not prevent gameplay. Do not artificially grant rewards or enable developer-only level unlocks.
5. Tap Begin fishing / Continue > Cast off. Show several charge/aim/release casts, normal catches and multiple-strike fish when accessible. Capture a floating manual and demonstrate its remaining-use badge and special cast.
6. Open ?, browse Fish / Skills / Rivers / About, then close. Show pause/resume. Background and foreground once and confirm the game resumes only when requested.
7. Reach a real result, then show retry or the next unlocked level and the normal level map. If an ad is available, optionally demonstrate rewarded overtime; otherwise show the ordinary retry path. Do not repeatedly click real ads for testing or imply unavailable inventory is guaranteed.
8. Finish on the home screen. Upload/attach the unedited recording as requested by App Review. If providing a link, verify access without signing in. The reviewer needs a working recording, not a local file path.

There are no account creation/deletion, UGC, IAP or subscription flows to record. Do not add these features merely for review.

## Physical QA to perform before resubmitting

- Cold launch and assets/fonts load; no Expo/development overlays.
- Correct taps/aiming, manual three-use count, stars/unlock/save and restart.
- Level 13 spinning-sword case, simultaneous catches, storm/fog and shark stages using legitimately earned or previously saved progress.
- Guide and pause stop the clock; background/foreground and interruptions remain responsive.
- Offline launch and free retry work; absent ads do not block results.
- Native ad reward adds exactly 15 seconds once, early dismissal adds none, audio returns correctly. Use test ads on a separate QA build; demonstrate the actual submitted configuration honestly.
- Play continuously for at least 15 minutes on supported physical iPhones; record observed issues rather than claiming test results that were not measured.

## Submission checklist

- Fill all recording/model/iOS/version/build placeholders in `../metadata/review_notes.txt` and `app-store-connect-reply.txt`.
- Verify purpose, external services, regional behavior and rights against the exact submitted binary, especially if Apple reviewed an earlier build without ads.
- Replace the asset-rights reminder with publisher-confirmed facts. Complete the provenance summary's final checks.
- Paste review notes into App Review Information > Notes, attach/link the recording, and send the completed reply in the App Review conversation. No reply or upload has been sent automatically.
- Review App Privacy, age rating, support/privacy URLs and applicable AdMob consent configuration for the new ad-enabled binary.
