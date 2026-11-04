// Seven separately arranged original scores. Shared synthesis, NOT a shared score.
// All timbres are synthetic approximations, not sampled/live Chinese instruments.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
const RATE = 32000,
  OUT = path.join(import.meta.dirname, "../assets/audio/music");
const TEMP = fs.mkdtempSync(path.join(os.tmpdir(), "kff-independent-scores-"));
type Instrument =
  | "suona"
  | "erhu"
  | "pipa"
  | "guqin"
  | "dizi"
  | "xiao"
  | "sheng"
  | "strings";
type Note = readonly [number | null, number];
type Score = {
  file: string;
  title: string;
  bpm: number;
  meter: string;
  barBeats: number;
  bars: number;
  lead: string;
  arrangement: string;
  seed: number;
  write: (s: Session) => void;
};
let seed = 1;
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}
function hz(n: number) {
  return 440 * 2 ** ((n - 69) / 12);
}
function synth(kind: Instrument, midi: number, seconds: number, from?: number) {
  const out = new Float32Array(Math.ceil(seconds * RATE)),
    f = hz(midi);
  if (kind === "pipa" || kind === "guqin") {
    const period = Math.max(2, Math.round(RATE / f)),
      ring = new Float32Array(period);
    let last = 0;
    for (let i = 0; i < period; i++) {
      last = last * 0.35 + (random() * 2 - 1) * 0.65;
      ring[i] = last;
    }
    for (let i = 0; i < out.length; i++) {
      const k = i % period,
        t = i / RATE,
        decay = kind === "pipa" ? 0.4965 : 0.4997;
      const value = ring[k];
      ring[k] = (value + ring[(k + 1) % period]) * decay;
      const harmonic =
        kind === "guqin"
          ? Math.sin(2 * Math.PI * f * 2 * t) * Math.exp(-t * 2) * 0.055
          : 0;
      out[i] =
        (value + harmonic) *
        Math.min(1, i / 40) *
        Math.min(1, (out.length - i) / 300);
    }
    return out;
  }
  const harmonicCount =
    kind === "suona" ? 15 : kind === "erhu" ? 12 : kind === "strings" ? 7 : 4;
  const weights = Array.from({ length: harmonicCount }, (_, i) => {
    const h = i + 1,
      frequency = f * h;
    if (kind === "suona")
      return (
        (0.3 +
          1.5 * Math.exp(-Math.pow((frequency - 1400) / 850, 2)) +
          0.6 * Math.exp(-Math.pow((frequency - 2900) / 1100, 2))) /
        h ** 0.72
      );
    if (kind === "erhu")
      return (
        (0.3 +
          Math.exp(-Math.pow((frequency - 900) / 600, 2)) +
          0.45 * Math.exp(-Math.pow((frequency - 1900) / 800, 2))) /
        h ** 1.05
      );
    return 1 / h ** (kind === "strings" ? 1.3 : kind === "sheng" ? 2 : 3);
  });
  let phase = 0,
    phase2 = 0,
    breath = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / RATE,
      u = t / seconds,
      bowed = kind === "erhu",
      reed = kind === "suona";
    const bend =
      from !== undefined && bowed
        ? hz(from) + (f - hz(from)) * Math.min(1, t / 0.15)
        : f;
    const vibrato = bowed
      ? 0.006 * Math.sin(t * 2 * Math.PI * 5.4) * Math.min(1, t * 3)
      : reed
        ? 0.002 * Math.sin(t * 34)
        : 0.001 * Math.sin(t * 28);
    phase += (2 * Math.PI * bend * (1 + vibrato)) / RATE;
    phase2 += (2 * Math.PI * f * 1.004) / RATE;
    const attack = bowed ? 0.12 : reed ? 0.018 : kind === "xiao" ? 0.14 : 0.06;
    const release = bowed ? 0.2 : reed ? 0.075 : 0.12;
    const env =
      Math.min(1, t / attack) *
      Math.min(1, (seconds - t) / release) *
      (0.9 + 0.1 * Math.sin(Math.PI * u));
    let value = 0;
    for (let h = 1; h <= harmonicCount; h++)
      value += Math.sin(phase * h) * weights[h - 1];
    if (kind === "strings")
      value += 0.5 * Math.sin(phase2) + 0.15 * Math.sin(phase2 * 3);
    breath = breath * 0.7 + (random() * 2 - 1) * 0.3;
    if (kind === "xiao" || kind === "dizi")
      value += breath * (kind === "xiao" ? 0.13 : 0.06);
    if (bowed) value += breath * 0.025;
    out[i] = Math.tanh(value * 0.75) * env * 0.42;
  }
  return out;
}
function percussion(kind: "big" | "small" | "wood" | "gong") {
  const duration = kind === "gong" ? 4 : kind === "big" ? 0.9 : 0.28;
  const out = new Float32Array(Math.round(RATE * duration));
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / RATE;
    if (kind === "gong") {
      let value = 0;
      [1, 1.43, 1.92, 2.61, 3.77, 5.12].forEach(
        (ratio, h) =>
          (value +=
            (Math.sin(2 * Math.PI * 132 * ratio * t) / (h + 1)) *
            Math.exp(-t * (1.2 + h * 0.4))),
      );
      out[i] = value * Math.min(1, t * 230) * 0.35;
    } else {
      const base = kind === "big" ? 62 : kind === "small" ? 155 : 850;
      phase += (2 * Math.PI * (base + 70 * Math.exp(-t * 40))) / RATE;
      out[i] =
        (Math.sin(phase) + 0.23 * Math.sin(phase * 1.59)) *
        Math.exp(-t * (kind === "big" ? 6 : kind === "wood" ? 55 : 22)) *
        0.65;
      out[i] += (random() * 2 - 1) * Math.exp(-t * 120) * 0.12;
      out[i] *= Math.min(1, i / 24) * Math.min(1, (out.length - i) / 200);
    }
  }
  return out;
}
class Session {
  readonly dry: Float32Array;
  readonly beat: number;
  readonly notes: {
    instrument: Instrument;
    midi: number;
    at: number;
    duration: number;
  }[] = [];
  readonly score: Score;
  constructor(score: Score) {
    this.score = score;
    this.beat = 60 / score.bpm;
    this.dry = new Float32Array(
      Math.round(score.barBeats * score.bars * this.beat * RATE),
    );
  }
  add(samples: Float32Array, at: number, gain: number) {
    const start = Math.round(at * this.beat * RATE);
    for (let i = 0; i < samples.length; i++)
      this.dry[(start + i) % this.dry.length] += samples[i] * gain;
  }
  n(
    instrument: Instrument,
    midi: number,
    at: number,
    duration: number,
    gain = 0.45,
    from?: number,
  ) {
    this.notes.push({ instrument, midi, at, duration });
    this.add(synth(instrument, midi, duration * this.beat, from), at, gain);
  }
  line(instrument: Instrument, at: number, notes: readonly Note[], gain = 0.5) {
    let prev: number | undefined;
    for (const [pitch, duration] of notes) {
      if (pitch !== null) {
        this.n(instrument, pitch, at, duration * 0.95, gain, prev);
        prev = pitch;
      }
      at += duration;
    }
  }
  drum(kind: "big" | "small" | "wood" | "gong", at: number, gain = 0.4) {
    this.add(percussion(kind), at, gain);
  }
}
// Explicit MIDI melodies, rests and lengths; no universal pentatonic-note walker.
const suonaA: Note[] = [
  [62, 1.5],
  [69, 0.5],
  [74, 1],
  [72, 1],
  [69, 2],
  [null, 1],
  [67, 1],
  [69, 1],
  [74, 1],
  [77, 1],
  [76, 0.5],
  [74, 0.5],
  [72, 1],
  [69, 2],
  [62, 1],
];
const suonaB: Note[] = [
  [65, 1],
  [67, 1],
  [69, 2],
  [74, 1.5],
  [72, 0.5],
  [69, 2],
  [67, 0.5],
  [65, 0.5],
  [62, 1],
  [64, 1],
  [65, 1],
  [62, 3],
  [null, 1],
];
const erhuA: Note[] = [
  [71, 3],
  [69, 1],
  [66, 2],
  [64, 1],
  [62, 1],
  [64, 3],
  [66, 1],
  [69, 2],
  [66, 1],
  [64, 1],
];
const erhuB: Note[] = [
  [62, 2],
  [59, 2],
  [61, 1],
  [62, 1],
  [66, 2],
  [64, 3],
  [62, 1],
  [59, 3],
  [null, 1],
];
const scores: Score[] = [
  {
    file: "mistwood",
    title: "大旗入江湖 · Banner of the Jianghu",
    bpm: 96,
    meter: "4/4",
    barBeats: 4,
    bars: 16,
    lead: "suona",
    arrangement:
      "Solo reed fanfare; sparse downbeat war drums and sustained fifths",
    seed: 10101,
    write(s) {
      for (let phrase = 0; phrase < 4; phrase++)
        s.line("suona", phrase * 16, phrase % 2 ? suonaB : suonaA, 0.7);
      for (let b = 0; b < 16; b++) {
        const at = b * 4,
          root = [50, 50, 53, 48][Math.floor(b / 2) % 4];
        s.n("sheng", root, at, 3.8, 0.14);
        s.n("sheng", root + 7, at, 3.8, 0.08);
        s.drum("big", at, 0.7);
        if (b % 2 === 1) s.drum("small", at + 3, 0.25);
        if (b % 8 === 0) s.drum("gong", at, 0.3);
      }
    },
  },
  {
    file: "reeds",
    title: "芦荡飞燕 · Swallows through Reeds",
    bpm: 88,
    meter: "6/8",
    barBeats: 3,
    bars: 24,
    lead: "pipa",
    arrangement:
      "Compound-meter pipa runs with short dizi responses and woodblocks; no sustained strings",
    seed: 10202,
    write(s) {
      const runs = [
        [74, 76, 79, 81, 79, 76],
        [72, 74, 76, 79, 76, 74],
        [69, 72, 74, 76, 74, 72],
        [67, 69, 72, 74, 72, 69],
      ];
      for (let b = 0; b < 24; b++) {
        const at = b * 3,
          p = runs[b % 4];
        for (let k = 0; k < 6; k++)
          s.n("pipa", p[k], at + k * 0.5, 0.65, k === 0 ? 0.9 : 0.65);
        s.n("pipa", [50, 48, 45, 43][b % 4], at, 1.6, 0.6);
        s.drum("wood", at, 0.24);
        s.drum("wood", at + 1.5, 0.15);
        if (b % 4 === 3)
          s.line(
            "dizi",
            at,
            [
              [79, 1],
              [76, 0.5],
              [74, 0.5],
              [72, 1],
            ],
            0.3,
          );
      }
    },
  },
  {
    file: "rain",
    title: "雨落孤城 · Rain over the Lonely City",
    bpm: 68,
    meter: "4/4",
    barBeats: 4,
    bars: 12,
    lead: "erhu",
    arrangement:
      "Exposed solo bowed voice with slides, long rests and sparse dark qin; no drum ostinato or gong",
    seed: 10303,
    write(s) {
      s.line("erhu", 0, erhuA, 0.78);
      s.line("erhu", 16, erhuB, 0.78);
      s.line(
        "erhu",
        32,
        [
          [66, 4],
          [69, 2],
          [71, 2],
          [69, 3],
          [66, 1],
          [64, 2],
          [59, 2],
        ],
        0.78,
      );
      for (let b = 0; b < 12; b++) {
        const at = b * 4,
          r = [47, 43, 45, 47][b % 4];
        s.n("guqin", r, at, 4, 0.45);
        if (b % 3 === 1) s.n("guqin", r + 7, at + 2.5, 2.8, 0.24);
      }
    },
  },
  {
    file: "moon",
    title: "月下问剑 · A Sword beneath the Moon",
    bpm: 72,
    meter: "3/4",
    barBeats: 3,
    bars: 24,
    lead: "guqin + xiao",
    arrangement:
      "Three-beat guqin/xiao dialogue, isolated harmonics and silence; no battle percussion",
    seed: 10404,
    write(s) {
      const qin: Note[] = [
        [45, 1],
        [57, 0.5],
        [52, 0.5],
        [null, 1],
        [48, 1.5],
        [55, 0.5],
        [60, 1],
        [52, 1],
        [50, 1],
        [45, 1],
        [null, 1],
        [57, 1],
        [52, 1],
      ];
      for (let block = 0; block < 6; block++) {
        const at = block * 12;
        if (block % 2 === 0) s.line("guqin", at, qin, 0.95);
        else
          s.line(
            "xiao",
            at,
            [
              [64, 2],
              [62, 1],
              [57, 3],
              [60, 1.5],
              [62, 1.5],
              [57, 2],
              [null, 1],
            ],
            0.6,
          );
        s.n("guqin", 45, at, 5, 0.35);
      }
    },
  },
  {
    file: "gorge",
    title: "峡关破阵 · Breaking the Gorge Gate",
    bpm: 112,
    meter: "5/4",
    barBeats: 5,
    bars: 16,
    lead: "low strings + war drums",
    arrangement:
      "Asymmetric five-beat low-string march and tom replies; no reed fanfare or flowing pluck bed",
    seed: 10505,
    write(s) {
      const riff = [43, 43, 50, 46, 48, 43, 41, 43];
      for (let b = 0; b < 16; b++) {
        const at = b * 5;
        for (let k = 0; k < 8; k++)
          s.n("strings", riff[(k + (b % 2)) % 8], at + k * 0.5, 0.42, 0.6);
        s.n("strings", [55, 58, 60, 53][b % 4], at + 4, 0.85, 0.5);
        for (const p of [0, 1.5, 3, 4])
          s.drum(p === 0 ? "big" : "small", at + p, p === 0 ? 0.9 : 0.45);
        if (b % 4 === 3) {
          s.drum("big", at + 4.5, 0.5);
          s.drum("gong", at + 4, 0.18);
        }
      }
    },
  },
  {
    file: "jade",
    title: "碧海凌云 · Above the Jade Sea",
    bpm: 86,
    meter: "6/8",
    barBeats: 3,
    bars: 24,
    lead: "sheng + dizi",
    arrangement:
      "Broad sustained reed-organ harmony under a soaring flute in compound meter; restrained low drum",
    seed: 10606,
    write(s) {
      const flute: Note[] = [
        [72, 1.5],
        [79, 1.5],
        [81, 3],
        [79, 1],
        [76, 0.5],
        [74, 1.5],
        [72, 2],
        [null, 1],
        [76, 1.5],
        [79, 1.5],
        [84, 3],
        [81, 1.5],
        [79, 1.5],
        [76, 2],
        [72, 1],
      ];
      for (let p = 0; p < 3; p++) s.line("dizi", p * 24, flute, 0.65);
      for (let b = 0; b < 24; b += 2) {
        const at = b * 3,
          r = [48, 53, 55, 48][Math.floor(b / 2) % 4];
        s.n("sheng", r, at, 5.7, 0.25);
        s.n("sheng", r + 7, at, 5.7, 0.15);
        s.n("sheng", r + 12, at, 5.7, 0.07);
        s.drum("big", at, 0.3);
      }
    },
  },
  {
    file: "tempest",
    title: "决战天涯 · Duel at the Edge of the World",
    bpm: 124,
    meter: "4/4",
    barBeats: 4,
    bars: 16,
    lead: "suona / erhu call and response",
    arrangement:
      "Two-bar reed/bow exchanges, guzheng-like pluck tremolo and accelerating drum answers",
    seed: 10707,
    write(s) {
      const call: Note[] = [
        [69, 0.5],
        [72, 0.5],
        [74, 1],
        [81, 1],
        [79, 0.5],
        [77, 0.5],
        [74, 1.5],
        [72, 0.5],
        [69, 1],
        [null, 1],
      ];
      const answer: Note[] = [
        [76, 1.5],
        [74, 0.5],
        [72, 1],
        [69, 1],
        [67, 0.5],
        [69, 0.5],
        [72, 1],
        [74, 2],
      ];
      for (let p = 0; p < 4; p++) {
        s.line("suona", p * 16, call, 0.66);
        s.line("erhu", p * 16 + 8, answer, 0.72);
      }
      for (let b = 0; b < 16; b++) {
        const at = b * 4,
          root = [45, 48, 43, 45][b % 4];
        for (let k = 0; k < 8; k++)
          s.n("pipa", root + [12, 19, 24, 19][k % 4], at + k * 0.5, 0.65, 0.4);
        s.drum("big", at, 0.75);
        s.drum("small", at + 1.75, 0.4);
        s.drum("big", at + 2.5, 0.45);
        if (b % 4 === 3)
          for (let k = 0; k < 4; k++)
            s.drum("small", at + 3 + k * 0.25, 0.2 + k * 0.08);
        if (b === 0 || b === 8) s.drum("gong", at, 0.35);
      }
    },
  },
];
function wav(filename: string, left: Float32Array, right: Float32Array) {
  const b = Buffer.alloc(44 + left.length * 4);
  b.write("RIFF");
  b.writeUInt32LE(b.length - 8, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(2, 22);
  b.writeUInt32LE(RATE, 24);
  b.writeUInt32LE(RATE * 4, 28);
  b.writeUInt16LE(4, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(left.length * 4, 40);
  for (let i = 0; i < left.length; i++) {
    b.writeInt16LE(
      Math.round(Math.max(-1, Math.min(1, left[i])) * 32767),
      44 + i * 4,
    );
    b.writeInt16LE(
      Math.round(Math.max(-1, Math.min(1, right[i])) * 32767),
      46 + i * 4,
    );
  }
  fs.writeFileSync(filename, b);
}
const manifest: object[] = [];
try {
  fs.mkdirSync(OUT, { recursive: true });
  for (const score of scores) {
    seed = score.seed;
    const s = new Session(score);
    score.write(s);
    const dry = s.dry,
      left = new Float32Array(dry.length),
      right = new Float32Array(dry.length);
    let peak = 0,
      square = 0;
    for (let i = 0; i < dry.length; i++) {
      const lag = (ms: number) =>
        dry[(i - Math.round((ms * RATE) / 1000) + dry.length) % dry.length];
      left[i] = dry[i] * 0.88 + lag(173) * 0.1 + lag(443) * 0.06;
      right[i] = dry[i] * 0.88 + lag(223) * 0.1 + lag(521) * 0.06;
      peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
      square += (left[i] ** 2 + right[i] ** 2) / 2;
    }
    const rms = Math.sqrt(square / dry.length),
      gain = Math.min(0.68 / peak, 0.12 / rms);
    for (let i = 0; i < dry.length; i++) {
      left[i] *= gain;
      right[i] *= gain;
    }
    const input = path.join(TEMP, score.file + ".wav"),
      output = path.join(OUT, score.file + ".m4a");
    wav(input, left, right);
    execFileSync("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      input,
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      "-movflags",
      "+faststart",
      "-metadata",
      `title=${score.title}`,
      output,
    ]);
    manifest.push({
      chapter: manifest.length,
      file: score.file + ".m4a",
      title: score.title,
      bpm: score.bpm,
      meter: score.meter,
      lead: score.lead,
      arrangement: score.arrangement,
      seconds: dry.length / RATE,
      bytes: fs.statSync(output).size,
      peak: peak * gain,
      rms: rms * gain,
      melodySignature: s.notes
        .slice(0, 16)
        .map((n) => [n.midi, n.at, n.duration]),
    });
    console.log(
      score.file,
      score.lead,
      score.meter,
      (dry.length / RATE).toFixed(2) + "s",
    );
  }
  fs.writeFileSync(
    path.join(OUT, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
} finally {
  fs.rmSync(TEMP, { recursive: true, force: true });
}
