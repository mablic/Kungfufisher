# Kung Fu Fisher

An English-language, portrait React Native fishing game with Chinese wuxia art. A wandering swordsman casts a charged spear from a skiff across a 42-level campaign in seven chapters (Mistwood Creek, Reed Marsh, Rain River, Moonlit Lake, Storm Gorge, Jade Estuary, Tempest Reach). Each level earns up to three stars; one star unlocks the next.

## Play locally on iOS

Node 22.19 or a newer compatible version, Xcode and CocoaPods are required for a standalone native build.

```sh
nvm use
npm install
npm run ios
```

Fast iteration with compatible Expo SDK 58 Expo Go:

```sh
npm run start:go
```

A standalone simulator Release build, which embeds its assets and does not require Metro:

```sh
npm run ios:release
```

For a physical iPhone, run `npx expo run:ios --device --configuration Release`; Apple development signing must be configured locally.

## Controls

Hold anywhere underwater to charge. Drag to aim; release to cast. A full charge takes 1.2 seconds. The gold ring marks maximum range, and the bar below the boat shows charge. One spear catches one fish unless the fish is armored. Reach the one-star score before time runs out to clear a level; play continues until the timer ends so the rest of the round can earn more stars.

Quick consecutive catches build a combo: ×1.5 from three in a row, ×2 from six. A miss (shown as a ripple) or 2.8 seconds without a hit breaks it. Golden fish appear periodically and are worth three times their points.

## Campaign

Each chapter has its own painted river (pine creek, reed marsh with lotus, rain-swept water town, moonlit lake with pavilion, storm gorge). Each new creature or hazard is introduced once, with a briefing card, before it is mixed with earlier ones, and no more than two levels in a row pass without something new (enforced by a test):

| Mechanic | Effect |
| --- | --- |
| Gold dart, river fry, flick koi | Fast, small, or sudden turners |
| River turtle | Protected: striking it costs 50 points, breaks the combo and blocks the spear |
| Mandarin fish | Lurks almost still, then lunges |
| Rice eel | Quick and weaving; only the front of the body counts |
| Wind / shifting wind | Pushes the spear sideways; the boat pennant and HUD chip show direction and strength |
| Iron carp, dragon carp, ancient sturgeon | Armoured: 3, 5 or 4 strikes, shown as pips; each strike keeps the combo alive |
| Puffer | The first strike inflates it (bigger, slower); the second lands it |
| Swell | The boat drifts sideways and rocks; stronger swell moves the throwing point farther |
| Fog, rain, night, storm | Reduced visibility around the lantern and spear, and a shorter visible aim guide |
| Whisker catfish | Hugs the riverbed and periodically burrows out of reach |
| Lantern koi | Glows in the dark; landing it lights the whole river for a few seconds |
| Thunder | Lightning briefly clears the dark water |

Every level also has a seal challenge (catch a set number of one species, reach a combo, land golden fish, miss no more than N casts, or leave every turtle unharmed). Meeting it while clearing the level earns that level's seal, a collectible separate from stars; the HUD shows progress live.

Star thresholds come from `scripts/balance.ts`, which plays every level with a simulated casual and skilled player (`scripts/bot.ts`, with aim, lead and wind-reading error and reaction time) over 60 seeds per profile. Every third level is a Trial. The tutorial targets roughly 80% of simulated casual clears; buildup stages target 70% down to 50%, and Trials target 45% down to 35%. These are calibration goals for bots, not measured human clear rates or guaranteed ad views. Three-star targets use a skilled-player percentile that rises across the campaign. The simulated players actively seek three-use manuals when equipment is nearly empty. Three-star targets also have a casual-player 97.5th-percentile floor, so strong manuals do not make mastery stars automatic. Seal rates are reported separately. `tests/levels.test.ts` re-checks these gates on 24 different seeds per level. `scripts/playability.ts` reports the player experience per level (clear and near-miss rates, catches per minute, longest stretch without a hit, turtle strikes, combo streaks) and a 1000-player campaign funnel. A multi-target technique advances its combo once per release, rather than once per fish. The bot never measures fun or boredom: see `docs/PLAYTEST.md` for the human playtest protocol. Run `node --experimental-strip-types scripts/balance.ts --json` to recalibrate after tuning changes.

## Martial-arts manuals

Spear a cloth-bound **MANUAL** to learn its technique. The indigo cover, thread binding, cream pages and colored seal identify a martial-arts book. The seal, character sash/aura, sword and equipment badge share a color.

Every manual grants exactly **3 casts**, including Heavenly Swords. There is no expiry timer. One release consumes one use (two blades still count as one cast); misses count, while cancelled holds and pauses do not. After the third cast, normal equipment returns; an in-flight technique still finishes normally. A new manual replaces the current technique and refills its three uses.

- Twin Swallows: two diverging swords per cast.
- Dragon Lance: a long sword that pierces fish.
- River Cleaver: leaves the hand, descends to the aimed depth, then sweeps horizontally.
- Lotus Wheel: rotating blades with a wider collision path; one strike per fish per cast.
- Wind Anchor: ignores wind.
- Iron Palm: two armor damage per hit.
- Heavenly Swords: an expanding river-wide sword wave; one strike per exposed fish, no repeated hits on respawns. Turtles and buried fish are spared. Armored fish may survive.

The bottom equipment badge shows remaining uses (3/3 → 2/3 → 1/3). The **?** button pauses and opens the Fish / Skills / Rivers guide, including all 42 levels.

## Rendering

Sword silhouettes, manual emblems and character aura geometry are cached; animations change transforms rather than rebuilding paths. The sword wave uses one cached ray path. Fog uses one analytic shader pass instead of per-frame geometric subtraction and large-area blurs. Fish wave offsets are computed once per mesh column and reused across rows; tint is applied directly to the paint instead of an offscreen layer. When not aiming, trajectory prediction is skipped.

Android starts and stays at minimal effects; iOS starts at balanced. Only the selected chapter painting is loaded. Balanced rasterizes at 80% of screen dimensions; minimal uses 1/1.75 (about 57%, or 33% of the original pixel count), while the native HUD stays full resolution. On iOS sustained slow frames switch to minimal, and six stable windows restore balanced. Minimal removes tail deformation, armor blur and rare-fish sparkles, and reduces rain. Simulation snapshots are capped at 60 per second on high-refresh displays, with bounded time accumulation so the clock does not slow down. Artwork resolution, fish movement, aim, hazards and simulation accuracy stay intact. Detailed frame collection is opt-in in development (`EXPO_PUBLIC_PROFILE_GAME=true`); normal Expo Go sessions do not collect/sort/log frame samples. Simulator samples are a diagnostic, not a guarantee for physical devices.

The Skia scene is memoized separately from the React HUD, so score and timer updates do not reconcile the whole scene. Hits within 80 ms share a summed score popup with a catch count; at most three feedback groups are alive. Balanced/minimal impact effects have no particles or blurred halo. Impact sound and haptics are limited to one per 90 ms without suppressing rare/clear/win cues. Effect arrays are compacted in place during simulation to reduce allocation pressure. All fish rewards and armor damage are still computed individually.

## Optional rewarded overtime

At time-up, a player below three stars can optionally complete a rewarded ad for exactly **+15 seconds**, once per run. A failed run targets the clear score; a cleared run targets the next star while keeping its earned result. Score, fish and remaining manual uses carry over. Skipping, closing early, loading failures and duplicate requests add no time. Additional time does not guarantee a star.

`src/useAdMob.ts` registers Google AdMob on native builds after UMP consent permits requests. The two platform App IDs are configured in `app.json`; rewarded unit IDs are separate per platform. One owned ad preloads and retries only while the river is idle, has a 50-minute freshness limit, and is destroyed after use. Only EARNED_REWARD followed by native close grants time; native errors, load timeout and duplicate taps do not invent rewards. Game audio pauses during the ad. The home screen exposes Ad privacy choices when UMP requires it. Requests are non-personalized, which still requires appropriate privacy disclosures.

Expo Go skips native ads. Development builds and the EAS preview profile use Google test ads; production uses the supplied live units. To create an independent Android APK with test ads and Release performance: `npm run build:android:test`. A native rebuild is required; a Metro reload or OTA JS update cannot install the SDK. Configure AdMob Privacy & messaging and update published privacy / Google Play Data safety / Apple App Privacy before release. See `docs/qa/admob-and-android.md`. Eligible results always show a non-blocking continue section with live loading/failure status; late ad readiness enables the same button without replacing results. Retry and next-level remain available. For TestFlight isolation with Google test units, use `npm run build:ios:test-ads`; production uses live units. See `docs/qa/testflight-ad-availability.md`.

## Audio

Creature sprites and chapter backgrounds were generated, then keyed and packed by `scripts/key-sprite.py` (see `docs/ART.md`).

Sound effects and the river music loop are synthesized procedurally (plucked strings on a pentatonic scale, bells, noise) by `scripts/generate-audio.ts` into `assets/audio/`. There are no third-party recordings. Sound, music and haptics toggle independently from the home screen or pause menu. `expo-audio` is a native module: Expo Go already includes it, but standalone builds need a fresh native build (`npx expo prebuild` / `npm run ios`).

Pause from the top-right button. Backgrounding pauses automatically and silences audio. Progress, stars and preferences are saved locally. No account or backend is required.

## Rewarded overtime (ads)

When a run ends without clearing, the player gets one chance to watch a 30-second rewarded ad and keep fishing for 15 more seconds on the same run (score, combo and fish carry over). A cleared run never offers an ad, so stars stay earned. Leaving the ad early ends the run. There are no forced or interstitial ads. The rules live in `src/continues.ts`.

`scripts/continues.ts` replays the simulated players with the continue accepted. `tests/continues.test.ts` checks that every failed run is offered once, a second death is not, and a clear is not.

`src/ads.ts` is the ad-network seam: a provider registers with `setAdProvider`, and offer funnel events go through `trackAd`. Development builds use `src/ui/SimulatedAd.tsx`, a 30-second test ad. For release, register a real rewarded-ad SDK such as `react-native-google-mobile-ads` (it needs a development build, not Expo Go). Without a provider, the continue is not offered.

## Architecture

`src/levels.ts` and `src/species.ts` define the campaign data. `src/game.ts` contains serializable worklet-safe game state and deterministic rules. `src/useGameRuntime.ts` runs simulation and input on the UI runtime, with sparse HUD/haptic/result events sent to React. `src/Ocean.tsx` draws cached local textures, shared-value transforms, aiming and effects using Skia. `App.tsx` contains the English screen flow; `src/ui/` has the level map and briefing; `src/save.ts` stores progress.

```sh
npm run typecheck
npm test
```

See `docs/REVIEW.md` for the self-review and crash root cause, `docs/VALIDATION.md` for measured QA results, and `docs/ART.md` for generated asset prompts/provenance. A standalone simulator build does not establish physical-device or App Store readiness. The rewarded-ad flow is implemented; connecting and verifying a release ad provider remains outstanding.

## Stability and expanded campaign (October 22, 2026)

The frame callback is memoized independently of HUD renders so Reanimated does not repeatedly unregister/register it as the score changes. App reactivation re-enables the frame driver; background pauses explicitly publish the paused HUD. A missing heartbeat after six foreground seconds raises a restart prompt. Restart reconstructs all run state and remounts the canvas, while completed records remain in the existing local save. Late frames process at most 100 ms of catch-up and trajectory prediction has a fixed sample limit.

There are four new large species: bull shark (four strikes), hammerhead (five), swordfish (three), and giant grouper (six). Their atlas is loaded only in levels that use it; rosters remain capped at eight fish. Existing IDs 1–30 and previously earned stars are retained. Trial labels identify levels divisible by three. Manual drifters arrive less often than the original eight-second cadence.

Actual ad views depend on provider availability and player choice. A production ad provider is still required; raising difficulty does not itself display real ads. No ad completion or retention rate is guaranteed. See `docs/qa/recovery-and-42-levels.md` for validation and outstanding device checks.

## Development level access

Expo/React Native `__DEV__` automatically opens every chapter and all 42 levels in the level map for development (including normal Expo Go sessions). Release builds, including EAS preview APKs and production builds, retain the regular one-star prerequisite. This bypass changes selection only; it does not grant stars or write unlock flags to saved progress. Expo Go started with production JS mode (`--no-dev`) follows the release restriction as well.

## iOS ads without an ATT request

`plugins/withNonTrackingAds.cjs` removes `NSUserTrackingUsageDescription` during every prebuild and applies Google native publisher-first-party-ID and personalization opt-outs before React startup. The JS setter in the installed ads library is a stub and is deliberately not used. Non-personalized ad requests and UMP consent checks remain enabled. Disable the AdMob IDFA message for the iOS app, rebuild, verify the final IPA and update App Privacy from actual SDK practices; removing an ATT key is not a no-data-collection certification. See `docs/qa/ios-ad-privacy.md`.

## Chapter soundtracks

Seven original synthesized wuxia-inspired scores switch automatically with the visible chapter, with separate suona-like, erhu-like, pipa-like, guqin/xiao, low-string, sheng/dizi and final-duel arrangements. Each has its own explicit melody, meter, tempo and accompaniment. These are synthetic approximations of instruments, not live performances. Music reuses a single native player, changes only at chapter boundaries and honors music mute, background and rewarded-ad pause. AAC assets total about 4 MB, with no runtime synthesis. See `assets/audio/music/README.md`; regenerate via `npm run generate:music`.
