import { impactPriority, nextImpactGate } from "./impactFeedback";
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from "expo-audio";

import { createChapterMusic } from "./chapterMusic";

const CHAPTER_MUSIC = [
  require("../assets/audio/music/mistwood.m4a"),
  require("../assets/audio/music/reeds.m4a"),
  require("../assets/audio/music/rain.m4a"),
  require("../assets/audio/music/moon.m4a"),
  require("../assets/audio/music/gorge.m4a"),
  require("../assets/audio/music/jade.m4a"),
  require("../assets/audio/music/tempest.m4a"),
] as const;
const chapterMusic = createChapterMusic(CHAPTER_MUSIC, (source) =>
  createAudioPlayer(source, { updateInterval: 1000 }),
);

const SOURCES = {
  cast: require("../assets/audio/cast.wav"),
  full: require("../assets/audio/full.wav"),
  hit0: require("../assets/audio/hit-0.wav"),
  hit1: require("../assets/audio/hit-1.wav"),
  hit2: require("../assets/audio/hit-2.wav"),
  hit3: require("../assets/audio/hit-3.wav"),
  hit4: require("../assets/audio/hit-4.wav"),
  chip: require("../assets/audio/chip.wav"),
  heavy: require("../assets/audio/heavy.wav"),
  rare: require("../assets/audio/rare.wav"),
  miss: require("../assets/audio/miss.wav"),
  clear: require("../assets/audio/clear.wav"),
  win: require("../assets/audio/win.wav"),
  fail: require("../assets/audio/fail.wav"),
  tick: require("../assets/audio/tick.wav"),
  star: require("../assets/audio/star.wav"),
} as const;
export type Sound = keyof typeof SOURCES;
const VOLUME: Partial<Record<Sound, number>> = {
  cast: 0.5,
  full: 0.55,
  miss: 0.6,
  tick: 0.6,
  chip: 0.8,
};

let lastImpact = {at: -Infinity, priority: 0};
const playbackVersion = new WeakMap<AudioPlayer, number>();

const pools = new Map<Sound, { players: AudioPlayer[]; next: number }>();
let soundOn = true,
  active = true,
  ready = false,
  adPaused = false;

function pool(name: Sound) {
  let entry = pools.get(name);
  if (!entry) {
    const size = name === "cast" || name === "miss" ? 2 : 1;
    entry = {
      players: Array.from({ length: size }, () =>
        createAudioPlayer(SOURCES[name]),
      ),
      next: 0,
    };
    pools.set(name, entry);
  }
  return entry;
}
export function initAudio() {
  if (ready) return;
  ready = true;
  // Respect the silent switch and let the player's own music keep playing.
  setAudioModeAsync({
    playsInSilentMode: false,
    interruptionMode: "mixWithOthers",
  }).catch(() => {});
  try {
    (Object.keys(SOURCES) as Sound[]).forEach(pool);
  } catch {}
  chapterMusic.initialize();
}
export function playSound(name: Sound) {
  if (!soundOn || !active || adPaused) return;
  const priority = impactPriority(name);
  if (priority > 0) {
    const next = nextImpactGate(lastImpact, Date.now(), priority);
    if (!next) return;
    lastImpact = next;
  }
  try {
    const entry = pool(name),
      player = entry.players[entry.next];
    entry.next = (entry.next + 1) % entry.players.length;
    player.volume = VOLUME[name] ?? 1;
    const version = (playbackVersion.get(player) ?? 0) + 1;
    playbackVersion.set(player, version);
    void player.seekTo(0).then(() => {
      if (soundOn && active && !adPaused && pools.get(name) === entry &&
          playbackVersion.get(player) === version) player.play();
    }).catch(() => {});
  } catch {}
}
export function setAudioPreferences(sound: boolean, musicEnabled: boolean) {
  soundOn = sound;
  chapterMusic.setEnabled(musicEnabled);
}
export function setAudioActive(isActive: boolean) {
  active = isActive;
  chapterMusic.setActive(isActive);
}

export function setAdAudioPaused(paused: boolean) {
  adPaused = paused;
  if (paused)
    for (const { players } of pools.values())
      for (const player of players) {
        try {
          player.pause();
        } catch {}
      }
  chapterMusic.setAdPaused(paused);
}

export function setMusicChapter(chapter: number) {
  chapterMusic.setChapter(chapter);
}

export function disposeAudio() {
  chapterMusic.dispose();
  for (const { players } of pools.values())
    for (const player of players) {
      try {
        player.remove();
      } catch {}
    }
  pools.clear();
  ready = false;
  lastImpact = {at: -Infinity, priority: 0};
}
