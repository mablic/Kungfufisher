# Kung Fu Fisher — asset provenance summary

Prepared from repository inspection, 2026-10-23. This documents source provenance; it is not a copyright registration, legal opinion or third-party licensing agreement.

- Game artwork: AI-assisted assets generated for this project. Prompts and processing notes are retained in `docs/ART.md`, `assets/art/OCEAN-PROMPTS.md` and branding prompt files. The project documents no copied third-party game characters or game artwork. The publisher should check all final assets, including marketing images, before making a rights declaration.
- New reef squid and seahorse: original vector shapes created for this project, retained in `assets/art/source/reef-creatures-atlas.svg` and rasterized into a bundled transparent atlas before runtime. These two additions are vector illustrations rather than AI-generated artwork.
- Music and effects: synthesized by `scripts/generate-audio.ts` and `scripts/generate-theme-music.ts` and bundled as local audio. No external music streaming service is used for gameplay.
- Font: Cormorant Garamond from `@expo-google-fonts/cormorant-garamond`. The SIL Open Font License and attribution are retained in `assets/art/FONT-LICENSE.txt`.
- Runtime libraries: Expo/React Native, React Native Skia, Reanimated, Google Mobile Ads and other packages are listed in `package.json` / `package-lock.json`. Their respective licenses and Google's SDK terms apply; this summary does not replace them.
- Gameplay scores, stars and seals are virtual progression; no cash prizes, betting or real-money gambling flow is implemented in the inspected source.

Before attaching: publisher must verify all final artwork and bundled dependencies, confirm applicable generation-tool rights and terms, and provide actual authorizations if any protected third-party material has been added outside the inspected source. No publisher name, registration number or authorization document is invented here.
