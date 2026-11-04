export type MusicPlayer<Source> = {
  loop: boolean;
  volume: number;
  play(): void;
  pause(): void;
  replace(source: Source): void;
  remove(): void;
};

// One native player, one selected asset; no per-frame timers or decoded-track pool.
export function createChapterMusic<Source>(
  sources: readonly Source[],
  create: (source: Source) => MusicPlayer<Source>,
) {
  let player: MusicPlayer<Source> | null = null;
  let chapter = 0,
    loadedChapter = -1;
  let ready = false,
    enabled = true,
    active = true,
    adPaused = false;
  function sync() {
    if (!ready) return;
    try {
      if (!enabled || !active || adPaused) {
        player?.pause();
        return;
      }
      if (!player) {
        player = create(sources[chapter]);
        loadedChapter = chapter;
      } else if (loadedChapter !== chapter) {
        player.pause();
        player.replace(sources[chapter]);
        loadedChapter = chapter;
      }
      player.loop = true;
      player.volume = 0.3;
      player.play();
    } catch {
      /* Missing audio must never stop the game. A later sync can retry. */
    }
  }
  return {
    initialize() {
      ready = true;
      sync();
    },
    setChapter(value: number) {
      const next =
        Number.isInteger(value) && value >= 0 && value < sources.length
          ? value
          : 0;
      if (chapter === next) return;
      chapter = next;
      sync();
    },
    setEnabled(value: boolean) {
      enabled = value;
      sync();
    },
    setActive(value: boolean) {
      active = value;
      sync();
    },
    setAdPaused(value: boolean) {
      adPaused = value;
      sync();
    },
    dispose() {
      ready = false;
      try {
        player?.pause();
        player?.remove();
      } catch {}
      player = null;
      loadedChapter = -1;
    },
  };
}
