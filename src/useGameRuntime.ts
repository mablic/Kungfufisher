import { impactPriority, nextImpactGate } from "./impactFeedback";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import {
  useAnimatedReaction,
  useFrameCallback,
  type FrameInfo,
  useSharedValue,
} from "react-native-reanimated";
import {
  nextEffectBudget,
  type EffectBudget,
  type EffectsQuality,
} from "./effectBudget";
import { consumeSimulationFrame, heartbeatExpired } from "./runtimeSafety";
import { heroHand } from "./pose";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import * as Haptics from "expo-haptics";
import {
  accuracy,
  advanceGame,
  cancelAim,
  createGame,
  rebuildGame,
  extendGame,
  fitStage,
  GameState,
  pauseGame,
  previewGame,
  releaseGame,
  resumeGame,
  sealEarned,
  sealProgress,
  startGame,
  targetGame,
} from "./game";
import { LEVELS, type LevelRules } from "./levels";
import { SPECIES } from "./species";
import { playSound, setAudioActive, type Sound } from "./audio";

export type Hud = Pick<
  GameState,
  | "phase"
  | "score"
  | "shots"
  | "catches"
  | "remaining"
  | "run"
  | "combo"
  | "bestCombo"
  | "cleared"
  | "rareCatches"
  | "chips"
  | "misses"
  | "extensions"
  | "skill"
  | "gifts"
> & {
  // Whole seconds played, for the overtime offer's pace estimate.
  elapsed: number;
  levelId: number;
  accuracy: number;
  charging: boolean;
  full: boolean;
  flying: boolean;
  rare: boolean;
  // Wind strength 0–5 with sign for direction, for the HUD flag.
  wind: number;
  sealValue: number;
  sealMet: boolean;
  sealFailed: boolean;
  seal: boolean;
  turtleHits: number;
  skillUses: number;
  visitor: string | null;
  timeStop: number;
  heavyCatchId: number;
};
function readHud(g: GameState): Hud {
  "worklet";
  const seal = sealProgress(g);
  const visitor = g.fish.find((f) => f.visitorUntil !== undefined);
  return {
    heavyCatchId: g.bursts.reduce((id, b) => b.rare && !b.chip && b.points > 0 ? Math.max(id,b.id) : id, 0),
    phase: g.phase,
    levelId: g.level.id,
    score: g.score,
    shots: g.shots,
    catches: g.catches,
    remaining: Math.ceil(g.remaining),
    run: g.run,
    combo: g.combo,
    bestCombo: g.bestCombo,
    cleared: g.cleared,
    rareCatches: g.rareCatches,
    chips: g.chips,
    misses: g.misses,
    accuracy: accuracy(g),
    charging: !!g.aim,
    full: g.charge >= 1,
    flying: !!g.spear || !!g.offhand,
    rare: g.fish.some((f) => (f.rare ?? 0) > 0),
    wind: Math.round(g.wind / 60),
    sealValue: seal.value,
    sealMet: seal.met,
    sealFailed: seal.failed,
    seal: sealEarned(g),
    turtleHits: g.turtleHits,
    extensions: g.extensions,
    elapsed: Math.floor(g.elapsed),
    skill: g.skillUses > 0 ? g.skill : null,
    skillUses: g.skillUses,
    visitor: visitor ? `${SPECIES[visitor.kind].name} · ${visitor.hp ?? 1} hits left` : null,
    timeStop: Math.ceil(g.timeStop),
    gifts: g.gifts,
  };
}
export type FrameSample = {
  fps: number;
  p95: number;
  p99: number;
  over34: number;
  frames: number;
  seconds: number;
};
export const frameSamples: FrameSample[] = [];
function record(sample: FrameSample) {
  frameSamples.push(sample);
  if (frameSamples.length > 30) frameSamples.shift();
  if (__DEV__) console.info("[UI frame sample]", JSON.stringify(sample));
}
type Cue = "hit" | "cast" | "full" | "won" | "rare" | "chip" | "heavy" | "protected";
export type RunResult = {
  levelId: number;
  score: number;
  bestCombo: number;
  seal: boolean;
};
const PROFILE_FRAMES =
  __DEV__ && process.env.EXPO_PUBLIC_PROFILE_GAME === "true";
const QUALITY_CEILING: EffectsQuality = "balanced";

export function useGameRuntime(
  height: number,
  scale: number,
  hapticsOn: boolean,
  onResult: (result: RunResult) => void,
) {
  const [initial] = useState(() =>
    createGame(height, Date.now() % 4294967296, LEVELS[0]),
  );
  const state = useSharedValue(initial),
    [hud, setHud] = useState<Hud>(() => readHud(initial));
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const reportRuntimeError = useCallback((message: string) => {
    if (__DEV__) console.error("[game runtime]", message);
    setRuntimeError(message);
  }, []);
  const [effectsQuality, setEffectsQuality] =
    useState<EffectsQuality>(QUALITY_CEILING);
  const budget = useSharedValue<EffectBudget>({
    quality: QUALITY_CEILING,
    slow: 0,
    fast: 0,
  });
  const simulationCarry = useSharedValue(0);
  const loadWindow = useSharedValue({ frames: 0, ms: 0, late: 0 });
  useEffect(() => {
    scheduleOnUI(() => {
      "worklet";
      try {
        state.modify((g) => {
          fitStage(g, height);
          return g;
        });
      } catch (error) {
        scheduleOnRN(
          reportRuntimeError,
          "stage: " + String((error as Error).stack ?? error),
        );
      }
    });
  }, [height, state, reportRuntimeError]);
  const muted = useSharedValue(!hapticsOn),
    profile = useSharedValue<number[]>([]),
    fault = useSharedValue(false);
  useEffect(() => {
    muted.value = !hapticsOn;
  }, [hapticsOn, muted]);
  const publish = useCallback(
    (next: Hud) => {
      setHud(next);
      if (next.phase === "won" || next.phase === "lost")
        onResult({
          levelId: next.levelId,
          score: next.score,
          bestCombo: next.bestCombo,
          seal: next.seal,
        });
    },
    [onResult],
  );
  const lastBeat = useRef(Date.now());
  const foreground = useRef(AppState.currentState === "active");
  const heartbeatSent = useSharedValue(0);
  const receiveBeat = useCallback(() => {
    lastBeat.current = Date.now();
  }, []);
  useEffect(() => {
    lastBeat.current = Date.now();
    if (hud.phase !== "playing") return;
    const timer = setInterval(() => {
      if (
        heartbeatExpired(Date.now(), lastBeat.current, foreground.current, true)
      ) {
        lastBeat.current = Date.now();
        setEffectsQuality("minimal");
        reportRuntimeError(
          "The game loop stopped responding. Restart the river.",
        );
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [hud.phase, reportRuntimeError]);
  const lastImpactHaptic = useRef({at: -Infinity, priority: 0});
  const tactile = useCallback((kind: Cue) => {
    const priority = impactPriority(kind);
    if (priority > 0) {
      const next = nextImpactGate(lastImpactHaptic.current, Date.now(), priority);
      if (!next) return;
      lastImpactHaptic.current = next;
    }
    if (kind === "protected") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }
    if (kind === "won")
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
    else
      void Haptics.impactAsync(
        kind === "rare" || kind === "heavy"
          ? Haptics.ImpactFeedbackStyle.Heavy
          : kind === "chip"
            ? Haptics.ImpactFeedbackStyle.Rigid
            : kind === "full"
              ? Haptics.ImpactFeedbackStyle.Rigid
              : Haptics.ImpactFeedbackStyle.Light,
      ).catch(() => {});
  }, []);
  const sound = useCallback((name: Sound) => playSound(name), []);
  const onFrame = useCallback(
    (frame: FrameInfo) => {
      "worklet";
      const gap = frame.timeSincePreviousFrame;
      if (gap === null || fault.value || state.value.phase !== "playing")
        return;
      try {
        if (frame.timestamp - heartbeatSent.value >= 500) {
          heartbeatSent.value = frame.timestamp;
          scheduleOnRN(receiveBeat);
        }
        const step = consumeSimulationFrame(simulationCarry.value, gap);
        simulationCarry.value = step.carryMs;
        if (step.seconds > 0)
          state.modify((g) => {
            advanceGame(g, step.seconds);
            return g;
          });
        // A short impact spike can disappear inside a 60-frame average. Shed
        // decorations immediately, then use the existing slow recovery policy.
        if (gap > 50 && budget.value.quality !== "minimal") {
          budget.value = { quality: "minimal", slow: 0, fast: 0 };
          scheduleOnRN(setEffectsQuality, "minimal");
        }
        const load = loadWindow.value;
        load.frames++;
        load.ms += gap;
        if (gap > 34) load.late++;
        if (load.frames >= 60) {
          const next = nextEffectBudget(
            budget.value,
            load.ms / load.frames,
            load.late,
            QUALITY_CEILING,
          );
          if (next.quality !== budget.value.quality)
            scheduleOnRN(setEffectsQuality, next.quality);
          budget.value = next;
          loadWindow.value = { frames: 0, ms: 0, late: 0 };
        }
        // Detailed sampling is a developer diagnostic, not production frame work.
        if (!PROFILE_FRAMES) return;
        const samples = profile.value;
        samples.push(gap);
        if (samples.length >= 600) {
          const sorted = samples.slice().sort((a, b) => a - b),
            seconds = samples.reduce((a, b) => a + b, 0) / 1000;
          scheduleOnRN(record, {
            fps: Math.round((samples.length / seconds) * 10) / 10,
            p95: Math.round(sorted[Math.floor(sorted.length * 0.95)] * 10) / 10,
            p99: Math.round(sorted[Math.floor(sorted.length * 0.99)] * 10) / 10,
            over34: samples.filter((v) => v > 34).length,
            frames: samples.length,
            seconds: Math.round(seconds * 10) / 10,
          });
          profile.value = [];
        }
      } catch (error) {
        fault.value = true;
        scheduleOnRN(
          reportRuntimeError,
          "frame: " + String((error as Error).stack ?? error),
        );
      }
    },
    [
      state,
      fault,
      heartbeatSent,
      simulationCarry,
      receiveBeat,
      loadWindow,
      budget,
      profile,
      reportRuntimeError,
    ],
  );
  const frameDriver = useFrameCallback(onFrame);
  useAnimatedReaction(
    () => readHud(state.value),
    (next, previous) => {
      if (
        !previous ||
        next.phase !== previous.phase ||
        next.levelId !== previous.levelId ||
        next.score !== previous.score ||
        next.remaining !== previous.remaining ||
        next.charging !== previous.charging ||
        next.flying !== previous.flying ||
        next.full !== previous.full ||
        next.run !== previous.run ||
        next.combo !== previous.combo ||
        next.cleared !== previous.cleared ||
        next.rare !== previous.rare ||
        next.chips !== previous.chips ||
        next.wind !== previous.wind ||
        next.sealValue !== previous.sealValue ||
        next.turtleHits !== previous.turtleHits ||
        next.extensions !== previous.extensions ||
        next.skill !== previous.skill ||
        next.skillUses !== previous.skillUses ||
        next.visitor !== previous.visitor ||
        next.timeStop !== previous.timeStop ||
        next.gifts !== previous.gifts
      )
        scheduleOnRN(publish, next);
      if (!previous || next.run !== previous.run) return;
      // Sound cues: one per event, the most significant first.
      if (next.phase !== previous.phase && next.phase === "won")
        scheduleOnRN(sound, "win");
      else if (next.phase !== previous.phase && next.phase === "lost")
        scheduleOnRN(sound, "fail");
      else if (next.cleared && !previous.cleared) scheduleOnRN(sound, "clear");
      else if (next.rareCatches > previous.rareCatches)
        scheduleOnRN(sound, "rare");
      else if (next.turtleHits > previous.turtleHits)
        scheduleOnRN(sound, "miss");
      else if (next.catches > previous.catches && next.heavyCatchId > previous.heavyCatchId)
        scheduleOnRN(sound, "heavy");
      else if (next.catches > previous.catches)
        scheduleOnRN(
          sound,
          (["hit0", "hit1", "hit2", "hit3", "hit4"] as const)[
            Math.min(4, Math.max(0, next.combo - 1))
          ],
        );

      else if (next.sealMet && !previous.sealMet && !next.sealFailed)
        scheduleOnRN(sound, "star");
      else if (next.chips > previous.chips) scheduleOnRN(sound, "chip");
      else if (next.misses > previous.misses) scheduleOnRN(sound, "miss");
      if (next.gifts > previous.gifts) scheduleOnRN(sound, "rare");
      if (next.rare && !previous.rare) scheduleOnRN(sound, "star");
      if (next.full && !previous.full) scheduleOnRN(sound, "full");
      if (
        next.phase === "playing" &&
        next.remaining !== previous.remaining &&
        next.remaining <= 5 &&
        next.remaining > 0
      )
        scheduleOnRN(sound, "tick");
      if (!muted.value) {
        if (
          (next.phase === "won" && previous.phase !== "won") ||
          (next.cleared && !previous.cleared)
        )
          scheduleOnRN(tactile, "won");
        else if (next.turtleHits > previous.turtleHits)
          scheduleOnRN(tactile, "protected");
        else if (next.rareCatches > previous.rareCatches)
          scheduleOnRN(tactile, "rare");
        else if (next.catches > previous.catches && next.heavyCatchId > previous.heavyCatchId)
          scheduleOnRN(tactile, "heavy");
        else if (next.catches > previous.catches) scheduleOnRN(tactile, "hit");
        else if (next.chips > previous.chips) scheduleOnRN(tactile, "chip");
        if (next.full && !previous.full) scheduleOnRN(tactile, "full");
      }
    },
  );
  const action = useCallback(
    (
      name:
        | "start"
        | "preview"
        | "pause"
        | "resume"
        | "extend"
        | "home"
        | "recover",
      level?: LevelRules,
      seconds = 0,
    ) => {
      setRuntimeError(null);
      lastBeat.current = Date.now();
      if (name === "recover") {
        setEffectsQuality("minimal");
        frameDriver.setActive(false);
        frameDriver.setActive(true);
      }
      scheduleOnUI(() => {
        "worklet";
        try {
          fault.value = false;
          if (name === "recover")
            budget.value = { quality: "minimal", slow: 0, fast: 0 };
          state.modify((g) => {
            if (name === "recover") {
              return rebuildGame(g, height, level ?? g.level);
            }
            if (name === "start") startGame(g, level ?? g.level);
            else if (name === "preview") previewGame(g, level ?? g.level);
            else if (name === "pause") pauseGame(g);
            else if (name === "resume") resumeGame(g);
            else if (name === "extend") extendGame(g, seconds);
            else {
              g.phase = "ready";
              cancelAim(g);
              g.spear = null;
              g.offhand = null;
              g.armLift = 0;
              g.armPose = 0;
              g.swing = 0;
              g.turn = 0;
              g.origin = heroHand(g);
            }
            return g;
          });
          scheduleOnRN(publish, readHud(state.value));
          profile.value = [];
          simulationCarry.value = 0;
          loadWindow.value = { frames: 0, ms: 0, late: 0 };
        } catch (error) {
          fault.value = true;
          scheduleOnRN(
            reportRuntimeError,
            "action: " + String((error as Error).stack ?? error),
          );
        }
      });
    },
    [
      state,
      profile,
      height,
      publish,
      fault,
      loadWindow,
      reportRuntimeError,
      frameDriver,
    ],
  );
  useEffect(() => {
    const sub = AppState.addEventListener("change", (phase) => {
      const active = phase === "active";
      foreground.current = active;
      lastBeat.current = Date.now();
      setAudioActive(active);
      if (active) {
        // Re-register the frame driver after iOS interrupts drawing (calls, app switcher).
        frameDriver.setActive(false);
        frameDriver.setActive(true);
      } else {
        scheduleOnUI(() => {
          "worklet";
          try {
            state.modify((g) => {
              pauseGame(g);
              return g;
            });
            scheduleOnRN(publish, readHud(state.value));
          } catch (error) {
            scheduleOnRN(reportRuntimeError, "background: " + String(error));
          }
        });
      }
    });
    return () => sub.remove();
  }, [state, frameDriver, publish, reportRuntimeError]);
  const gesture = useMemo(
    () =>
      Gesture.Manual()
        .onTouchesDown((event, manager) => {
          const touch = event.allTouches[0];
          if (
            !touch ||
            event.allTouches.length !== 1 ||
            state.value.phase !== "playing" ||
            touch.y / scale <= state.value.surface
          ) {
            manager.fail();
            return;
          }
          manager.begin();
          manager.activate();
          state.modify((g) => {
            targetGame(g, { x: touch.x / scale, y: touch.y / scale });
            return g;
          });
        })
        .onTouchesMove((event) => {
          const touch = event.allTouches[0];
          if (touch)
            state.modify((g) => {
              if (g.aim)
                targetGame(g, { x: touch.x / scale, y: touch.y / scale });
              return g;
            });
        })
        .onTouchesUp((_event, manager) => {
          let fired = false;
          state.modify((g) => {
            fired = releaseGame(g);
            return g;
          });
          if (fired) {
            scheduleOnRN(sound, "cast");
            if (!muted.value) scheduleOnRN(tactile, "cast");
          }
          manager.end();
        })
        .onTouchesCancelled((_event, manager) => {
          state.modify((g) => {
            cancelAim(g);
            return g;
          });
          manager.fail();
        })
        .onFinalize((_event, success) => {
          if (!success)
            state.modify((g) => {
              cancelAim(g);
              return g;
            });
        }),
    [state, scale, muted, tactile, sound],
  );

  return { state, hud, gesture, action, runtimeError, effectsQuality };
}
