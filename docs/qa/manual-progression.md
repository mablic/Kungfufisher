# Manual unlocks and progressive difficulty

## Implemented behavior

- All 42 levels and seven scenery chapters remain. Six introductory levels use six fish, no wind/waves, and speeds from .72 to .94. Level 6 now has 75 seconds and lighter mist.
- Eight manuals cannot supply two *new* unlocks for each of seven chapters. The chosen default is four pairs: clear 6 for Twin Swallows / Dragon Lance; clear 18 for River Cleaver / Wind Anchor; clear 30 for Lotus Wheel / Iron Palm; clear 36 for Heavenly Swords / Time Seal. All are unlocked on entering the last chapter.
- Production pools derive from saved completed levels, including existing saves, and are injected at run start. No unearned manuals drop. Previously unlocked manuals remain available in earlier rivers. Development can preview the normal unlock pool appropriate to any selected level; it still permits testing every level.
- Both periodic drifting books and large-fish drops use the same unlock pool. The three-pickup cap and three casts per manual remain.
- Books are 35% larger; the embossed emblem is additionally enlarged 30%. The pickup ellipse grows from 20×25 to 29×33 logical radii. Cached 3× artwork is reused without additional per-frame texture generation.
- New techniques are described in full before the next run. The scrollable briefing supports small screens, explains replacement / three casts, permits reviewing previously read techniques, and shows the next unlock milestone. Chapter completion names the unlocked pair. Field guide lists each unlock level. Starting a run marks the available lessons as seen.
- Post-tutorial speed pressure grows gradually; drifting-book intervals range from 14 to 20 seconds (trials add 2). Fish population and render resolution are unchanged.
- One/two/three-star scores are calibrated per roster with 24 casual and 24 skilled bot runs, then checked with different seeds. Independent checks exposed spikes at levels 20 and 24; their targets were smoothed. Scripts/calibrate-progression.ts and scripts/validate-progression.ts reproduce the sampling. Bots are balance diagnostics, not measured player retention or ad conversions.
- Existing voluntary rewarded +15s continuation remains. Existing free introduction, unavailable-ad handling, and once-per-run limit remain. Nothing forces an ad or promises an ad watching frequency.

## Validation and remaining physical QA

TypeScript, gameplay / skill / progression / continuation / worklet tests, 42-level bot balance, mixed-refresh projectile stress, and Android/iOS production JavaScript exports were run (see task report for final results). Introductory casual-model clears were 24/24 at each of levels 1–6 with the independent seeds.

Physical-device frame rate and native visual checks are still required. Use an installed Release build: test the enlarged cover-edge pickup, read/scroll lessons on a small screen, clear each milestone, restart the app, replay an old river, use all eight techniques, and check rewarded-ad success / failure / resume. No new signed build or store upload was made.
