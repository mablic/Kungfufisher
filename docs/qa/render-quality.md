# Artwork clarity and rendering budget

The previous Android minimal preset divided Canvas dimensions by 1.75 and
scaled the resulting surface back up. A 1080px-wide display therefore rendered
the scene at roughly 617px. Effects quality also changed surface dimensions.

The scene now uses min(native display width, 900) physical pixels, independently
of the effects budget. Devices with at least 720 physical pixels across retain
at least 720; lower-resolution displays remain native. Logical coordinates,
Canvas visible dimensions, HUD and hit testing are unchanged. This is a surface
resolution target, not a claim that every source texture has 900px of detail.
Several existing chapter paintings are 720x1280; enlarging them would not add
real detail, so source assets are preserved.

Background, character layers and fish atlases explicitly use linear filtering.
Both platforms begin with balanced decorations and can drop to minimal under
sustained frame pressure, then recover slowly. Resolution no longer changes
during those transitions. Full decorative particles remain disabled in normal
play. The broad blurred wave crest is now also omitted in balanced/minimal;
the sharp crest and gameplay wave motion remain visible. Existing combined
multi-catch feedback and bounded simulation work remain in place.

Verification: TypeScript and 17 focused resolution, skill/effect-budget and
worklet dependency tests passed. The resolution checks cover 720px, Pixel-class,
iPhone-class and tablet displays, plus low-density displays. A production
Android Hermes export also passed (1,657 modules, 44 assets). No physical-device GPU/FPS measurement
was performed for this change. Compare release builds on Pixel 8 and iPhone 13,
including heavy rain/fog and screen-wide multi-fish skills, before claiming a
measured 60fps guarantee.

This supersedes the surface-resolution/platform-ceiling descriptions in older
`admob-and-android.md` and `recovery-and-42-levels.md` reports.
