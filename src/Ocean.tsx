import { impactRenderPressure } from "./renderPressure";
import { manualArtwork } from "./manualArt";
import { aimPreview } from "./aimPreview";
import React, { useEffect, useMemo, useState } from "react";
import { PixelRatio } from "react-native";
import { renderResolution } from "./renderResolution";
import { scheduleOnRN } from "react-native-worklets";
import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  Image,
  Line,
  Oval,
  Shader,
  Path,
  Rect,
  BlendColor,
  RadialGradient,
  Skia,
  SkFont,
  Text as CanvasText,
  useFont,
  useImage,
  matchFont,
  SkImage,
  Vertices,
  ImageShader,
  FilterMode,
  MipmapMode,
} from "@shopify/react-native-skia";
import { SharedValue, useDerivedValue, useAnimatedReaction } from "react-native-reanimated";
import {
  BURST_LIFE,
  GameState,
  SPLASH_LIFE,
  TUNING,
  aimBlocked,
  clarity,
  lightningAt,
} from "./game";
import {
  heroPose,
  HERO_ARM,
  HERO_FRAME,
  HERO_PIVOT,
  HERO_SHOULDER,
} from "./pose";
import { ATLAS_GRID, PUFF_SCALE, SPECIES } from "./species";
import { SKILLS, SKILL_COLOR } from "./skills";
import {
  AURA_SHAPES,
  MANUAL_EMBLEMS,
  RENDER_SKILLS,
  STORM_RAYS,
  SWORD_SHAPES,
} from "./renderAssets";
import { FOG_LIGHTS, FOG_SHADER } from "./fogShader";
import type { EffectsQuality } from "./effectBudget";
import type { LevelRules } from "./levels";

const ART_SAMPLING = { filter: FilterMode.Linear, mipmap: MipmapMode.None };

type Props = {
  effectsQuality?: EffectsQuality;
  state: SharedValue<GameState>;
  level: LevelRules;
  height: number;
  width: number;
  onReady: () => void;
  onError: (error: Error) => void;
};
// Each chapter has its own painting. `water` is the painted waterline as a
// fraction of image height; the scene aligns it with the simulation's surface.
const BACKGROUNDS = [
  {
    source: require("../assets/art/jiangnan-background.png"),
    water: 0.284,
    aspect: 0.5,
  },
  {
    source: require("../assets/art/bg-reed-marsh.jpg"),
    water: 0.279,
    aspect: 0.5625,
  },
  {
    source: require("../assets/art/bg-rain-river.jpg"),
    water: 0.322,
    aspect: 0.5625,
  },
  {
    source: require("../assets/art/bg-moonlit-lake.jpg"),
    water: 0.324,
    aspect: 0.5625,
  },
  {
    source: require("../assets/art/bg-storm-gorge.jpg"),
    water: 0.342,
    aspect: 0.5625,
  },
  {
    source: require("../assets/art/bg-jade-estuary.jpg"),
    water: 0.25,
    aspect: 0.5625,
  },
  {
    source: require("../assets/art/bg-jade-estuary.jpg"),
    water: 0.25,
    aspect: 0.5625,
  },
] as const;
function backgroundRect(chapter: number, height: number) {
  const { water, aspect } = BACKGROUNDS[chapter] ?? BACKGROUNDS[0],
    surface = height * 0.32;
  let h = Math.max(surface / water, (height - surface) / (1 - water));
  if (h * aspect < 390) h = 390 / aspect;
  const w = h * aspect;
  return { x: (390 - w) / 2, y: surface - water * h, width: w, height: h };
}
// Dark fog over an already dark painting needs more weight to hide fish.
const FOG_STRENGTH: Partial<Record<LevelRules["weather"], number>> = {
  night: 1.55,
  storm: 1.35,
};
const FOG_COLOR = {
  clear: "#DCE6DC",
  mist: "#DCE6DC",
  rain: "#9FB3AE",
  night: "#040D18",
  storm: "#1E2C32",
} as const;
export const Ocean = React.memo(function Ocean({
  effectsQuality = "full",
  state,
  level,
  height,
  width,
  onReady,
  onError,
}: Props) {
  const detailed = effectsQuality === "full",
    minimal = effectsQuality === "minimal";
  const { rasterScale } = renderResolution(width, PixelRatio.get());
  const impactBusy = useDerivedValue(() => impactRenderPressure(state.value));
  const wet = level.weather === "rain" || level.weather === "storm";
  const hero = useImage(
    require("../assets/art/wuxia-heroine-boat.png"),
    onError,
  );
  const heroine = useImage(
    require("../assets/art/wuxia-heroine-figure.png"),
    onError,
  );
  const fishSheet = useImage(
      require("../assets/art/river-fish-atlas.png"),
      onError,
    ),
    creatureSheet = useImage(
      require("../assets/art/river-creatures-atlas.png"),
      onError,
    );
  const [fishKinds, setFishKinds] = useState<number[]>([...level.roster]);
  // Only publish when a slot's species changes, not on every position update.
  // Visitor slots must change their texture, dimensions and hit indicators too.
  useAnimatedReaction(
    () => state.value.fish.reduce((key, fish) => key * 32 + fish.kind, 1),
    (key, previous) => {
      if (key !== previous) scheduleOnRN(setFishKinds, state.value.fish.map(f => f.kind));
    },
  );
  const needsOceanFish = level.id >= 5;
  const oceanSheet = useImage(
    needsOceanFish ? require("../assets/art/ocean-fish-atlas.png") : null,
    onError,
  );
  const reefSheet = useImage(require("../assets/art/reef-creatures-atlas.png"), onError);
  // Load and publish readiness in the React Native tree. Effects inside the
  // Canvas reconciler must not be responsible for dismissing the native loader.
  const backdropImage = useImage((BACKGROUNDS[level.chapter] ?? BACKGROUNDS[0]).source, onError);
  const ready = !!(
    hero &&
    heroine &&
    fishSheet &&
    creatureSheet &&
    (!needsOceanFish || oceanSheet) && reefSheet && backdropImage
  );
  useEffect(() => {
    if (ready) onReady();
  }, [ready, onReady, level.chapter]);
  useEffect(() => {
    if (ready) return;
    const timer = setTimeout(() => {
      const missing = Object.entries({hero: !!hero, heroine: !!heroine,
        fish: !!fishSheet, creatures: !!creatureSheet, reef: !!reefSheet,
        ocean: !needsOceanFish || !!oceanSheet, backdrop: !!backdropImage})
        .filter(([, loaded]) => !loaded).map(([name]) => name).join(", ");
      console.warn("[art-load-timeout]", missing);
      onError(new Error("Artwork load timed out: " + missing));
    }, 20000);
    return () => clearTimeout(timer);
  }, [ready, hero, heroine, fishSheet, creatureSheet, reefSheet, oceanSheet, backdropImage, needsOceanFish, onError]);
  const fallbackFont = useMemo(
    () =>
      matchFont({ fontFamily: "Helvetica", fontSize: 24, fontWeight: "700" }),
    [],
  );
  const scoreFont =
    useFont(
      require("@expo-google-fonts/cormorant-garamond/600SemiBold/CormorantGaramond_600SemiBold.ttf"),
      30,
    ) ?? fallbackFont;
  const shake = useDerivedValue(() => {
    const g = state.value;
    return [
      { translateX: Math.sin(g.elapsed * 95) * g.shake * 3.5 },
      { translateY: Math.cos(g.elapsed * 80) * g.shake * 2.5 },
    ];
  });
  return (
    <Canvas
      style={{
        width: width / rasterScale,
        height: (height * (width / 390)) / rasterScale,
        transform: [{ scale: rasterScale }],
        transformOrigin: "top left",
      }}
    >
      <Group transform={[{ scale: width / 390 / rasterScale }]}>
        <Group transform={shake}>
          <Backdrop
            key={level.chapter}
            chapter={level.chapter}
            height={height}
            image={backdropImage}
          />
          {detailed && level.weather === "night" && <Fireflies state={state} />}
          {(minimal ? [] : detailed ? MOTES : MOTES.slice(0, 4)).map(
            (index) => (
              <DriftMote key={index} state={state} index={index} />
            ),
          )}
          {fishKinds.map((kind, index) => (
            <Fish
              key={`${level.id}-${index}`}
              state={state}
              index={index}
              kind={kind}
              reducedMotion={minimal}
              impactBusy={impactBusy}
              atlas={
                SPECIES[kind].atlas === 3
                  ? reefSheet
                  : SPECIES[kind].atlas === 2
                  ? oceanSheet
                  : SPECIES[kind].atlas === 1
                    ? creatureSheet
                    : fishSheet
              }
            />
          ))}
          {[0, 1, 2].map((index) => (
            <Splash key={index} state={state} index={index} />
          ))}
          {level.fog > 0 && level.fog < 0.15 && (
            <Rect
              x={0}
              y={height * 0.32}
              width={390}
              height={height * 0.68}
              color={FOG_COLOR[level.weather]}
              opacity={level.fog}
            />
          )}
          {level.fog >= 0.15 && (
            <Fog
              state={state}
              height={height}
              density={Math.min(
                0.92,
                level.fog * (FOG_STRENGTH[level.weather] ?? 1),
              )}
              color={FOG_COLOR[level.weather]}
              lantern={level.weather === "night"}
            />
          )}
          <Aim state={state} assist={level.assist} />
          {level.waves > 0 && <Swell state={state} amount={level.waves} softGlow={detailed} />}
          {detailed &&
            !wet &&
            PETALS.map((index) => (
              <Petal
                key={index}
                state={state}
                index={index}
                colors={PETAL_COLORS[level.chapter] ?? PETAL_COLORS[0]}
              />
            ))}
          <Hero state={state} boat={hero} figure={heroine} />
          <RowCleaver state={state} />
          <Spear state={state} slot="spear" />
          <Spear state={state} slot="offhand" />
          <Relics state={state} />
          {[0, 1, 2].map((index) => (
            <Burst
              key={index}
              state={state}
              index={index}
              font={scoreFont}
              particles={detailed ? 4 : 0}
              softGlow={detailed}
            />
          ))}
          {detailed && (level.wind !== 0 || level.gust !== 0) && (
            <WindStreaks state={state} />
          )}
          {wet && (
            <Rain
              state={state}
              height={height}
              heavy={level.weather === "storm"}
              reduced={effectsQuality !== "full"}
            />
          )}
          {level.thunder && <Lightning state={state} height={height} />}
        </Group>
      </Group>
    </Canvas>
  );
});
// Load only the selected painting, instead of keeping five decoded backgrounds alive.
function Backdrop({
  chapter,
  height,
  image,
}: {
  chapter: number;
  height: number;
  image: SkImage | null;
}) {
  const frame = backgroundRect(chapter, height);
  return (
    <Image
      image={image}
      x={frame.x}
      y={frame.y}
      width={frame.width}
      height={frame.height}
      fit="fill"
      sampling={ART_SAMPLING}
    />
  );
}
// Soft visibility holes are shaded in one GPU pass; no CPU path boolean operations.
function Fog({
  state,
  height,
  density,
  color,
  lantern,
}: {
  state: SharedValue<GameState>;
  height: number;
  density: number;
  color: string;
  lantern: boolean;
}) {
  const surface = height * 0.32;
  const effect = useMemo(() => {
    const shader = Skia.RuntimeEffect.Make(FOG_SHADER);
    if (!shader) throw new Error("Fog shader compilation failed");
    return shader;
  }, [FOG_SHADER]);
  const tint = useMemo(() => Array.from(Skia.Color(color)), [color]);
  const uniforms = useDerivedValue(() => {
    const g = state.value,
      hand = heroPose(g),
      lights: number[][] = [];
    lights.push([hand.x + 30, g.surface + 20, lantern ? 80 : 60]);
    if (g.aim && g.aimTarget) lights.push([g.aimTarget.x, g.aimTarget.y, 70]);
    if (g.spear) lights.push([g.spear.x, g.spear.y, 52]);
    if (g.offhand) lights.push([g.offhand.x, g.offhand.y, 52]);
    for (const f of g.fish) {
      if ((f.rare ?? 0) > 0) lights.push([f.x, f.y, 34]);
      else if (SPECIES[f.kind].behaviour === "lantern")
        lights.push([f.x, f.y, 46]);
    }
    for (const r of g.pickups) lights.push([r.x, r.y, 32]);
    // Impact flashes already render above the fog; do not add per-pixel fog lights
    // for every simultaneous catch (the expensive case during area skills).
    while (lights.length < FOG_LIGHTS) lights.push([-10000, -10000, 0]);
    return {
      tint,
      strength: density * (1 - clarity(g) * 0.85),
      surface,
      lights: lights.slice(0, FOG_LIGHTS),
    };
  });
  return (
    <Rect x={0} y={surface} width={390} height={height - surface}>
      <Shader source={effect} uniforms={uniforms} />
    </Rect>
  );
}

function Swell({
  state,
  amount,
  softGlow,
}: {
  state: SharedValue<GameState>;
  amount: number;
  softGlow: boolean;
}) {
  const crest = useDerivedValue(() => {
    const g = state.value,
      p = Skia.PathBuilder.Make();
    for (let x = 0; x <= g.width; x += 6) {
      const y =
        g.surface +
        Math.sin(x * 0.035 + g.elapsed * 2.1) * amount * 5 +
        Math.sin(x * 0.012 - g.elapsed * 1.3) * amount * 4;
      if (x === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p.detach();
  });
  return (
    <Group>
      <Path
        path={crest}
        style="stroke"
        strokeWidth={2.4}
        color="#EEF5EC"
        opacity={0.75}
      />
      {softGlow && (
        <Path
          path={crest}
          style="stroke"
          strokeWidth={9}
          color="#EEF5EC"
          opacity={0.15}
        >
          <BlurMask blur={4} style="normal" />
        </Path>
      )}
    </Group>
  );
}
const RAIN = Array.from({ length: 34 }, (_, i) => i);
function Rain({
  state,
  height,
  heavy,
  reduced,
}: {
  state: SharedValue<GameState>;
  height: number;
  heavy: boolean;
  reduced: boolean;
}) {
  const path = useDerivedValue(() => {
    const g = state.value,
      p = Skia.PathBuilder.Make(),
      slant = Math.max(-0.6, Math.min(0.6, g.wind / 400)),
      count = reduced ? 12 : heavy ? 34 : 22;
    for (const i of RAIN) {
      if (i >= count) break;
      const speed = 520 + (i % 5) * 60,
        y = ((i * 137 + g.elapsed * speed) % (height + 40)) - 20,
        x = ((i * 53 + y * slant) % 430) - 20,
        length = heavy ? 18 : 12;
      p.moveTo(x, y);
      p.lineTo(x + slant * length, y + length);
    }
    return p.detach();
  });
  return (
    <Path
      path={path}
      style="stroke"
      strokeWidth={1.3}
      color="#E6EEF0"
      opacity={heavy ? 0.6 : 0.5}
    />
  );
}
const STREAKS = [0, 1, 2, 3, 4, 5];
function WindStreaks({ state }: { state: SharedValue<GameState> }) {
  const path = useDerivedValue(() => {
    const g = state.value,
      p = Skia.PathBuilder.Make(),
      strength = Math.min(1, Math.abs(g.wind) / 300),
      dir = g.wind < 0 ? -1 : 1;
    if (strength < 0.05) return p.detach();
    for (const i of STREAKS) {
      const travel = (i * 71 + g.elapsed * (120 + 260 * strength)) % 470,
        x = dir > 0 ? travel - 40 : g.width + 40 - travel,
        y = g.surface * (0.25 + (i % 3) * 0.2) + Math.sin(g.elapsed + i) * 6,
        length = 20 + 40 * strength;
      p.moveTo(x, y);
      p.quadTo(x - dir * length * 0.5, y - 3, x - dir * length, y + 1);
    }
    return p.detach();
  });
  const opacity = useDerivedValue(() =>
    Math.min(0.7, Math.abs(state.value.wind) / 300),
  );
  return (
    <Path
      path={path}
      style="stroke"
      strokeWidth={1.2}
      strokeCap="round"
      color="#F7F2E2"
      opacity={opacity}
    />
  );
}
function Lightning({
  state,
  height,
}: {
  state: SharedValue<GameState>;
  height: number;
}) {
  const flash = useDerivedValue(
    () => Math.min(1, lightningAt(state.value.elapsed)) * 0.55,
  );
  return (
    <Rect
      x={0}
      y={0}
      width={390}
      height={height}
      color="#EAF2FF"
      opacity={flash}
    />
  );
}
const MOTES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const PETALS = [0, 1, 2, 3, 4];
function DriftMote({
  state,
  index,
}: {
  state: SharedValue<GameState>;
  index: number;
}) {
  const cx = useDerivedValue(() => {
    const g = state.value;
    return (
      ((index * 61 + g.elapsed * (3 + (index % 4) * 2)) % (g.width + 20)) -
      10 +
      Math.sin(g.elapsed * 0.6 + index) * 8
    );
  });
  const span = useDerivedValue(() => {
    const g = state.value;
    return Math.max(1, g.height - g.surface - 150);
  });
  const rise = useDerivedValue(() => {
    const g = state.value;
    return (index * 97 + g.elapsed * (7 + (index % 3) * 4)) % span.value;
  });
  const cy = useDerivedValue(() => state.value.height - 120 - rise.value);
  // Motes fade in from the riverbed and dissolve before reaching the surface.
  const opacity = useDerivedValue(() => {
    const t = rise.value / span.value;
    return Math.min(1, t * 5, (1 - t) * 4) * 0.55;
  });
  return (
    <Circle
      cx={cx}
      cy={cy}
      r={1 + (index % 3) * 0.7}
      color="#EAF6DE"
      opacity={opacity}
    />
  );
}
const PETAL_COLORS = [
  ["#F3D2C4", "#E9A9A0"],
  ["#C9C27A", "#9DAF6A"],
  ["#D8DCD4", "#B9C2BC"],
  ["#F3E6B0", "#E2CF8A"],
  ["#D8DCD4", "#B9C2BC"],
] as const;
function Petal({
  state,
  index,
  colors,
}: {
  state: SharedValue<GameState>;
  index: number;
  colors: readonly [string, string];
}) {
  const transform = useDerivedValue(() => {
    const g = state.value;
    const x =
      ((index * 89 + g.elapsed * (5 + index * 1.6)) % (g.width + 60)) - 30;
    return [
      { translateX: x },
      {
        translateY: g.surface + 1 + Math.sin(g.elapsed * 1.4 + index * 2) * 1.6,
      },
      { rotate: Math.sin(g.elapsed * 0.7 + index) * 0.6 + index },
    ];
  });
  return (
    <Group transform={transform}>
      <Oval
        x={-4.5}
        y={-2}
        width={9}
        height={4}
        color={colors[index % 2]}
        opacity={0.85}
      />
    </Group>
  );
}
const Fish = React.memo(function Fish({
  state,
  index,
  kind,
  atlas,
  reducedMotion,
  impactBusy,
}: {
  state: SharedValue<GameState>;
  index: number;
  kind: number;
  atlas: SkImage | null;
  reducedMotion: boolean;
  impactBusy: SharedValue<boolean>;
}) {
  const spec = SPECIES[kind],
    grid = ATLAS_GRID[spec.atlas],
    size = 82 * spec.scale,
    offset = spec.offset * spec.scale,
    baseSpeed = spec.speed,
    eel = spec.behaviour === "eel",
    puffer = spec.behaviour === "puff",
    burrows = spec.behaviour === "burrow";
  const meshColumns = useMemo(
    () =>
      Array.from({ length: 8 }, (_, col) => {
        const u = col / 7;
        return {
          u,
          x: u * size - size / 2 - offset,
          tail: Math.pow(1 - u, 2.5),
        };
      }),
    [size, offset],
  );
  const transform = useDerivedValue(() => {
    const g = state.value,
      f = g.fish[index],
      grow = 1 + (PUFF_SCALE - 1) * (f?.inflate ?? 0),
      sink = burrows ? Math.min(1, (f?.hidden ?? 0) / 0.4) * 14 : 0;
    return [
      { translateX: f?.x ?? -100 },
      { translateY: (f?.y ?? -100) + sink },
      { rotate: f?.motion?.heading ?? 0 },
      { scaleX: (f?.visualDirection ?? f?.direction ?? 1) * grow *
          (1 + Math.min(1, (f?.flash ?? 0) / 0.18) * 0.06) },
      { scaleY: grow * (puffer ? 1 + 0.25 * (f?.inflate ?? 0) : 1) *
          (1 - Math.min(1, (f?.flash ?? 0) / 0.18) * 0.06) },
    ];
  });
  const textures = useMemo(() => {
    const cellWidth = (atlas?.width() ?? grid.columns * 512) / grid.columns,
      cellHeight = (atlas?.height() ?? grid.rows * 512) / grid.rows,
      column = spec.cell % grid.columns,
      row = Math.floor(spec.cell / grid.columns),
      points = [];
    for (let r = 0; r <= 2; r++)
      for (let c = 0; c <= 7; c++)
        points.push({
          x: cellWidth * (column + c / 7),
          y: cellHeight * (row + r / 2),
        });
    return points;
  }, [atlas, grid, spec.cell]);
  const indices = useMemo(() => {
    const result = [];
    for (let row = 0; row < 2; row++)
      for (let col = 0; col < 7; col++) {
        const a = row * 8 + col;
        result.push(a, a + 1, a + 8, a + 1, a + 9, a + 8);
      }
    return result;
  }, []);
  const stillVertices = useMemo(
    () =>
      [0, 1, 2].flatMap((row) =>
        meshColumns.map((c) => ({ x: c.x, y: (row / 2) * size - size / 2 })),
      ),
    [meshColumns, size],
  );
  const vertices = useDerivedValue(() => {
    if (reducedMotion || impactBusy.value) return stillVertices;
    const g = state.value,
      f = g.fish[index],
      phase = f?.motion?.tailPhase ?? f?.phase ?? 0;
    if (!f || f.x < -size || f.x > g.width + size) return stillVertices;
    const energy = f?.motion ? Math.min(1.5, f.motion.speed / baseSpeed) : 1;
    const waves = meshColumns.map(({ u, tail }) =>
      eel
        ? Math.sin(phase * 0.8 - u * 6.5) *
          (0.35 + 0.65 * (1 - u)) *
          0.055 *
          size
        : Math.sin(phase - u * 4.5) *
          tail *
          (4.2 + energy * 1.4) *
          spec.scale *
          spec.flex,
    );
    const points = [];
    for (let row = 0; row <= 2; row++)
      for (let col = 0; col < 8; col++)
        points.push({
          x: meshColumns[col].x,
          y: (row / 2) * size - size / 2 + waves[col],
        });
    return points;
  });
  const glow = useDerivedValue(() => {
    const g = state.value,
      life = g.fish[index]?.rare ?? 0;
    return life > 0
      ? Math.min(1, life * 2) * (0.55 + Math.sin(g.elapsed * 7) * 0.2)
      : 0;
  });
  const flash = useDerivedValue(
    () => (state.value.fish[index]?.flash ?? 0) * 2.4,
  );
  const body = useDerivedValue(() => {
    const hidden = state.value.fish[index]?.hidden ?? 0;
    return burrows ? 1 - Math.min(1, hidden / 0.4) * 0.82 : 1;
  });
  const lanternGlow = useDerivedValue(
    () => 0.5 + Math.sin(state.value.elapsed * 2.4 + index) * 0.15,
  );
  const sparkle = useDerivedValue(() => state.value.elapsed * 3.2);
  return (
    <Group transform={transform}>
      <Group opacity={glow}>
        <Oval x={-44} y={-26} width={88} height={52} color="#F7CF63">
          <RadialGradient
            c={{ x: 0, y: 0 }}
            r={44}
            colors={["#F7CF63", "#F7CF6300"]}
          />
        </Oval>
      </Group>
      {spec.behaviour === "lantern" && (
        <Group opacity={lanternGlow}>
          <Oval x={-40} y={-26} width={80} height={52} color="#9FF2DD">
            <RadialGradient
              c={{ x: 0, y: 0 }}
              r={40}
              colors={["#9FF2DD", "#9FF2DD00"]}
            />
          </Oval>
        </Group>
      )}
      <Group opacity={body}>
        <Vertices
          vertices={vertices}
          textures={textures}
          indices={indices}
          mode="triangles"
        >
          <ImageShader image={atlas} tx="clamp" ty="clamp" sampling={ART_SAMPLING} />
          {spec.tint && <BlendColor color={spec.tint} mode="modulate" />}
        </Vertices>
      </Group>
      {spec.behaviour === "protected" && (
        <Group>
          <Circle cx={0} cy={-spec.ry - 12} r={6} color="#AD493C" />
          <Rect x={-3.5} y={-spec.ry - 13} width={7} height={2} color="#FFF3DA" />
        </Group>
      )}
      {burrows && <MudPuff state={state} index={index} />}
      {(spec.hp > 1 || spec.behaviour === "protected") && (
        <Group opacity={flash}>
          <Oval
            x={-spec.rx}
            y={-spec.ry}
            width={spec.rx * 2}
            height={spec.ry * 2}
            color={spec.behaviour === "protected" ? "#FF8A7A" : "#FFFFFF"}
          >
            {!reducedMotion && <BlurMask blur={8} style="normal" />}
          </Oval>
        </Group>
      )}
      {spec.relic && (
        <Circle cx={0} cy={-spec.ry - 18} r={3.2} color="#7DDEBE" />
      )}
      {spec.hp > 1 &&
        Array.from({ length: spec.hp }, (_, i) => (
          <Pip
            key={i}
            state={state}
            index={index}
            pip={i}
            count={spec.hp}
            y={-spec.ry - 10}
          />
        ))}
      {!reducedMotion && (
        <Group opacity={glow}>
          {[0, 1, 2].map((i) => (
            <Sparkle key={i} angle={sparkle} index={i} />
          ))}
        </Group>
      )}
    </Group>
  );
});
// A cloud of silt while a catfish is buried.
function MudPuff({
  state,
  index,
}: {
  state: SharedValue<GameState>;
  index: number;
}) {
  const opacity = useDerivedValue(() => {
    const hidden = state.value.fish[index]?.hidden ?? 0;
    return hidden > 0
      ? Math.min(1, hidden / 0.4, (TUNING.hideSeconds - hidden) / 0.3) * 0.55
      : 0;
  });
  return (
    <Group opacity={opacity}>
      <Oval x={-34} y={2} width={68} height={22} color="#8A7A5C">
        <RadialGradient c={{ x: 0, y: 10 }} r={34} colors={["#8A7A5C", "#8A7A5C00"]} />
      </Oval>
    </Group>
  );
}
const FIREFLIES = [0, 1, 2, 3, 4, 5, 6];
function Fireflies({ state }: { state: SharedValue<GameState> }) {
  return (
    <Group>
      {FIREFLIES.map((i) => (
        <Firefly key={i} state={state} index={i} />
      ))}
    </Group>
  );
}
function Firefly({
  state,
  index,
}: {
  state: SharedValue<GameState>;
  index: number;
}) {
  const cx = useDerivedValue(() => {
    const g = state.value;
    return (
      ((index * 67 + g.elapsed * (6 + index)) % (g.width + 40)) -
      20 +
      Math.sin(g.elapsed * 0.9 + index * 2) * 14
    );
  });
  const cy = useDerivedValue(() => {
    const g = state.value;
    return (
      g.surface * (0.55 + (index % 4) * 0.1) +
      Math.sin(g.elapsed * 1.3 + index) * 10
    );
  });
  const opacity = useDerivedValue(
    () =>
      Math.pow(
        Math.max(0, Math.sin(state.value.elapsed * 1.7 + index * 1.9)),
        3,
      ) * 0.9,
  );
  return (
    <Group opacity={opacity}>
      <Circle cx={cx} cy={cy} r={6} color="#F5E59A" opacity={0.35}>
        <BlurMask blur={5} style="normal" />
      </Circle>
      <Circle cx={cx} cy={cy} r={1.6} color="#FFF6C8" />
    </Group>
  );
}
function Pip({
  state,
  index,
  pip,
  count,
  y,
}: {
  state: SharedValue<GameState>;
  index: number;
  pip: number;
  count: number;
  y: number;
}) {
  const filled = useDerivedValue(() =>
    pip < (state.value.fish[index]?.hp ?? count) ? 1 : 0.25,
  );
  return (
    <Group opacity={filled}>
      <Circle cx={(pip - (count - 1) / 2) * 9} cy={y} r={3} color="#F4E7C2" />
      <Circle
        cx={(pip - (count - 1) / 2) * 9}
        cy={y}
        r={3}
        style="stroke"
        strokeWidth={1}
        color="#2A3B36"
      />
    </Group>
  );
}
function Sparkle({
  angle,
  index,
}: {
  angle: SharedValue<number>;
  index: number;
}) {
  const cx = useDerivedValue(
    () => Math.cos(angle.value + (index * Math.PI * 2) / 3) * 36,
  );
  const cy = useDerivedValue(
    () => Math.sin(angle.value + (index * Math.PI * 2) / 3) * 20,
  );
  return <Circle cx={cx} cy={cy} r={1.8} color="#FFF4C8" />;
}

function Hero({
  state,
  boat,
  figure,
}: {
  state: SharedValue<GameState>;
  boat: SkImage | null;
  figure: SkImage | null;
}) {
  const transform = useDerivedValue(() => {
    const pose = heroPose(state.value);
    return [
      { translateX: pose.x },
      { translateY: pose.y },
      { rotate: pose.tilt },
    ];
  });
  const mirror = useDerivedValue(() => {
    const pose = heroPose(state.value),
      p = HERO_PIVOT;
    // Last entry applies first: move the pivot to the origin, scale, lean, move back.
    return [
      { translateX: p.x },
      { translateY: p.y },
      { rotate: pose.lean },
      { scaleX: pose.facing },
      { translateX: -p.x },
      { translateY: -p.y },
    ];
  });
  const armTransform = useDerivedValue(() => [
    { rotate: heroPose(state.value).armAngle },
  ]);
  const armClip = useMemo(() => {
    const path = Skia.PathBuilder.Make();
    // Contour around the forward sleeve and hand. The same texture is drawn
    // once with this contour removed, then again as a hinged layer.
    HERO_ARM.forEach(([x, y], i) => {
      if (i === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    });
    path.close();
    return path.detach();
  }, []);
  // The original split left both boots and a few hem pixels in the hull layer.
  // Transfer those exact pixels to the turning figure instead of mirroring the boat.
  const boots = useMemo(() => {
    const p = Skia.PathBuilder.Make(),
      scale = HERO_FRAME.width / 1153;
    const contours = [
      [
        [464, 530],
        [497, 530],
        [482, 566],
        [478, 581],
        [475, 594],
        [442, 594],
        [447, 578],
      ],
      [
        [668, 530],
        [701, 530],
        [706, 560],
        [716, 573],
        [745, 582],
        [746, 594],
        [674, 594],
        [672, 568],
      ],
      [
        [420, 530],
        [618, 530],
        [618, 539],
        [420, 539],
      ],
    ];
    for (const contour of contours) {
      contour.forEach(([x, y], i) => {
        const xx = HERO_FRAME.x + x * scale,
          yy = HERO_FRAME.y + y * scale;
        if (i === 0) p.moveTo(xx, yy);
        else p.lineTo(xx, yy);
      });
      p.close();
    }
    return p.detach();
  }, []);
  const skillColor = useDerivedValue(() => {
    const g = state.value;
    const skill = g.skillUses > 0 ? g.skill : g.spear?.skill;
    return skill ? SKILL_COLOR[skill] : "#D5B67A";
  });
  const aura = useDerivedValue(() =>
    (state.value.skill && state.value.skillUses > 0) || state.value.spear?.skill
      ? 0.75
      : 0,
  );
  const auraKind = useDerivedValue(() =>
    RENDER_SKILLS.indexOf(
      state.value.skill ?? state.value.spear?.skill ?? null,
    ),
  );
  const auraPath = useDerivedValue(() => AURA_SHAPES[auraKind.value]);
  const auraTransform = useDerivedValue(() => [
    { translateX: 10 },
    { translateY: -65 },
    {
      rotate:
        state.value.elapsed *
        ((state.value.skill ?? state.value.spear?.skill) === "spin" ? 3 : 0.7),
    },
  ]);
  // A pennant at the stern shows wind direction and strength without HUD text.
  const pennant = useDerivedValue(() => {
    const g = state.value,
      p = Skia.PathBuilder.Make(),
      strength = Math.min(1, Math.abs(g.wind) / 300),
      dir = g.wind < 0 ? -1 : 1,
      length = 10 + strength * 26,
      droop = (1 - strength) * 12,
      flutter = Math.sin(g.elapsed * (6 + strength * 10)) * (2 + strength * 3);
    p.moveTo(0, -64);
    p.quadTo(
      dir * length * 0.5,
      -64 + droop * 0.5 + flutter,
      dir * length,
      -60 + droop - flutter * 0.5,
    );
    p.lineTo(dir * length * 0.9, -55 + droop + flutter * 0.4);
    p.quadTo(dir * length * 0.45, -57 + droop * 0.5 - flutter, 0, -56);
    p.close();
    return p.detach();
  });
  return (
    <Group transform={transform}>
      <Rect x={-28} y={-18} width={66} height={9} color="#746047" />
      <Line
        p1={{ x: -28, y: -13 }}
        p2={{ x: 38, y: -13 }}
        color="#3A2C1F"
        strokeWidth={1}
      />
      <Group clip={boots} invertClip>
        <Image
          image={boat}
          sampling={ART_SAMPLING}
          x={HERO_FRAME.x}
          y={HERO_FRAME.y}
          width={HERO_FRAME.width}
          height={HERO_FRAME.height}
          fit="fill"
        />
      </Group>
      <Oval
        x={-30}
        y={-27}
        width={81}
        height={19}
        color={skillColor}
        style="stroke"
        strokeWidth={1.5}
        opacity={aura}
      />
      {/* The figure is already cut off the hull, so mirroring her cannot
          swing the bow or the canopy. */}
      <Group transform={mirror}>
        <Group clip={boots}>
          <Image
            image={boat}
            sampling={ART_SAMPLING}
            x={HERO_FRAME.x}
            y={HERO_FRAME.y}
            width={HERO_FRAME.width}
            height={HERO_FRAME.height}
            fit="fill"
          />
        </Group>
        <Group transform={auraTransform}>
          <Path
            path={auraPath}
            color={skillColor}
            style="stroke"
            strokeWidth={2}
            opacity={aura}
          />
        </Group>
        <Group clip={armClip} invertClip>
          <Image
            image={figure}
            sampling={ART_SAMPLING}
            x={HERO_FRAME.x}
            y={HERO_FRAME.y}
            width={HERO_FRAME.width}
            height={HERO_FRAME.height}
            fit="fill"
          />
        </Group>
        <Group transform={armTransform} origin={HERO_SHOULDER}>
          <Group clip={armClip}>
            <Image
              image={figure}
              sampling={ART_SAMPLING}
              x={HERO_FRAME.x}
              y={HERO_FRAME.y}
              width={HERO_FRAME.width}
              height={HERO_FRAME.height}
              fit="fill"
            />
          </Group>
        </Group>
        <Line
          p1={{ x: -1, y: -67 }}
          p2={{ x: 25, y: -69 }}
          color={skillColor}
          strokeWidth={3}
          opacity={aura}
        />
      </Group>
      <Line
        p1={{ x: -100, y: -14 }}
        p2={{ x: -100, y: -66 }}
        color="#3A2C1F"
        strokeWidth={1.6}
      />
      <Group transform={[{ translateX: -100 }]}>
        <Path path={pennant} color="#B5452F" />
      </Group>
    </Group>
  );
}

function RowCleaver({state}: {state: SharedValue<GameState>}) {
  const y = useDerivedValue(() => state.value.spear?.skill === "kungfu" ? state.value.spear.y : -100);
  const opacity = useDerivedValue(() => state.value.spear?.skill === "kungfu"
    ? Math.max(0, 1 - (state.value.spear.pulse ?? 0) / 0.26) : 0);
  const start = useDerivedValue(() => ({x: 0, y: y.value}));
  const end = useDerivedValue(() => ({x: state.value.width, y: y.value}));
  return <Group opacity={opacity}>
    <Line p1={start} p2={end} color="#F0A0C0" strokeWidth={10} opacity={0.3} />
    <Line p1={start} p2={end} color="#FFF0E8" strokeWidth={2.5} />
  </Group>;
}
function Spear({
  state,
  slot,
}: {
  state: SharedValue<GameState>;
  slot: "spear" | "offhand";
}) {
  const transform = useDerivedValue(() => {
    const g = state.value,
      s = g[slot],
      v = g.aim ?? { x: 0.22, y: 0.976 };
    return [
      { translateX: s?.x ?? g.origin.x },
      { translateY: s?.y ?? g.origin.y },
      {
        rotate:
          s?.skill === "spin"
            ? g.elapsed * 18
            : s
              ? -Math.atan2(s.vx, s.vy)
              : -Math.atan2(v.x, v.y),
      },
    ];
  });
  const color = useDerivedValue(() => {
    const g = state.value,
      skill = g[slot] ? g[slot]!.skill : g.skillUses > 0 ? g.skill : null;
    return skill ? SKILL_COLOR[skill] : "#FAE8B4";
  });
  const shapeKey = useDerivedValue(() => {
    const g = state.value,
      s = g[slot],
      skill = s ? s.skill : g.skillUses > 0 ? g.skill : null;
    return RENDER_SKILLS.indexOf(skill ?? null) * 2 + (s ? 1 : 0);
  });
  const blade = useDerivedValue(
    () => SWORD_SHAPES[Math.floor(shapeKey.value / 2)][shapeKey.value % 2],
  );
  const shown = useDerivedValue(() =>
    slot === "offhand" ? (state.value.offhand ? 1 : 0) : state.value.spear?.skill === "kungfu" ? 0 : 1,
  );
  const trail = useDerivedValue(() => (state.value[slot] ? 0.24 : 0));
  const pulse = useDerivedValue(() =>
    (state.value[slot]?.pulse ?? 0) > 0 ? 1 : 0,
  );
  const radius = useDerivedValue(() => (state.value[slot]?.pulse ?? 0) * 1150);
  const waveScale = useDerivedValue(() => [
    { scale: Math.max(1, radius.value) },
  ]);
  const rayWidth = useDerivedValue(() => 3 / Math.max(1, radius.value));
  return (
    <Group transform={transform} opacity={shown}>
      <Path
        path={blade}
        color={color}
        style="stroke"
        strokeWidth={5}
        opacity={trail}
      />
      <Path path={blade} color={color} style="stroke" strokeWidth={1.7} />
      <Group opacity={pulse}>
        <Circle
          cx={0}
          cy={0}
          r={radius}
          color={color}
          style="stroke"
          strokeWidth={4}
        />
        <Group transform={waveScale}>
          <Path
            path={STORM_RAYS}
            color="#FFE5AC"
            style="stroke"
            strokeWidth={rayWidth}
          />
        </Group>
      </Group>
    </Group>
  );
}
function Relics({ state }: { state: SharedValue<GameState> }) {
  return (
    <>
      {[0, 1, 2].map((index) => (
        <Relic key={index} state={state} index={index} />
      ))}
    </>
  );
}
function Relic({
  state,
  index,
}: {
  state: SharedValue<GameState>;
  index: number;
}) {
  const artwork = useMemo(manualArtwork, []);
  const image = useDerivedValue(() => {
    const r = state.value.pickups[index];
    return artwork[SKILLS.indexOf(r?.skill ?? "twin")];
  });
  const transform = useDerivedValue(() => {
    const g = state.value, r = g.pickups[index];
    if (!r) return [{ translateX: -400 }, { translateY: -400 }, { rotate: 0 }];
    // One transform mapper per slot; no separate bob/color/emblem mappers.
    return [
      { translateX: r.x },
      { translateY: r.y + Math.sin(g.elapsed * 1.7 + index) * 2 },
      { rotate: Math.sin(g.elapsed * 1.1 + index) * 0.045 },
    ];
  });
  const opacity = useDerivedValue(() => {
    const g = state.value, r = g.pickups[index];
    return !r ? 0 : r.life < 3 ? 0.45 + Math.abs(Math.sin(g.elapsed * 8)) * 0.55 : 1;
  });
  // Keep a visible collectible if the platform cannot allocate a sprite surface.
  const fallback = useDerivedValue(() => image.value ? 0 : 1);
  const emblem = useDerivedValue(() => MANUAL_EMBLEMS[SKILLS.indexOf(state.value.pickups[index]?.skill ?? "twin")]);
  return (
    <Group transform={transform} opacity={opacity}>
      <Group transform={[{ scale: 1.35 }]}><Image image={image} x={-32} y={-30} width={64} height={72} sampling={ART_SAMPLING} /></Group>
      <Group opacity={fallback}>
        <Rect x={-19} y={-23} width={36} height={44} color="#243D46" />
        <Path path={emblem} color="#E4D2A7" style="stroke" strokeWidth={1.4} />
      </Group>
    </Group>
  );
}

function Aim({
  state,
  assist,
}: {
  state: SharedValue<GameState>;
  assist: number;
}) {
  const opacity = useDerivedValue(() => (state.value.aim ? 1 : 0));
  const trajectory = useDerivedValue(() => aimPreview(state.value));
  const reveal = useDerivedValue(() =>
    Math.abs(state.value.wind) < 1 ||
    state.value.skill === "gale" ||
    state.value.skill === "kungfu" ||
    state.value.skill === "storm"
      ? 1
      : assist,
  );
  const path = useDerivedValue(() => {
    const g = state.value,
      points = trajectory.value,
      p = Skia.PathBuilder.Make(),
      limit = points[points.length - 1].d * reveal.value;
    // Short dashes are deliberately spaced to keep fish readable under the aiming ray.
    for (let i = 0; i + 1 < points.length; i += 2) {
      const a = points[i],
        b = points[i + 1];
      if (a.d > limit) break;
      if (a.y < g.surface) continue;
      p.moveTo(a.x, a.y);
      p.lineTo(b.x, b.y);
    }
    return p.detach();
  });
  // The line turns red when the throw would strike a protected turtle.
  const blocked = useDerivedValue(() => aimBlocked(state.value));
  const lineColor = useDerivedValue(() =>
    blocked.value ? "#FF7A6A" : "#F3E8C6",
  );
  const lineOpacity = useDerivedValue(() => (blocked.value ? 0.95 : 0.7));
  const ringColor = useDerivedValue(() =>
    blocked.value ? "#FF7A6A" : "#F4D69F",
  );
  const ring = useDerivedValue(() => (reveal.value >= 1 ? 1 : 0));
  const x = useDerivedValue(() => {
    const g = state.value;
    if (g.skill === "kungfu" && g.skillUses > 0 && g.aimTarget)
      return Math.max(0, Math.min(g.width, g.aimTarget.x));
    const points = trajectory.value;
    return points[points.length - 1].x;
  });
  const y = useDerivedValue(() => {
    const points = trajectory.value;
    return points[points.length - 1].y;
  });
  const charge = useDerivedValue(() => {
    const g = state.value,
      p = Skia.PathBuilder.Make();
    const pose = heroPose(g);
    p.moveTo(pose.x - 36, pose.y + 20);
    p.lineTo(pose.x - 36 + 72 * g.charge, pose.y + 20);
    return p.detach();
  });
  const by = useDerivedValue(() => heroPose(state.value).y + 20);
  const full = useDerivedValue(() =>
    state.value.charge >= 1 ? "#E8C684" : "#D9A76B",
  );
  return (
    <Group opacity={opacity}>
      <Path
        path={path}
        style="stroke"
        strokeWidth={1}
        color={lineColor}
        opacity={lineOpacity}
      />
      <Group opacity={ring}>
        <Circle
          cx={x}
          cy={y}
          r={10}
          style="stroke"
          strokeWidth={1.2}
          color={ringColor}
        />
        <Circle cx={x} cy={y} r={2} color={ringColor} />
      </Group>
      <Group transform={[{ translateX: 0 }]}>
        <Line
          p1={useDerivedValue(() => ({
            x: heroPose(state.value).x - 36,
            y: by.value,
          }))}
          p2={useDerivedValue(() => ({
            x: heroPose(state.value).x + 36,
            y: by.value,
          }))}
          style="stroke"
          strokeWidth={5}
          strokeCap="round"
          color="#183E3E"
          opacity={0.7}
        />
      </Group>
      <Path
        path={charge}
        style="stroke"
        strokeWidth={3}
        strokeCap="round"
        color={full}
      />
    </Group>
  );
}
function Burst({
  state,
  index,
  font,
  particles,
  softGlow,
}: {
  state: SharedValue<GameState>;
  index: number;
  font: SkFont;
  particles: number;
  softGlow: boolean;
}) {
  const x = useDerivedValue(() => state.value.bursts[index]?.x ?? -100),
    y = useDerivedValue(() => state.value.bursts[index]?.y ?? -100);
  const progress = useDerivedValue(() => {
    const b = state.value.bursts[index];
    return b ? 1 - b.life / BURST_LIFE : 1;
  });
  const size = useDerivedValue(() =>
    state.value.bursts[index]?.rare ? 1.6 : 1,
  );
  const strikeOpacity = useDerivedValue(() => Math.pow(Math.max(0, 1 - progress.value / 0.16), 2));
  const strikeTransform = useDerivedValue(() => [{translateX:x.value}, {translateY:y.value},
    {scale:size.value * (0.7 + Math.min(1, progress.value / 0.16) * 0.3)}]);
  const radius = useDerivedValue(
      () => (8 + Math.sqrt(progress.value) * 30) * size.value,
    ),
    inkRadius = useDerivedValue(
      () => (5 + Math.sqrt(progress.value) * 18) * size.value,
    ),
    opacity = useDerivedValue(() => 1 - progress.value * progress.value),
    inkOpacity = useDerivedValue(() => (1 - progress.value) * 0.32);
  const ringColor = useDerivedValue(
    () => state.value.bursts[index]?.color ?? "#E6D6A1",
  );
  const label = useDerivedValue(() => {
    const b = state.value.bursts[index];
    if (!b) return "";
    if (b.chip) return `ARMOR −${b.damage ?? 1}`;
    return b.points < 0
      ? `${b.points}`
      : `+${b.points}${(b.catches ?? 1) > 1 ? ` · ${b.catches}` : ""}`;
  });
  const multiplier = useDerivedValue(() => {
    const b = state.value.bursts[index];
    return b?.timeBonus ? `+${b.timeBonus}s` : b && b.multiplier > 1 ? `×${b.multiplier}` : "";
  });
  const labelWidth = useDerivedValue(() => font.measureText(label.value).width);
  // The score rises quickly then settles, so it reads as a pop rather than a slide.
  const ty = useDerivedValue(
    () => y.value - 20 - (1 - Math.pow(1 - progress.value, 3)) * 34,
  );
  const tx = useDerivedValue(() => x.value - labelWidth.value / 2),
    mx = useDerivedValue(() => tx.value + labelWidth.value + 3),
    my = useDerivedValue(() => ty.value - 9);
  const textColor = useDerivedValue(() => {
    const b = state.value.bursts[index];
    return b && b.points < 0 ? "#FF9A8A" : b?.rare ? "#FFE08A" : "#FFF1CC";
  });
  return (
    <Group opacity={opacity}>
      <Group transform={strikeTransform} opacity={strikeOpacity}>
        <Line p1={{x:-23,y:18}} p2={{x:23,y:-18}} color="#FFF3CF" strokeWidth={3} />
        <Line p1={{x:-13,y:-17}} p2={{x:13,y:17}} color={ringColor} strokeWidth={2} />
        <Circle cx={0} cy={0} r={5} color="#FFF9DE" />
      </Group>
      <Circle cx={x} cy={y} r={inkRadius} color="#13302B" opacity={inkOpacity}>
        {softGlow && <BlurMask blur={5} style="normal" />}
      </Circle>
      <Circle
        cx={x}
        cy={y}
        r={radius}
        style="stroke"
        strokeWidth={1.6}
        color={ringColor}
      />
      {Array.from({ length: particles }, (_, i) => (
        <Mote key={i} x={x} y={y} progress={progress} index={i} />
      ))}
      <CanvasText x={tx} y={ty} text={label} font={font} color={textColor} />
      <CanvasText x={mx} y={my} text={multiplier} font={font} color="#E8734F" />
    </Group>
  );
}
function Splash({
  state,
  index,
}: {
  state: SharedValue<GameState>;
  index: number;
}) {
  const x = useDerivedValue(() => state.value.splashes[index]?.x ?? -100),
    y = useDerivedValue(() => state.value.splashes[index]?.y ?? -100);
  const progress = useDerivedValue(() => {
    const s = state.value.splashes[index];
    return s ? 1 - s.life / SPLASH_LIFE : 1;
  });
  const opacity = useDerivedValue(() => (1 - progress.value) * 0.8),
    outer = useDerivedValue(() => 6 + progress.value * 24),
    inner = useDerivedValue(() => 3 + progress.value * 12);
  return (
    <Group opacity={opacity}>
      <Circle
        cx={x}
        cy={y}
        r={outer}
        style="stroke"
        strokeWidth={1.2}
        color="#DDEBDD"
      />
      <Circle
        cx={x}
        cy={y}
        r={inner}
        style="stroke"
        strokeWidth={0.8}
        color="#DDEBDD"
      />
      {[0, 1, 2].map((i) => (
        <Bubble key={i} x={x} y={y} progress={progress} index={i} />
      ))}
    </Group>
  );
}
function Bubble({
  x,
  y,
  progress,
  index,
}: {
  x: SharedValue<number>;
  y: SharedValue<number>;
  progress: SharedValue<number>;
  index: number;
}) {
  const cx = useDerivedValue(
    () => x.value + (index - 1) * 7 + Math.sin(progress.value * 9 + index) * 2,
  );
  const cy = useDerivedValue(() => y.value - progress.value * (22 + index * 9));
  return (
    <Circle
      cx={cx}
      cy={cy}
      r={1.4 + index * 0.5}
      style="stroke"
      strokeWidth={0.8}
      color="#EAF4E6"
    />
  );
}
function Mote({
  x,
  y,
  progress,
  index,
}: {
  x: SharedValue<number>;
  y: SharedValue<number>;
  progress: SharedValue<number>;
  index: number;
}) {
  const angle = (index * Math.PI) / 4 + (index % 2) * 0.3,
    reach = 22 + (index % 3) * 8;
  const cx = useDerivedValue(
    () => x.value + Math.cos(angle) * (10 + Math.sqrt(progress.value) * reach),
  );
  const cy = useDerivedValue(
    () =>
      y.value +
      Math.sin(angle) * (10 + Math.sqrt(progress.value) * reach) +
      progress.value * progress.value * 10,
  );
  const r = useDerivedValue(() => (2.4 - (index % 2)) * (1 - progress.value));
  return (
    <Circle
      cx={cx}
      cy={cy}
      r={r}
      color={index % 3 === 0 ? "#1C3A33" : "#F5E7BD"}
    />
  );
}
