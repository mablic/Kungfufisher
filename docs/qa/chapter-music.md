# Chapter music — 2026-10-23

Seven deterministic original synthesized wuxia-inspired compositions, one per chapter, are bundled as stereo AAC M4A. Total audio size: 4,223,191 bytes. Each 16-bar score has its own melody, scale, tempo, lead voice and percussion pattern. Source and instrumentation notes are in `scripts/generate-theme-music.ts` and `assets/audio/music/README.md`. No third-party sample or runtime music generation service is required.

Runtime: one native music player, 1-second status-update interval, reused via replace() only when the visible chapter changes. No seven-player pool or audio work in the simulation frame callback. Mute/background/ad state jointly gates playback; selecting a chapter while paused for these reasons defers the source replacement until allowed. The player's resources and existing SFX pools are released on app unmount. Initial preferences are applied before music initialization, preventing a muted save from briefly playing music.

Validation: 74 tests passed including five chapter music tests covering same-chapter persistence, one-player reuse, mute/deferred switching, background/ad interactions, resource disposal and asset coverage for seven chapters. TypeScript and iOS/Android Hermes exports passed. All seven AAC files were decoded with ffmpeg; every sample was finite, decoded peaks ranged from 0.565 to 0.709 (below digital clipping). These automated checks do not establish musical quality, physical-device FPS, native loop continuity or audio-focus behavior.

Physical checks: listen through one loop per chapter; check that music stays below hit cues, switching chapters changes score and remaining within a chapter does not restart it. Check saved Music=off, silent switch, background/foreground, interruptions, and rewarded-ad close in installed iOS/Android builds. Expo Go can test chapter playback but cannot validate native AdMob transitions.

`store/chapter-music-preview.m4a`: 56-second listening reel, in chapter order (8 seconds each), separate from shipped assets and excluded from EAS uploads.

## Heroic revision

Replaced all seven scores after feedback that the original arrangement lacked power. New tempos 88–124 BPM; layered ensemble voices, low strings, drum rolls and gongs; distinct melodies retained per chapter. One native player and gameplay volume are unchanged. New compressed size: 3,464,089 bytes. All seven files decoded successfully; finite samples, decoded peaks [0.665, 0.66, 0.651, 0.666, 0.669, 0.682, 0.657], no clipping. New 56-second preview: `store/chapter-music-heroic-preview.m4a`. Musical approval and physical-device listening remain user acceptance checks.

## Independent arrangements, revision 3

Replaced the shared harmony/accompaniment generator with seven score-specific functions and explicit pitch/rest/duration sequences. Instrument roles: suona-like lead; pipa/dizi; solo erhu-like lead with slides; guqin/xiao dialogue; low strings/war drums; sheng/dizi; final reed/bow responses. Meters include 4/4, 6/8, 3/4 and 5/4. No live samples or authentic-instrument claim is made.

Six focused tests passed, including a check against identical transposed opening note/duration signatures; this is a structural regression guard, not a perceptual quality test. Both platform production exports passed. Total compressed size 4,011,809 bytes. All seven AAC files decoded with finite samples and peaks below clipping: [{"file": "mistwood.m4a", "peak": 0.652, "lead": "suona", "meter": "4/4"}, {"file": "reeds.m4a", "peak": 0.717, "lead": "pipa", "meter": "6/8"}, {"file": "rain.m4a", "peak": 0.516, "lead": "erhu", "meter": "4/4"}, {"file": "moon.m4a", "peak": 0.82, "lead": "guqin + xiao", "meter": "3/4"}, {"file": "gorge.m4a", "peak": 0.685, "lead": "low strings + war drums", "meter": "5/4"}, {"file": "jade.m4a", "peak": 0.375, "lead": "sheng + dizi", "meter": "6/8"}, {"file": "tempest.m4a", "peak": 0.664, "lead": "suona / erhu call and response", "meter": "4/4"}]

Individual 12-second previews: `store/music-v3-suona.m4a`, `store/music-v3-erhu.m4a`, `store/music-v3-pipa.m4a`. Seven-theme reel: `store/chapter-music-independent-preview.m4a`. Physical-device listening, native seams and user musical acceptance remain unverified.
