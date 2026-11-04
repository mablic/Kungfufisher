import type { SkillId } from "./skills.ts";
import { FISH } from "./species.ts";

// One/three stars: calibrate-progression.ts. Two-star gate: calibrate-advancement.ts.
const STARS: [number, number, number][] = [
  [100, 170, 420],
  [160, 250, 540],
  [210, 320, 650],
  [250, 380, 760],
  [290, 440, 850],
  [320, 480, 1060],
  [620, 720, 1710],
  [800, 940, 1990],
  [550, 640, 1430],
  [770, 940, 2190],
  [740, 1040, 2570],
  [670, 820, 1980],
  [680, 790, 1960],
  [670, 780, 1720],
  [630, 730, 1670],
  [530, 690, 2130],
  [600, 700, 1940],
  [870, 1120, 1990],
  [410, 490, 1410],
  [440, 530, 1400],
  [610, 850, 1690],
  [410, 500, 1570],
  [680, 820, 2000],
  [1050, 1210, 2670],
  [560, 660, 1600],
  [640, 760, 2020],
  [730, 940, 1970],
  [630, 750, 1670],
  [790, 1220, 2730],
  [980, 1140, 3390],
  [950, 1380, 3010],
  [880, 1110, 2510],
  [1200, 1400, 2330],
  [1240, 1450, 3540],
  [890, 1140, 2570],
  [1200, 1400, 2810],
  [1440, 1680, 3190],
  [900, 1370, 2990],
  [1280, 1500, 2870],
  [990, 1400, 3430],
  [1720, 2010, 3630],
  [1030, 1840, 3880],
];

export type Weather = "clear" | "mist" | "rain" | "night" | "storm";
export type Mechanic =
  | "basics"
  | "dart"
  | "fry"
  | "flick"
  | "wind"
  | "shift"
  | "iron"
  | "waves"
  | "fog"
  | "dragon"
  | "night"
  | "storm"
  | "turtle"
  | "mandarin"
  | "eel"
  | "puffer"
  | "catfish"
  | "lantern"
  | "sturgeon"
  | "thunder"
  | "shark"
  | "hammerhead"
  | "swordfish"
  | "grouper"
  | "protectedSeaLife";
// An optional per-level challenge. Meeting it while clearing the level earns
// that level's seal, a collectible tracked separately from stars.
export type Seal =
  | { type: "catch"; fish: number; count: number }
  | { type: "combo"; count: number }
  | { type: "golden"; count: number }
  | { type: "steady"; misses: number }
  | { type: "spare" };
export type LevelRules = {
  id: number;
  chapter: number;
  name: string;
  seconds: number;
  manualEvery: number;
  // Set from saved progress at run start; absent in simulations uses level progression.
  manualPool?: readonly SkillId[];
  challenge: boolean;
  // Score for one, two and three stars; one star clears the level.
  stars: readonly [number, number, number];
  roster: readonly number[];
  speed: number;
  wind: number;
  windShift: boolean;
  gust: number;
  waves: number;
  fog: number;
  weather: Weather;
  // Fraction of the wind-bent cast path the aiming line reveals.
  assist: number;
  rareEvery: number;
  // Lightning flashes that briefly clear the fog.
  thunder: boolean;
  intro: Mechanic | null;
  seal: Seal;
};
export const CHAPTERS = [
  { name: "Mistwood Creek", subtitle: "Learn the cast" },
  { name: "Reed Marsh", subtitle: "Restless fish, rising wind" },
  { name: "Rain River", subtitle: "Armour, swell and veil" },
  { name: "Moonlit Lake", subtitle: "Fishing by lantern" },
  { name: "Storm Gorge", subtitle: "Everything at once" },
  { name: "Jade Estuary", subtitle: "Sharks beyond the reeds" },
  { name: "Tempest Reach", subtitle: "Giants under rough water" },
] as const;
export const MECHANICS: Record<Mechanic, { title: string; body: string }> = {
  protectedSeaLife: {
    title: "Red badge means avoid",
    body: "Avoid red badges: seahorse −20, squid −30, turtle −50. Hitting any protected creature breaks your combo.",
  },
  shark: {
    title: "Bull shark",
    body: "Four strikes. Read its turn after each hit. A large catch earns a manual.",
  },
  hammerhead: {
    title: "Hammerhead",
    body: "Five strikes. Lead its fast turns and finish the fish before chasing another.",
  },
  swordfish: {
    title: "Swordfish",
    body: "Three strikes. Hits anywhere along the fish count.",
  },
  grouper: {
    title: "Giant grouper",
    body: "Six strikes. The slow giant rewards a patient chain of hits.",
  },
  basics: {
    title: "The first cast",
    body: "Hold to charge, drag to aim, release to cast. Longer holds reach deeper.",
  },
  dart: {
    title: "Gold dart",
    body: "Fast, with sudden bursts. Aim ahead of it.",
  },
  fry: {
    title: "River fry",
    body: "Small and quick. A narrow target, worth 30.",
  },
  flick: {
    title: "Flick koi",
    body: "Snaps around without warning. Worth 45 if you read the turn.",
  },
  wind: {
    title: "Wind",
    body: "Wind pushes the spear sideways in flight. The dotted line bends to show the drift; the flag shows strength.",
  },
  shift: {
    title: "Shifting wind",
    body: "The wind swings from side to side during the level. Watch the flag before each cast.",
  },
  iron: {
    title: "Iron carp",
    body: "Armoured: three strikes to land it, 90 points. Pips above it show strikes left. Strikes keep your combo alive.",
  },
  waves: {
    title: "Swell",
    body: "Your skiff drifts sideways and rocks with the swell. Stronger swell moves it farther; your cast starts from the moving hand. Time your release.",
  },
  fog: {
    title: "Rain veil",
    body: "The water clouds over. Fish show clearly only near your aim and your spear.",
  },
  dragon: {
    title: "Dragon carp",
    body: "The river king. Five strikes, 250 points, and it flees when struck.",
  },
  night: {
    title: "Night",
    body: "Only the lantern and your aim light the water. Hold to light where you are looking.",
  },
  storm: {
    title: "Storm",
    body: "Shifting wind, heavy swell and dark water, all at once.",
  },
  turtle: {
    title: "River turtle",
    body: "Protected. Striking it costs 50 points and breaks your combo, and it blocks your spear. Aim around it.",
  },
  mandarin: {
    title: "Mandarin fish",
    body: "Lurks almost still, then lunges. Strike while it waits; worth 40.",
  },
  eel: {
    title: "Rice eel",
    body: "Quick and weaving, with sudden dives. The whole fish counts; worth 35.",
  },
  puffer: {
    title: "Puffer",
    body: "The first strike puffs it up, bigger and slower. Strike again to land it for 40.",
  },
  catfish: {
    title: "Whisker catfish",
    body: "Hugs the riverbed and sinks into the mud. Cast long, and cast when it shows; worth 55.",
  },
  lantern: {
    title: "Lantern koi",
    body: "Glows in dark water. Land it and the whole river lights up for a moment.",
  },
  sturgeon: {
    title: "Ancient sturgeon",
    body: "Long, fast and armoured. Four strikes, 140 points.",
  },
  thunder: {
    title: "Thunder",
    body: "Lightning clears the dark water for an instant. Be ready to cast in the flash.",
  },
};

const {
  jade: J,
  koi: K,
  dart: D,
  fry: F,
  flick: L,
  iron: I,
  dragon: R,
  mandarin: M,
  catfish: C,
  puffer: P,
  eel: E,
  turtle: T,
  sturgeon: S,
  lantern: N,
  shark: B,
  hammerhead: H,
  swordfish: W,
  grouper: G,
} = FISH;
type Spec = Partial<Omit<LevelRules, "id" | "chapter" | "name" | "roster">> & {
  name: string;
  roster: number[];
  stars: [number, number, number];
  seal: Seal;
};
const catches = (fish: number, count: number): Seal => ({
  type: "catch",
  fish,
  count,
});
const CHAPTER_DEFAULTS: Partial<LevelRules>[] = [
  { weather: "clear", assist: 1 },
  { weather: "clear", assist: 1 },
  { weather: "rain", assist: 0.8, fog: 0.08 },
  { weather: "night", assist: 0.65, fog: 0.55 },
  { weather: "storm", assist: 0.5, fog: 0.3 },
  { weather: "mist", assist: 0.55, fog: 0.22, wind: 130, waves: 0.4 },
  {
    weather: "storm",
    assist: 0.45,
    fog: 0.4,
    wind: 190,
    gust: 100,
    waves: 0.6,
  },
];
const SPECS: Spec[][] = [
  [
    {
      name: "First Light",
      seconds: 60,
      speed: 0.72,
      roster: [J, J, K, J, K, J],
      stars: STARS[0],
      intro: "basics",
      seal: catches(K, 3),
    },
    {
      name: "Quiet Shallows",
      speed: 0.78,
      roster: [J, K, J, K, D, J],
      stars: STARS[1],
      intro: "dart",
      seal: catches(D, 2),
    },
    {
      name: "Turtle Crossing",
      speed: 0.82,
      roster: [J, K, D, T, J, K],
      stars: STARS[2],
      intro: "turtle",
      seal: { type: "spare" },
    },
    {
      name: "Little Shadows",
      speed: 0.86,
      roster: [J, F, K, J, D, K],
      stars: STARS[3],
      intro: "fry",
      seal: { type: "combo", count: 3 },
    },
    {
      name: "Still Water",
      speed: 0.9,
      roster: [K, M, D, F, J, T],
      stars: STARS[4],
      intro: "mandarin",
      seal: catches(M, 3),
    },
    {
      name: "Mistwood Trial",
      intro: "protectedSeaLife",
      seconds: 75,
      speed: 0.94,
      weather: "mist",
      fog: 0.08,
      roster: [K, FISH.seahorse, D, M, J, T],
      stars: STARS[5],
      seal: { type: "golden", count: 1 },
    },
  ],
  [
    {
      name: "Reed Marsh",
      roster: [J, L, K, J, L, K, D, J],
      stars: STARS[6],
      intro: "flick",
      seal: catches(L, 5),
    },
    {
      name: "Eel Shallows",
      speed: 1.05,
      roster: [K, E, F, E, D, K, L, E],
      stars: STARS[7],
      intro: "eel",
      seal: catches(E, 5),
    },
    {
      name: "First Breeze",
      wind: 120,
      roster: [J, K, D, M, F, J, K, D],
      stars: STARS[8],
      intro: "wind",
      seal: { type: "steady", misses: 5 },
    },
    {
      name: "Crosswind",
      wind: -170,
      gust: 60,
      roster: [K, L, D, F, T, L, E, F],
      stars: STARS[9],
      seal: { type: "combo", count: 6 },
    },
    {
      name: "Turning Wind",
      wind: 150,
      windShift: true,
      speed: 1.1,
      roster: [L, F, L, D, E, F, T, D],
      stars: STARS[10],
      intro: "shift",
      seal: { type: "combo", count: 5 },
    },
    {
      name: "Marsh Trial",
      seconds: 70,
      wind: 200,
      windShift: true,
      gust: 80,
      weather: "mist",
      fog: 0.2,
      speed: 1.15,
      roster: [L, FISH.squid, D, E, F, M, T, L],
      stars: STARS[11],
      seal: { type: "golden", count: 2 },
    },
  ],
  [
    {
      name: "Iron Scales",
      roster: [J, I, K, J, K, I, D, J],
      stars: STARS[12],
      intro: "iron",
      seal: catches(I, 4),
    },
    {
      name: "Puffer Pools",
      wind: 80,
      roster: [P, K, F, P, D, I, F, P],
      stars: STARS[13],
      intro: "puffer",
      seal: catches(P, 3),
    },
    {
      name: "Swell",
      waves: 0.5,
      roster: [K, D, I, E, P, J, F, T],
      stars: STARS[14],
      intro: "waves",
      seal: { type: "steady", misses: 7 },
    },
    {
      name: "Rain Veil",
      fog: 0.45,
      roster: [K, F, D, I, E, F, M, L],
      stars: STARS[15],
      intro: "fog",
      seal: catches(M, 5),
    },
    {
      name: "Downpour",
      waves: 0.6,
      wind: 150,
      fog: 0.4,
      speed: 1.1,
      roster: [L, I, F, D, P, T, F, E],
      stars: STARS[16],
      seal: { type: "combo", count: 4 },
    },
    {
      name: "Dragon Gate",
      seconds: 80,
      waves: 0.4,
      fog: 0.3,
      roster: [R, K, F, D, L, T, F, P],
      stars: STARS[17],
      intro: "dragon",
      seal: catches(R, 3),
    },
  ],
  [
    {
      name: "Moonrise",
      roster: [J, K, D, K, J, D, K, F],
      stars: STARS[18],
      intro: "night",
      seal: { type: "golden", count: 1 },
    },
    {
      name: "Lantern Light",
      fog: 0.6,
      roster: [K, F, D, L, M, F, D, I],
      stars: STARS[19],
      seal: catches(F, 3),
    },
    {
      name: "Mud Whiskers",
      fog: 0.5,
      roster: [C, F, D, C, L, T, E, C],
      stars: STARS[20],
      intro: "catfish",
      seal: catches(C, 4),
    },
    {
      name: "Night Wind",
      fog: 0.6,
      wind: 180,
      windShift: true,
      roster: [K, L, D, F, I, T, E, C],
      stars: STARS[21],
      seal: { type: "combo", count: 3 },
    },
    {
      name: "Black Water",
      fog: 0.72,
      waves: 0.5,
      roster: [N, L, F, D, I, N, P, C],
      stars: STARS[22],
      intro: "lantern",
      seal: catches(N, 4),
    },
    {
      name: "Moon Trial",
      seconds: 80,
      fog: 0.7,
      wind: 200,
      gust: 80,
      waves: 0.5,
      speed: 1.1,
      roster: [R, L, F, D, N, T, C, E],
      stars: STARS[23],
      seal: catches(R, 2),
    },
  ],
  [
    {
      name: "Gorge Mouth",
      wind: 220,
      gust: 100,
      waves: 0.6,
      roster: [K, D, F, L, K, D, F, I],
      stars: STARS[24],
      intro: "storm",
      seal: { type: "combo", count: 5 },
    },
    {
      name: "Spray",
      wind: -260,
      windShift: true,
      gust: 110,
      waves: 0.7,
      fog: 0.35,
      speed: 1.15,
      roster: [L, F, D, E, F, T, I, K],
      stars: STARS[25],
      seal: catches(I, 1),
    },
    {
      name: "Ancient Waters",
      seconds: 80,
      wind: 220,
      gust: 100,
      waves: 0.65,
      fog: 0.4,
      roster: [S, F, D, L, F, K, T, E],
      stars: STARS[26],
      intro: "sturgeon",
      seal: catches(S, 3),
    },
    {
      name: "Thunder Shoal",
      wind: 240,
      gust: 140,
      waves: 0.7,
      fog: 0.6,
      thunder: true,
      roster: [I, I, L, F, D, L, C, T],
      stars: STARS[27],
      intro: "thunder",
      seal: { type: "spare" },
    },
    {
      name: "Eye of the Storm",
      wind: 300,
      gust: 160,
      waves: 0.85,
      fog: 0.6,
      thunder: true,
      speed: 1.2,
      roster: [R, L, F, D, I, N, T, E],
      stars: STARS[28],
      seal: { type: "golden", count: 2 },
    },
    {
      name: "Dragon of the Gorge",
      seconds: 90,
      wind: 260,
      windShift: true,
      gust: 140,
      waves: 0.8,
      fog: 0.6,
      thunder: true,
      speed: 1.2,
      roster: [R, S, L, F, D, I, T, E],
      stars: STARS[29],
      seal: catches(R, 2),
    },
  ],
  [
    {
      name: "Beyond the Reeds",
      seconds: 80,
      speed: 1.1,
      roster: [B, K, D, I, N, F, T, K],
      stars: STARS[30],
      intro: "shark",
      seal: catches(B, 2),
    },
    {
      name: "Crosscurrent",
      speed: 1.18,
      wind: 210,
      gust: 90,
      windShift: true,
      roster: [B, E, L, N, K, P, T, D],
      stars: STARS[31],
      seal: { type: "spare" },
    },
    {
      name: "Bladefish Trial",
      seconds: 80,
      speed: 1.2,
      waves: 0.6,
      roster: [W, B, D, N, F, P, T, K],
      stars: STARS[32],
      intro: "swordfish",
      seal: catches(W, 2),
    },
    {
      name: "Hammerhead Pass",
      seconds: 85,
      speed: 1.18,
      roster: [H, K, D, N, P, L, T, E],
      stars: STARS[33],
      intro: "hammerhead",
      seal: catches(H, 2),
    },
    {
      name: "Whitewater Turn",
      speed: 1.25,
      wind: 240,
      gust: 120,
      waves: 0.7,
      roster: [B, W, L, N, I, F, T, K],
      stars: STARS[34],
      seal: { type: "steady", misses: 6 },
    },
    {
      name: "Estuary Trial",
      seconds: 85,
      speed: 1.3,
      wind: 250,
      windShift: true,
      gust: 140,
      waves: 0.85,
      fog: 0.4,
      thunder: true,
      roster: [H, W, K, N, I, F, T, E],
      stars: STARS[35],
      intro: "storm",
      seal: { type: "golden", count: 2 },
    },
  ],
  [
    {
      name: "The Sleeping Giant",
      seconds: 85,
      speed: 1.1,
      roster: [G, K, D, N, P, F, T, K],
      stars: STARS[36],
      intro: "grouper",
      seal: catches(G, 2),
    },
    {
      name: "Deepwater Chase",
      seconds: 80,
      speed: 1.25,
      windShift: true,
      roster: [B, W, E, N, L, P, T, D],
      stars: STARS[37],
      seal: { type: "combo", count: 5 },
    },
    {
      name: "Sharkwater Trial",
      seconds: 85,
      speed: 1.32,
      waves: 0.85,
      roster: [B, H, K, N, F, P, T, D],
      stars: STARS[38],
      intro: "shark",
      seal: catches(B, 2),
    },
    {
      name: "Lanterns Offshore",
      seconds: 80,
      weather: "night",
      fog: 0.65,
      speed: 1.25,
      roster: [G, W, N, N, L, F, T, P],
      stars: STARS[39],
      seal: { type: "golden", count: 2 },
    },
    {
      name: "Twin Giants",
      seconds: 90,
      speed: 1.3,
      gust: 150,
      windShift: true,
      waves: 0.9,
      roster: [H, G, N, K, W, F, T, P],
      stars: STARS[40],
      seal: { type: "spare" },
    },
    {
      name: "Master of the Tide",
      seconds: 95,
      speed: 1.35,
      wind: 290,
      windShift: true,
      gust: 160,
      waves: 1,
      fog: 0.65,
      thunder: true,
      roster: [H, G, W, N, I, F, T, K],
      stars: STARS[41],
      intro: "storm",
      seal: catches(G, 2),
    },
  ],
];
export const LEVELS: readonly LevelRules[] = SPECS.flatMap((chapter, c) =>
  chapter.map((spec, i) => {
    const id = c * 6 + i + 1;
    const challenge = id % 3 === 0;
    const base = {
      seconds: 75,
      speed: 1,
      wind: 0,
      windShift: false,
      gust: 0,
      waves: 0,
      fog: 0,
      weather: "clear" as Weather,
      assist: 1,
      rareEvery: 13,
      thunder: false,
      intro: null,
      ...CHAPTER_DEFAULTS[c],
      ...spec,
    };
    // Keep the new silhouettes in rotation after their first introductions,
    // preserving population, protected turtles, and catch-seal targets.
    if (id >= 18 && id % 6 === 0) {
      const slot = base.roster.findIndex(kind => kind !== FISH.turtle &&
        kind < FISH.shark && (base.seal.type !== "catch" || kind !== base.seal.fish));
      if (slot >= 0) base.roster = base.roster.map((kind, index) =>
        index === slot ? (c % 2 === 0 ? FISH.seahorse : FISH.squid) : kind);
    }
    return {
      ...base,
      id,
      chapter: c,
      challenge,
      seconds: Math.max(
        45,
        id <= 6 ? base.seconds : base.seconds - 8 - (challenge ? 3 : 0),
      ),
      // Six gentle lessons, then steadily increasing handling and score pressure.
      speed: id <= 6 ? base.speed : base.speed * (1.08 + Math.min(0.24, (id - 7) * 0.007)),
      manualEvery: id <= 6 ? 12 : 14 + Math.floor((id - 7) / 12) * 2 + (challenge ? 2 : 0),
    };
  }),
);
export function starsFor(score: number, level: LevelRules) {
  "worklet";
  return score >= level.stars[2]
    ? 3
    : score >= level.stars[1]
      ? 2
      : score >= level.stars[0]
        ? 1
        : 0;
}
