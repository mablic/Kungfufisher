# Independent scene scores — revision 3

The previous versions reused one accompaniment/harmony template too heavily. This revision replaces that design with seven separate score-writing functions, explicit MIDI melodies and rests, different meters and different instrumental roles. The renderer is shared; the arrangements are not.

All instruments are synthetic approximations, NOT live/sampled suona, erhu, pipa, guqin or sheng recordings. There is no music-generation service or sampled-instrument library in this project. These assets must not be presented as authentic instrumental performances. No third-party melody or recording is used.

- Mistwood Creek: 大旗入江湖 / Banner of the Jianghu. Suona-like monophonic reed fanfare, 4/4 at 96 BPM. Sparse downbeat war drums and sustained fifths. No fast plucked accompaniment.
- Reed Marsh: 芦荡飞燕 / Swallows through Reeds. Short-decay pipa-like runs and dizi responses, 6/8 at 88 quarter notes/minute. Woodblocks; no string pad or war-drum bed.
- Rain River: 雨落孤城 / Rain over the Lonely City. Exposed erhu-like solo with slides and delayed vibrato, 4/4 at 68 BPM. Sparse low qin; no repeating drum pattern or gong.
- Moonlit Lake: 月下问剑 / A Sword beneath the Moon. Guqin-like plucked phrases alternate with breathy xiao replies, 3/4 at 72 BPM. Silence and isolated notes; no battle percussion.
- Storm Gorge: 峡关破阵 / Breaking the Gorge Gate. Low string riff and asymmetric war drums, 5/4 at 112 BPM. No reed fanfare or flowing pluck bed.
- Jade Estuary: 碧海凌云 / Above the Jade Sea. Sustained sheng-like harmony under soaring dizi, 6/8 at 86 quarter notes/minute. Broad phrases and restrained drums.
- Tempest Reach: 决战天涯 / Duel at the Edge of the World. New two-bar suona/erhu call-and-response melody, 4/4 at 124 BPM. Fast plucks and end-of-phrase drum answers.

These descriptions document compositional intent, not proof of musical quality. Listener acceptance is required. Manifest contains meter, lead, arrangement and note-event signatures for comparison. No runtime synthesis or additional native player has been introduced; AAC assets still use the existing single-player chapter switcher.

Regenerate: `npm run generate:music` (Node and ffmpeg).

Previews outside runtime assets:
- `store/music-v3-suona.m4a`, `store/music-v3-erhu.m4a`, `store/music-v3-pipa.m4a`: isolated 12-second excerpts for direct comparison.
- `store/chapter-music-independent-preview.m4a`: all seven in chapter order, eight seconds each.

Reload the app to replace a currently playing cached earlier soundtrack. Test native loop seams, volume and audio focus on physical devices before release.
