import { test } from "node:test";
import assert from "node:assert/strict";
import { createChapterMusic, type MusicPlayer } from "../src/chapterMusic.ts";
import { CHAPTERS } from "../src/levels.ts";
import fs from "node:fs";
function fixture() {
  const calls: string[] = [];
  let created = 0;
  const player: MusicPlayer<string> = {
    loop: false,
    volume: 0,
    play() {
      calls.push("play");
    },
    pause() {
      calls.push("pause");
    },
    replace(source) {
      calls.push(`replace:${source}`);
    },
    remove() {
      calls.push("remove");
    },
  };
  const music = createChapterMusic(["creek", "reeds", "rain"], (source) => {
    created++;
    calls.push(`create:${source}`);
    return player;
  });
  return { music, calls, player, created: () => created };
}
test("music switches themes on one player and does not restart within a chapter", () => {
  const f = fixture();
  f.music.initialize();
  assert.equal(f.created(), 1);
  assert.equal(f.player.loop, true);
  assert.equal(f.player.volume, 0.3);
  const n = f.calls.length;
  f.music.setChapter(0);
  assert.equal(f.calls.length, n);
  f.music.setChapter(2);
  assert.equal(f.created(), 1);
  assert.deepEqual(f.calls.slice(-3), ["pause", "replace:rain", "play"]);
});
test("muted music defers source work, then resumes the selected chapter", () => {
  const f = fixture();
  f.music.setEnabled(false);
  f.music.initialize();
  f.music.setChapter(2);
  assert.equal(f.created(), 0);
  f.music.setEnabled(true);
  assert.deepEqual(f.calls, ["create:rain", "play"]);
  f.music.setEnabled(false);
  f.music.setChapter(1);
  assert.equal(f.calls.includes("replace:reeds"), false);
  f.music.setEnabled(true);
  assert.deepEqual(f.calls.slice(-3), ["pause", "replace:reeds", "play"]);
});
test("ad close never resumes music while backgrounded or disabled", () => {
  const f = fixture();
  f.music.initialize();
  f.music.setAdPaused(true);
  f.music.setActive(false);
  f.music.setChapter(1);
  f.music.setAdPaused(false);
  assert.equal(f.calls.at(-1), "pause");
  f.music.setActive(true);
  assert.deepEqual(f.calls.slice(-3), ["pause", "replace:reeds", "play"]);
  f.music.setEnabled(false);
  f.music.setAdPaused(true);
  f.music.setAdPaused(false);
  assert.equal(f.calls.at(-1), "pause");
});
test("invalid chapter falls back safely; disposing releases native resources", () => {
  const f = fixture();
  f.music.setChapter(1);
  f.music.initialize();
  f.music.setChapter(NaN);
  assert.ok(f.calls.includes("replace:creek"));
  f.music.dispose();
  assert.deepEqual(f.calls.slice(-2), ["pause", "remove"]);
  const n = f.calls.length;
  f.music.setChapter(2);
  assert.equal(f.calls.length, n);
});
test("every campaign chapter has a distinct bundled composition", () => {
  const entries = JSON.parse(
    fs.readFileSync(
      new URL("../assets/audio/music/manifest.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(entries.length, CHAPTERS.length);
  assert.equal(new Set(entries.map((e: any) => e.file)).size, CHAPTERS.length);
  for (const [chapter, entry] of entries.entries()) {
    assert.equal(entry.chapter, chapter);
    assert.ok(entry.seconds >= 30);
    assert.ok(entry.seconds <= 70);
    assert.ok(entry.peak <= 0.7 && entry.rms > 0.01);
    const bytes = fs.readFileSync(
      new URL(`../assets/audio/music/${entry.file}`, import.meta.url),
    );
    assert.equal(bytes.subarray(4, 8).toString(), "ftyp");
    assert.equal(bytes.length, entry.bytes);
  }
});

test("scene scores do not reuse the same transposed opening melody or one meter", () => {
  const entries = JSON.parse(
    fs.readFileSync(
      new URL("../assets/audio/music/manifest.json", import.meta.url),
      "utf8",
    ),
  );
  const signatures = entries.map((entry: any) => {
    assert.ok(entry.melodySignature.length >= 8);
    const first = entry.melodySignature[0][0];
    return JSON.stringify(
      entry.melodySignature
        .slice(0, 8)
        .map((n: number[]) => [n[0] - first, n[2]]),
    );
  });
  assert.equal(new Set(signatures).size, entries.length);
  assert.ok(new Set(entries.map((e: any) => e.meter)).size >= 4);
});
