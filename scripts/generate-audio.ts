// Synthesises every sound in assets/audio so the game ships no third-party audio.
// Run: node --experimental-strip-types scripts/generate-audio.ts
import fs from "node:fs";
import path from "node:path";

const RATE = 22050;
const OUT = path.join(import.meta.dirname, "..", "assets", "audio");

let seed = 20261021;
function noise() {
  seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
  return (seed / 4294967296) * 2 - 1;
}
function buffer(seconds: number) {
  return new Float32Array(Math.ceil(seconds * RATE));
}
function mix(target: Float32Array, source: Float32Array, at = 0, gain = 1) {
  const start = Math.round(at * RATE);
  for (let i = 0; i < source.length; i++) {
    const j = start + i;
    if (j >= 0 && j < target.length) target[j] += source[i] * gain;
  }
}
function mixWrapped(
  target: Float32Array,
  source: Float32Array,
  at: number,
  gain = 1,
) {
  const start = Math.round(at * RATE);
  for (let i = 0; i < source.length; i++)
    target[(start + i) % target.length] += source[i] * gain;
}
function pluck(freq: number, seconds: number, brightness = 0.5, decay = 0.996) {
  const out = buffer(seconds),
    period = Math.max(2, Math.round(RATE / freq)),
    line = new Float32Array(period);
  let last = 0;
  for (let i = 0; i < period; i++) {
    last = last + (noise() - last) * brightness;
    line[i] = last;
  }
  for (let i = 0; i < out.length; i++) {
    const k = i % period,
      next = line[(k + 1) % period];
    out[i] = line[k];
    line[k] = (line[k] + next) * 0.5 * decay;
  }
  // A short pitch-bend-free attack transient gives the guzheng-like pick.
  for (let i = 0; i < Math.min(out.length, 90); i++) out[i] *= i / 90;
  return out;
}
function bell(freq: number, seconds: number) {
  const out = buffer(seconds),
    partials = [
      [1, 1, 1.6],
      [2.76, 0.45, 3.2],
      [5.4, 0.22, 5],
      [8.93, 0.1, 7],
    ];
  for (let i = 0; i < out.length; i++) {
    const t = i / RATE;
    let v = 0;
    for (const [ratio, gain, damp] of partials)
      v +=
        Math.sin(2 * Math.PI * freq * ratio * t) * gain * Math.exp(-t * damp);
    out[i] = v * Math.min(1, t * 400);
  }
  return out;
}
function lowNoise(
  seconds: number,
  cutoff: number,
  envelope: (t: number) => number,
) {
  const out = buffer(seconds),
    a = 1 - Math.exp((-2 * Math.PI * cutoff) / RATE);
  let y = 0;
  for (let i = 0; i < out.length; i++) {
    y += (noise() - y) * a;
    out[i] = y * envelope(i / RATE);
  }
  return out;
}
function sweep(from: number, to: number, seconds: number, gain = 1) {
  const out = buffer(seconds);
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / out.length,
      f = from * Math.pow(to / from, t);
    phase += (2 * Math.PI * f) / RATE;
    out[i] = Math.sin(phase) * gain * Math.sin(Math.PI * Math.min(1, t * 1.15));
  }
  return out;
}
function echo(
  source: Float32Array,
  delay: number,
  feedback: number,
  wet: number,
) {
  const out = Float32Array.from(source),
    d = Math.round(delay * RATE);
  for (let i = d; i < out.length; i++) out[i] += out[i - d] * feedback;
  for (let i = 0; i < out.length; i++)
    out[i] = source[i] * (1 - wet) + out[i] * wet;
  return out;
}
function normalise(data: Float32Array, peak = 0.85) {
  let max = 0;
  for (const v of data) max = Math.max(max, Math.abs(v));
  if (max > 0) for (let i = 0; i < data.length; i++) data[i] *= peak / max;
  return data;
}
function write(name: string, data: Float32Array) {
  const bytes = Buffer.alloc(44 + data.length * 2);
  bytes.write("RIFF", 0);
  bytes.writeUInt32LE(36 + data.length * 2, 4);
  bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(RATE, 24);
  bytes.writeUInt32LE(RATE * 2, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36);
  bytes.writeUInt32LE(data.length * 2, 40);
  data.forEach((v, i) =>
    bytes.writeInt16LE(
      Math.round(Math.max(-1, Math.min(1, v)) * 32767),
      44 + i * 2,
    ),
  );
  fs.writeFileSync(path.join(OUT, name), bytes);
}

// D major pentatonic (gong-shang-jue-zhi-yu), the scale of traditional Chinese melody.
const PENTA = [587.33, 659.25, 739.99, 880, 987.77, 1174.66];

fs.mkdirSync(OUT, { recursive: true });

write(
  "cast.wav",
  normalise(
    lowNoise(0.32, 2600, (t) => Math.sin(Math.PI * Math.min(1, t / 0.32)) ** 2),
    0.55,
  ),
);
{
  const s = buffer(0.12);
  for (let i = 0; i < s.length; i++) {
    const t = i / RATE;
    s[i] =
      (Math.sin(2 * Math.PI * 1250 * t) +
        0.5 * Math.sin(2 * Math.PI * 1890 * t)) *
      Math.exp(-t * 55);
  }
  write("full.wav", normalise(s, 0.6));
}
PENTA.slice(0, 5).forEach((freq, i) => {
  const s = buffer(1.1);
  mix(s, pluck(freq, 1.1, 0.55, 0.997));
  mix(s, pluck(freq * 2, 0.6, 0.4, 0.993), 0, 0.25);
  mix(
    s,
    lowNoise(0.25, 1800, (t) => Math.exp(-t * 18)),
    0,
    0.35,
  );
  write(`hit-${i}.wav`, normalise(s, 0.8));
});
{
  const s = buffer(0.4);
  for (let i = 0; i < s.length; i++) {
    const t = i / RATE;
    s[i] =
      (Math.sin(2 * Math.PI * 2210 * t) * 0.6 +
        Math.sin(2 * Math.PI * 3170 * t) * 0.4 +
        Math.sin(2 * Math.PI * 4420 * t) * 0.25) *
      Math.exp(-t * 14);
  }
  mix(
    s,
    lowNoise(0.05, 5000, (t) => Math.exp(-t * 80)),
    0,
    0.6,
  );
  write("chip.wav", normalise(s, 0.6));
}
{
  const s = buffer(1.8);
  mix(s, bell(1318.5, 1.8));
  mix(s, bell(1760, 1.5), 0.12, 0.7);
  mix(s, bell(2637, 1.2), 0.24, 0.45);
  write("rare.wav", normalise(echo(s, 0.16, 0.35, 0.4), 0.7));
}
{
  const s = buffer(0.45);
  mix(s, sweep(420, 110, 0.16, 1));
  mix(
    s,
    lowNoise(0.4, 900, (t) => Math.exp(-t * 9) * Math.min(1, t * 60)),
    0.03,
    0.6,
  );
  write("miss.wav", normalise(s, 0.5));
}
{
  const s = buffer(1.8);
  [0, 2, 3, 5].forEach((n, i) => mix(s, pluck(PENTA[n], 1.4, 0.55), i * 0.09));
  write("clear.wav", normalise(echo(s, 0.19, 0.3, 0.35), 0.75));
}
{
  const s = buffer(2.6);
  [0, 1, 2, 3, 4, 5].forEach((n, i) =>
    mix(s, pluck(PENTA[n], 1.6, 0.55), i * 0.08),
  );
  mix(s, bell(1174.66, 2), 0.55, 0.6);
  write("win.wav", normalise(echo(s, 0.21, 0.32, 0.35), 0.75));
}
{
  const s = buffer(1.6);
  mix(s, pluck(PENTA[3] / 2, 1.5, 0.35, 0.996));
  mix(s, pluck(PENTA[1] / 2, 1.3, 0.35, 0.995), 0.28);
  write("fail.wav", normalise(echo(s, 0.2, 0.3, 0.3), 0.6));
}
{
  const s = buffer(0.09);
  for (let i = 0; i < s.length; i++) {
    const t = i / RATE;
    s[i] = Math.sin(2 * Math.PI * 820 * t) * Math.exp(-t * 70);
  }
  write("tick.wav", normalise(s, 0.5));
}
write("star.wav", normalise(echo(bell(1760, 1.2), 0.14, 0.25, 0.3), 0.6));

// Seamless ambient loop: river hush, a low drone and sparse pentatonic plucks.
{
  const seconds = 32,
    s = buffer(seconds);
  const river = lowNoise(seconds, 420, () => 1);
  for (let i = 0; i < s.length; i++) {
    const t = i / RATE;
    s[i] += river[i] * (0.32 + 0.08 * Math.sin((2 * Math.PI * t) / 8));
    s[i] +=
      (Math.sin(2 * Math.PI * 146.83 * t) * 0.05 +
        Math.sin(2 * Math.PI * 220 * t) * 0.03) *
      (0.6 + 0.4 * Math.sin((2 * Math.PI * t) / 16));
  }
  const phrase = [3, 2, 0, 1, 2, 4, 3, 2, 5, 3, 2, 1, 0, 2, 3, 1];
  let t = 0.4;
  for (let i = 0; t < seconds - 0.2; i++) {
    const note = PENTA[phrase[i % phrase.length]] / (i % 5 === 3 ? 1 : 2);
    mixWrapped(s, pluck(note, 2.4, 0.4, 0.998), t, 0.22);
    if (i % 4 === 0) mixWrapped(s, pluck(note / 2, 2.4, 0.3, 0.998), t, 0.12);
    t += [1.6, 0.8, 2.4, 1.2][i % 4];
  }
  write("river-loop.wav", normalise(s, 0.55));
}
console.log("Wrote audio to", OUT);

// Keep the newer short impact bank when regenerating all effects.
await import("./generate-impact-audio.ts");
