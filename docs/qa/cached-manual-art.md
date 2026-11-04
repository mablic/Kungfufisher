# Cached wuxia artwork optimization

- Manual cover, weave, page edges, stitching, emblem, contact shadow, ripple and label are rasterized once per technique using a CPU Skia surface. Eight shared 192 × 216 RGBA images use about 1.27 MiB before renderer overhead; repeated Ocean mounts reuse them.
- Each live pickup renders one image and updates one combined position/bob/rotation transform. A simple vector fallback remains available if surface allocation fails. Expiry opacity still follows game time and pauses with the simulation.
- Render three pickup slots, matching the simulator's maximum, rather than four.
- Combo badge reuses a rasterized native layer during its brief scale animation; opaque parchment avoids blending the entire panel over the game. It remains memoized and unmounts when the combo ends.
- No game resolution, hitbox, scoring, skill duration, spawn or timing changes. Existing 720–900px phone rendering policy is retained.

Validation: TypeScript; skill/combo/aim/resolution/worklet and projectile stress tests; Android/iOS production JS exports. See task report for completion. No physical device FPS measurement or native sprite rendering check performed here. Compare the same scene on an installed Release build, including all eight manuals, pickup expiry, pause/resume and repeated school catches. Frame profiling is available with EXPO_PUBLIC_PROFILE_GAME=true in a development build; it is diagnostic, not Release performance evidence.
