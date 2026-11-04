# Kung Fu Fisher — English App Store submission pack

The copy below and the individual files in `en-US/` are based on the current project. This pack has not been uploaded. Replace all bracketed placeholders before submitting. Keep declarations aligned with the exact Release build selected in App Store Connect.

## App information

- Name: **Kung Fu Fisher**
- Subtitle: **Wuxia Skills. Arcade Fishing.**
- Primary language: **English (U.S.)**
- Bundle ID: **com.mablic.kungfufisher** — select the matching Apple App ID.
- SKU: use the SKU already entered for this app record. For a new record, `kungfu-fisher-ios-001` is a suggested internal SKU; this is not the Bundle ID.
- Primary category: **Games**.
- Suggested game subcategories: **Casual**, **Action**.
- Version: **0.2.0**, matching the current app.json. Select the new Kung Fu Fisher build, not a build associated with an earlier Bundle ID.
- Copyright: **2026 [LEGAL RIGHTS HOLDER]**. Enter the actual person or legal entity that owns the rights. Apple adds the copyright symbol automatically; do not infer the owner from the Bundle ID.

The app name, subtitle, promotional text, description, keywords, and release notes are available separately in `en-US/`. Paste plain text, without Markdown fences or field labels. Lengths have been checked: name 14/30 characters, subtitle 29/30, promotional text 161/170, keywords 76/100 UTF-8 bytes, description 1793/4000.

## Version information

- Promotional Text: paste `en-US/promotional_text.txt`.
- Description: paste `en-US/description.txt`.
- Keywords: paste `en-US/keywords.txt`; retain comma separation.
- What's New in This Version: `en-US/release_notes.txt`. Use this if the field is required for the version; a first release may not require it. Do not describe an update that has never shipped.
- Support URL: **https://tradepartner.fyi/kungfu-fisher/support**. Publish the completed `support-page-draft.md` first. A local file path or an email address alone is not a support web page.
- Marketing URL: optional. Leave blank if there is no live product website.
- Privacy Policy URL: **https://tradepartner.fyi/kungfu-fisher/privacy**. Publish the completed `privacy-policy-draft.md` after confirming its accuracy.
- Privacy Choices URL: optional; provide a real page if applicable.
- Routing App Coverage File: not applicable to this fishing game; leave blank.

## App Review information

- Sign-in required: **No** for the current build. No demo account is necessary.
- Contact first name: **[FIRST NAME]**.
- Contact last name: **[LAST NAME]**.
- Contact phone: **[PHONE NUMBER WITH COUNTRY CODE]**.
- Contact email: **[MONITORED EMAIL ADDRESS]**.
- Notes: paste `review_notes.txt`, after checking it against your final submitted build.
- Attachment: optional; attach a recording or explanation only if needed to demonstrate a feature.

## Screenshots and creative assets

Use the new header and preview in `../ios-creative/`. The 886×1920 MP4 belongs in the App Preview slot; the header PNG belongs in the creative asset/header slot. A preview poster PNG is not a replacement for an App Preview video or a correctly sized screenshot.

Previously captured home screenshots show the old title River & Steel. Replace them with screenshots of the renamed app before submission. The current preview contains gameplay only and no old title, but was recorded from the earlier local Release installation: compare it with the submitted TestFlight build before use.

## Privacy and age declarations — verify, then answer

Current source stores preferences and progress on-device and requires no account, but now integrates Google AdMob rewarded advertising. Do not declare that the app collects no data merely because game records are local. Review Google's SDK disclosures and the exact signed build when completing Apple App Privacy / Google Play Data safety. Android Advertising ID declaration is Yes for the AdMob build; AD_ID is explicitly declared. Publish the updated advertising disclosures before release. See `../../docs/qa/admob-and-android.md`.

Complete Apple's age-rating questionnaire using the actual build. The game depicts blades striking fish, so assess the cartoon/fantasy violence questions rather than automatically choosing None for all violence. There is no visible blood or gore in the current game. No chat, user-generated content, simulated casino play, real-money gambling, or loot-box purchases are implemented in the current source. Apple calculates the rating from the full questionnaire; do not manually assume 4+.

Choose Kids Category only if you intentionally meet its requirements; the current marketing copy does not claim the game is made for children. Answer advertising and interactive-feature questions for the actual production build, not planned features.

## Other settings that require your decisions

- Pricing and availability: choose the intended price and countries. A free launch is consistent with your proposed advertising model, but this pack does not set a price.
- Release timing: manual release is useful if you want to check the approved page before launch. This setting is your choice.
- Content rights: confirm you have the rights to distribute the included art, fonts, and audio.
- Export compliance: app.json currently sets `ITSAppUsesNonExemptEncryption` to false. Verify that declaration for the final binary and its dependencies; do not treat it as a conclusion based solely on the app's genre.
- EU trader status, account agreements, tax/banking, and any territory-specific documentation must reflect the publisher's actual situation. These cannot be inferred from project code.
- Subscriptions and in-app purchases: none are implemented in the current source; do not create product listings for nonexistent features.
- Accessibility labels in App Store Connect: declare only features you have tested throughout the app. The presence of some accessibility labels alone does not establish full VoiceOver support for canvas gameplay.

## Official references

- [App information and naming](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information)
- [Version fields and limits](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information/)
- [App Privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy)
- [Age rating questionnaire](https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating)
- [Metadata accuracy and review requirements](https://developer.apple.com/app-store/review/guidelines/)

## Apple request received 2026-10-23

The reviewer requested six items, including a physical-device launch-to-gameplay recording. Use `../review/physical-device-recording.md` for the recording and QA procedure, `review_notes.txt` for App Review Information > Notes, and `../review/app-store-connect-reply.txt` for the English reply. Fill video/device/iOS/submitted-build fields and verify final asset rights before copying. These are drafts until the required recording exists; no App Store Connect reply or upload has been sent. A simulator App Preview is not the requested evidence.
