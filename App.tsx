import * as SplashScreen from "expo-splash-screen";
import { LaunchScreen, LaunchOverlay } from "./src/ui/LaunchScreen";
import { useStoreUpdates } from "./src/useStoreUpdates";
import { useGameCenter } from "./src/useGameCenter";
import { Achievements } from "./src/ui/Achievements";
import { highestClear, unlockedManuals, MANUAL_UNLOCKS } from "./src/skillProgression";
import { ComboBadge } from "./src/ui/ComboBadge";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  ActivityIndicator,
  AppState,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from "react-native";
import {
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { setAdAudioPaused } from "./src/audio";
import { useAdMob } from "./src/useAdMob";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  CormorantGaramond_600SemiBold,
} from "@expo-google-fonts/cormorant-garamond";
import { Ocean } from "./src/Ocean";
import { TUNING } from "./src/game";
import { CHAPTERS, LEVELS, starsFor, type LevelRules } from "./src/levels";
import { useGameRuntime, type RunResult } from "./src/useGameRuntime";
import { isUnlocked, useSave } from "./src/save";
import { CONTINUE, continueOffer } from "./src/continues";
import { SKILL_COLOR, SKILL_HINT, SKILL_LABEL, SKILL_MARK } from "./src/skills";
import {
  rewardedReady,
  getRewardedStatus,
  AD_STATUS_TEXT,
  showRewarded,
  trackAd,
  subscribeRewarded,
} from "./src/ads";
import { SimulatedAd } from "./src/ui/SimulatedAd";
import {
  initAudio,
  disposeAudio,
  playSound,
  setAudioPreferences,
  setMusicChapter,
} from "./src/audio";
import { FieldGuide } from "./src/ui/FieldGuide";
import { LevelMap } from "./src/ui/LevelMap";
import { LevelBrief } from "./src/ui/LevelBrief";
import {
  Button,
  COLORS,
  introFor,
  SealStamp,
  SecondaryButton,
  sealLabel,
  sealStatus,
  Stars,
  Toggles,
  styles as theme,
} from "./src/ui/theme";

void SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({fade: true, duration: 180});

export default function App() {
  const [fonts, fontError] = useFonts({
    Jianghu: CormorantGaramond_600SemiBold,
  });
  if (!fonts && !fontError) return <LaunchScreen />;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <GameScreen />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
type Screen = "home" | "map" | "brief" | "play";
function GameScreen() {
  const window = useWindowDimensions(),
    insets = useSafeAreaInsets();
  const [stage, setStage] = useState({
    width: window.width,
    height: window.height,
  });
  const onStageLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    const nextHeight = event.nativeEvent.layout.height;
    if (nextWidth < 1 || nextHeight < 1) return;
    setStage((prev) =>
      Math.abs(prev.width - nextWidth) < 1 &&
      Math.abs(prev.height - nextHeight) < 1
        ? prev
        : { width: nextWidth, height: nextHeight },
    );
  }, []);
  const { width, height } = stage,
    scale = width / 390;
  const {
    save,
    loaded,
    record,
    markSeen,
    toggle,
    totalStars,
    totalSeals,
    nextLevelId,
  } = useSave();
  const [level, setLevel] = useState<LevelRules>(LEVELS[0]),
    [screen, setScreen] = useState<Screen>("home"),
    [runStartBest, setRunStartBest] = useState(0),
    [runStartSeal, setRunStartSeal] = useState(false),
    [revealed, setRevealed] = useState(0);
  const [assetsReady, setAssetsReady] = useState(false),
    [assetError, setAssetError] = useState<string | null>(null);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const pendingGameCenter = useRef(false);
  const [storeUpdateBusy, setStoreUpdateBusy] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0),
    [help, setHelp] = useState(false),
    [pauseView, setPauseView] = useState<"main" | "restart">("main");
  // Overtime offers are keyed by run and extension so each is answered once.
  const [watching, setWatching] = useState(false),
    [overtimeGoal, setOvertimeGoal] = useState<number | null>(null);
  useEffect(() => {
    if (!loaded) return;
    setAudioPreferences(save.sound, save.music);
    initAudio();
  }, [loaded, save.sound, save.music]);
  useEffect(() => disposeAudio, []);
  const onResult = useCallback(
    (result: RunResult) =>
      record(result.levelId, result.score, result.bestCombo, result.seal),
    [record],
  );
  const { state, hud, gesture, action, runtimeError, effectsQuality } =
    useGameRuntime(height / scale, scale, save.haptics, onResult);
  // Home shows the level the player should play next.
  useEffect(() => {
    if (loaded && hud.phase === "ready" && screen === "home") {
      const next = LEVELS[nextLevelId - 1];
      if (next.id !== level.id) {
        if (next.chapter !== level.chapter) setAssetsReady(false);
        setLevel(next);
        action("preview", next);
      }
    }
  }, [loaded, nextLevelId, hud.phase, screen, level.id, action]);
  useEffect(() => {
    setAdAudioPaused(watching);
    return () => setAdAudioPaused(false);
  }, [watching]);
  const pauseForConsent = useCallback(() => action("pause"), [action]);
  const gameCenter = useGameCenter(save.levels, loaded,
    hud.phase !== "playing" && !watching && !help && !achievementsOpen && !storeUpdateBusy, pauseForConsent);
  const adPrivacy = useAdMob(
    hud.phase !== "playing" && !watching && !help && !achievementsOpen && !gameCenter.busy && !storeUpdateBusy,
    pauseForConsent,
  );
  useStoreUpdates(loaded && assetsReady && screen === "home" && hud.phase === "ready" && !watching && !help && !achievementsOpen && !gameCenter.busy && !adPrivacy.privacyBusy && !assetError && !runtimeError, setStoreUpdateBusy);
  const adAvailable = useSyncExternalStore(
    subscribeRewarded,
    rewardedReady,
    () => false,
  );
  const adBusy = useRef(false);
  const activeRun = useRef(hud.run);
  activeRun.current = hud.run;
  const [adMessage, setAdMessage] = useState<string | null>(null);
  const ended = hud.phase === "won" || hud.phase === "lost";
  const adStatus = useSyncExternalStore(
    subscribeRewarded,
    getRewardedStatus,
    getRewardedStatus,
  );
  const playing = hud.phase === "playing",
    runLevel = LEVELS[hud.levelId - 1] ?? level,
    offerKey = `${hud.run}:${hud.extensions}`,
    offer =
      ended && !watching ? continueOffer({ ...hud, level: runLevel }) : null,
    offering = !!offer,
    result = ended && !watching,
    earned = starsFor(hud.score, runLevel),
    nextStar = earned < 3 ? runLevel.stars[earned as 0 | 1 | 2] : null,
    newBest = result && hud.score > runStartBest && hud.score > 0,
    nextLevel = LEVELS[runLevel.id],
    canAdvance = !!nextLevel && (earned >= 2 || isUnlocked(save, nextLevel.id)),
    intro = introFor(runLevel);
  const musicChapter = hud.phase === "ready" ? level.chapter : runLevel.chapter;
  useEffect(() => setMusicChapter(musicChapter), [musicChapter]);

  // Stars are revealed one at a time on the results sheet, each with a chime.
  const revealTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    revealTimers.current.forEach(clearTimeout);
    revealTimers.current = [];
    setRevealed(0);
    if (!result) return;
    for (let i = 1; i <= earned; i++)
      revealTimers.current.push(
        setTimeout(
          () => {
            setRevealed(i);
            playSound("star");
          },
          500 + i * 380,
        ),
      );
    // A newly earned seal is stamped after the stars, with its own chime.
    if (hud.seal && !runStartSeal)
      revealTimers.current.push(
        setTimeout(
          () => {
            setRevealed(4);
            playSound("rare");
          },
          900 + earned * 380,
        ),
      );
    return () => revealTimers.current.forEach(clearTimeout);
  }, [result, hud.run, earned, hud.seal, runStartSeal]);
  useEffect(() => {
    if (offering && offer)
      trackAd("offer_shown", {
        level: runLevel.id,
        kind: offer.kind,
        needed: offer.needed,
      });
    // Logged once per offer, not on every HUD update.
  }, [offering, offerKey]);
  useEffect(() => {
    if (!result || overtimeGoal === null) return;
    trackAd(
      hud.score >= overtimeGoal ? "overtime_paid_off" : "overtime_fell_short",
      { level: runLevel.id, score: hud.score, goal: overtimeGoal },
    );
    setOvertimeGoal(null);
  }, [result, overtimeGoal, hud.score, runLevel.id]);
  const takeOvertime = useCallback(async () => {
    if (!offer || adBusy.current) return;
    adBusy.current = true;
    const forRun = hud.run;
    setAdMessage(null);
    const detail = { level: runLevel.id, kind: offer.kind };
    trackAd("offer_accepted", detail);
    setWatching(true);
    const outcome = await showRewarded("overtime");
    setWatching(false);
    if (activeRun.current !== forRun) {
      adBusy.current = false;
      return;
    }
    trackAd(
      outcome === "rewarded"
        ? "ad_rewarded"
        : outcome === "dismissed"
          ? "ad_dismissed"
          : "ad_failed",
      detail,
    );
    if (outcome !== "rewarded") {
      adBusy.current = false;
      setAdMessage(
        outcome === "failed"
          ? "Ad unavailable. No time added; your score is saved."
          : "Ad closed early. No time added; your score is saved.",
      );
      return;
    }
    setOvertimeGoal(offer.goal);
    action("extend", undefined, offer.seconds);
  }, [offer, offerKey, runLevel.id, hud.run, action]);
  useEffect(() => {
    adBusy.current = false;
  }, [hud.run, hud.extensions]);
  const resumeAfterGuide = useRef(false);
  const [giftNotice, setGiftNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!hud.gifts || !hud.skill) {
      setGiftNotice(null);
      return;
    }
    setGiftNotice(`${SKILL_LABEL[hud.skill]} equipped · 3 casts`);
    const timer = setTimeout(() => setGiftNotice(null), 2200);
    return () => clearTimeout(timer);
  }, [hud.gifts, hud.run]);
  const openBrief = useCallback(
    (picked: LevelRules) => {
      if (picked.chapter !== level.chapter) setAssetsReady(false);
      setLevel(picked);
      action("preview", picked);
      setScreen("brief");
    },
    [action, level.chapter],
  );
  const begin = useCallback(
    (picked: LevelRules) => {
      setAdMessage(null);
      setRunStartBest(save.levels[picked.id]?.best ?? 0);
      setRunStartSeal(!!save.levels[picked.id]?.seal);
      if (picked.intro) markSeen(picked.intro);
      for (const skill of unlockedManuals(__DEV__ ? Math.max(highestClear(save.levels), picked.id - 1) : highestClear(save.levels))) markSeen(`manual:${skill}`);
      setLevel(picked);
      setHelp(false);
      setPauseView("main");
      setScreen("play");
      action("start", { ...picked, manualPool: unlockedManuals(__DEV__ ? Math.max(highestClear(save.levels), picked.id - 1) : highestClear(save.levels)) });
    },
    [save.levels, markSeen, action],
  );
  const goToMap = useCallback(() => {
    action("home");
    setScreen("map");
  }, [action]);
  const goHome = useCallback(() => {
    action("home");
    setScreen("home");
  }, [action]);
  const closeMap = useCallback(() => setScreen("home"), []);
  const ready = useCallback(() => {
    setAssetsReady(true);
    setAssetError(null);
  }, []),
    error = useCallback((e: Error) => setAssetError(e.message), []);
  const bottom = Math.max(insets.bottom, 16) + 12,
    compact = height < 740;
  const coachLine =
    hud.timeStop > 0
      ? `TIME SEAL · Fish frozen ${hud.timeStop}s · Level timer continues`
      : hud.extensions > 0 && hud.remaining > CONTINUE.seconds - 3
      ? `Overtime · ${CONTINUE.seconds} more seconds on the river`
      : hud.full
        ? "Fully charged · Release to cast"
        : hud.rare
          ? `A golden fish is passing · worth ×${TUNING.rareBonus}`
          : hud.visitor
            ? `Rare visitor · ${hud.visitor}`
          : hud.shots >= 3
            ? null
            : runLevel.id === 1
              ? hud.charging
                ? "Keep holding · Drag to aim · Line stops at your aim"
                : hud.flying
                  ? "Spear away · Watch the catch"
                  : hud.shots === 0
                    ? "Hold anywhere underwater. Release to cast."
                    : "Reach 3 and 6 in a row · +2 seconds each"
              : intro
                ? `${intro.title} · ${intro.body.split(". ")[0]}.`
                : null;
  const windArrows =
    hud.wind === 0
      ? ""
      : (hud.wind < 0 ? "←" : "→").repeat(
          Math.min(3, Math.ceil(Math.abs(hud.wind) / 2)),
        );
  return (
    <View style={styles.root}>
      <StatusBar style={level.weather === "night" ? "light" : "dark"} />
      <GestureDetector gesture={gesture}>
        <View
          style={StyleSheet.absoluteFill}
          accessible={false}
          testID="fishing-water"
          onLayout={onStageLayout}
        >
          <Ocean
            key={canvasKey}
            state={state}
            effectsQuality={effectsQuality}
            level={
              playing || result || hud.phase === "paused" ? runLevel : level
            }
            height={height / scale}
            width={width}
            onReady={ready}
            onError={error}
          />
        </View>
      </GestureDetector>

      <Achievements visible={achievementsOpen} progress={gameCenter.progress}
        available={gameCenter.available} connected={gameCenter.player.authenticated}
        alias={gameCenter.player.alias} busy={gameCenter.busy} error={gameCenter.error}
        onClose={() => setAchievementsOpen(false)}
        onGameCenter={() => {pendingGameCenter.current = true; setAchievementsOpen(false);}}
        onDismiss={() => {if(pendingGameCenter.current) {pendingGameCenter.current = false; void gameCenter.show();}}}
      />
      {hud.phase === "ready" && screen === "home" && (
        <>
          <View
            pointerEvents="none"
            style={[styles.intro, { top: insets.top + 3 }]}
          >
            <View style={styles.introMeta}>
              <Text style={styles.tiny}>A WUXIA FISHING TALE</Text>
              <View style={styles.seal}>
                <Text style={styles.sealText}>KF</Text>
              </View>
            </View>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              style={[
                styles.wordmark,
                compact && { fontSize: 33, lineHeight: 44 },
              ]}
            >
              KUNG FU FISHER
            </Text>
          </View>
          <View style={[styles.landing, { bottom }]}>
            <View style={styles.chapterRow}>
              <Text style={styles.chapter}>
                LEVEL {level.id} · {CHAPTERS[level.chapter].name.toUpperCase()}
              </Text>
              <Text style={styles.best}>
                ★ {totalStars}/{LEVELS.length * 3}
              </Text>
              <View style={styles.sealTotal}>
                <SealStamp earned={totalSeals > 0} size={11} />
                <Text style={styles.sealTotalText}>
                  {totalSeals}/{LEVELS.length}
                </Text>
              </View>
            </View>
            <Text style={styles.landingTitle}>{level.name}</Text>
            <View style={styles.goalRow}>
              <Text style={styles.goalText}>
                <Text style={styles.goalValue}>{level.seconds}</Text>s ·{" "}
                <Text style={styles.goalValue}>{level.stars[1]}</Text> for 2★ · unlock next
              </Text>
              <Stars count={save.levels[level.id]?.stars ?? 0} size={13} />
            </View>
            <Button
              id="primary-action"
              label={totalStars === 0 ? "Begin fishing" : "Continue"}
              disabled={!assetsReady || !loaded}
              onPress={() => openBrief(level)}
            />
            <View style={styles.landingLinks}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="All levels"
                testID="open-levels"
                onPress={() => setScreen("map")}
                hitSlop={8}
              >
                <Text style={styles.textLinkStrong}>All levels</Text>
              </Pressable>
              <View style={styles.dot} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View how to play"
                onPress={() => setHelp(true)}
                hitSlop={8}
              >
                <Text style={styles.textLink}>How to play</Text>
              </Pressable>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="View achievements"
              onPress={() => setAchievementsOpen(true)} style={{padding:10}}>
              <Text style={styles.textLink}>Achievements · {gameCenter.progress.filter(a => a.percent === 100).length}/{gameCenter.progress.length}</Text>
            </Pressable>
            <Toggles values={save} onToggle={toggle} />
            {adPrivacy.privacyRequired && (
              <Pressable
                accessibilityRole="button"
                disabled={adPrivacy.privacyBusy}
                onPress={adPrivacy.openPrivacy}
                style={{ padding: 10 }}
              >
                <Text style={styles.textLink}>
                  {adPrivacy.privacyBusy
                    ? "Opening privacy options…"
                    : "Ad privacy choices"}
                </Text>
              </Pressable>
            )}
            {adPrivacy.privacyError && (
              <Text style={styles.textLink}>{adPrivacy.privacyError}</Text>
            )}
          </View>
        </>
      )}

      {hud.phase === "ready" && screen === "brief" && (
        <LevelBrief
          level={level}
          record={save.levels[level.id]}
          completedLevel={highestClear(save.levels)}
          seenManuals={save.seen}
          isNew={!!level.intro && !save.seen.includes(level.intro)}
          bottom={Math.max(insets.bottom, 16) + 4}
          onStart={() => begin(level)}
          onBack={() => setScreen("map")}
        />
      )}

      {hud.phase === "ready" && screen === "map" && (
        <LevelMap
          save={save}
          totalStars={totalStars}
          currentId={level.id}
          top={insets.top}
          bottom={insets.bottom}
          onPick={openBrief}
          onClose={closeMap}
        />
      )}

      {hud.phase !== "ready" && (
        <View
          pointerEvents="box-none"
          style={[styles.hud, { top: insets.top + 9 }]}
        >
          <View style={styles.hudPanel}>
            <View style={styles.scoreArea}>
              <View style={styles.hudLabelRow}>
                <Text style={styles.hudLabel}>
                  LV {runLevel.id} · {runLevel.name.toUpperCase()}
                </Text>
              </View>
              <View style={styles.scoreLine}>
                <Text testID="score" style={styles.score}>
                  {hud.score}
                </Text>
                {nextStar !== null && (
                  <Text style={styles.target}>/ {nextStar}</Text>
                )}
                <Stars count={earned} size={11} gap={0} />
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.progress,
                    earned >= 1 && { backgroundColor: COLORS.gold },
                    {
                      width: `${Math.min(100, (hud.score / runLevel.stars[2]) * 100)}%`,
                    },
                  ]}
                />
                {runLevel.stars.slice(0, 2).map((s) => (
                  <View
                    key={s}
                    style={[
                      styles.tick,
                      { left: `${(s / runLevel.stars[2]) * 100}%` },
                    ]}
                  />
                ))}
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.timerArea}>
              <Text
                style={[
                  styles.hudLabel,
                  hud.extensions > 0 && { color: COLORS.star },
                ]}
              >
                {hud.extensions > 0 ? "OVERTIME" : "TIME"}
              </Text>
              <Text
                testID="timer"
                style={[
                  styles.time,
                  hud.remaining <= 10 && { color: COLORS.red },
                ]}
              >
                {hud.remaining}
                <Text style={styles.unit}>s</Text>
              </Text>
            </View>
            <Pressable
              testID="open-guide"
              accessibilityRole="button"
              accessibilityLabel="Field guide · pauses game"
              disabled={!playing && hud.phase !== "paused"}
              onPress={() => {
                resumeAfterGuide.current = playing;
                action("pause");
                setHelp(true);
              }}
              style={styles.pauseButton}
            >
              <Text
                style={{
                  color: COLORS.ink,
                  borderWidth: 1.5,
                  borderColor: COLORS.ink,
                  borderRadius: 11,
                  width: 22,
                  height: 22,
                  textAlign: "center",
                  fontWeight: "700",
                }}
              >
                ?
              </Text>
            </Pressable>
            <Pressable
              testID="pause-game"
              accessibilityRole="button"
              accessibilityLabel="Pause game"
              disabled={!playing}
              onPress={() => {
                setPauseView("main");
                action("pause");
              }}
              style={({ pressed }) => [
                styles.pauseButton,
                pressed && { opacity: 0.55 },
              ]}
            >
              <View style={styles.pauseBars}>
                <View style={styles.pauseBar} />
                <View style={styles.pauseBar} />
              </View>
            </Pressable>
          </View>
          {playing && (
            <View pointerEvents="none" style={styles.chipRow}>
              {windArrows !== "" && (
                <View style={styles.windChip}>
                  <Text style={styles.windLabel}>WIND</Text>
                  <Text style={styles.windArrows}>{windArrows}</Text>
                </View>
              )}
              <View
                style={[
                  styles.sealChip,
                  hud.sealMet &&
                    !hud.sealFailed &&
                    runLevel.seal.type !== "steady" &&
                    runLevel.seal.type !== "spare" &&
                    styles.sealChipMet,
                  hud.sealFailed && styles.sealChipFailed,
                ]}
              >
                <SealStamp earned={hud.sealMet && !hud.sealFailed} size={10} />
                <Text style={styles.sealChipText}>
                  <Text style={styles.windLabel}>SEAL </Text>
                  {sealStatus(runLevel.seal, hud.sealValue)}
                </Text>
              </View>

            </View>
          )}
        </View>
      )}

      {playing && hud.combo >= 2 && (
        <ComboBadge
          combo={hud.combo}
          bestCombo={hud.bestCombo}
          bottom={height * 0.68 + 10}
          compact={height < 700}
        />
      )}

      {playing && (hud.skill || coachLine) && (
        <View
          pointerEvents="none"
          style={[styles.playFooter, { bottom, gap: 8 }]}
        >
          {hud.skill && (
            <View
              style={[
                styles.skillChip,
                { borderColor: SKILL_COLOR[hud.skill] },
              ]}
            >
              <Text
                style={[styles.skillUses, { color: SKILL_COLOR[hud.skill] }]}
              >
                {hud.skillUses}/3
              </Text>
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.skillName}>
                  {SKILL_MARK[hud.skill]} {SKILL_LABEL[hud.skill]} · EQUIPPED
                </Text>
                <Text style={styles.skillHint}>
                  {SKILL_HINT[hud.skill]} · {hud.skillUses} cast
                  {hud.skillUses === 1 ? "" : "s"} left
                </Text>
              </View>
            </View>
          )}

          {coachLine && (
            <View style={[styles.coach, hud.rare && styles.coachRare]}>
              <Text
                style={[
                  styles.coachText,
                  (hud.full || hud.rare) && { color: "#FFE3A0" },
                ]}
              >
                {coachLine}
              </Text>
            </View>
          )}
        </View>
      )}

      {!help && (hud.phase === "paused" || result) && (
        <View style={styles.sheetScrim}>
          <ScrollView
            style={{ maxHeight: height - insets.top - 16, flexGrow: 0 }}
            contentContainerStyle={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 20) + 10 },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.sheetHandle} />
            <Text style={theme.kicker}>
              {hud.phase === "paused"
                ? `LEVEL ${runLevel.id} · PAUSED`
                : `LEVEL ${runLevel.id} · ${runLevel.name.toUpperCase()}`}
            </Text>
            {result && adMessage && (
              <Text style={[theme.description, { marginBottom: 10 }]}>
                {adMessage}
              </Text>
            )}
            {result && (
              <View style={styles.bigStars}>
                {[1, 2, 3].map((i) => (
                  <Text
                    key={i}
                    style={[
                      styles.bigStar,
                      i <= Math.min(revealed, earned) && styles.bigStarOn,
                      i === 2 && { fontSize: 50, marginTop: -8 },
                    ]}
                  >
                    ★
                  </Text>
                ))}
              </View>
            )}
            <Text style={[theme.title, result && { textAlign: "center" }]}>
              {hud.phase === "paused"
                ? pauseView === "restart"
                  ? "Start a fresh run?"
                  : "Rest your blade."
                : hud.phase === "won"
                  ? runLevel.id === LEVELS.length
                    ? "The gorge falls quiet."
                    : earned === 1
                      ? "One star earned."
                      : earned === 3
                      ? "A master's catch."
                      : "Level cleared."
                  : "Another cast awaits."}
            </Text>
            <Text
              style={[
                theme.description,
                { marginBottom: 14 },
                result && { textAlign: "center" },
              ]}
            >
              {hud.phase === "paused"
                ? pauseView === "restart"
                  ? `Your current catch will be cleared. The next run starts at ${runLevel.seconds} seconds.`
                  : "The river can wait. Fish and timer are both paused."
                : hud.phase === "won"
                  ? earned === 1
                    ? canAdvance
                      ? "One star this run. Your next river remains unlocked."
                      : `${runLevel.stars[1] - hud.score} more points for 2 stars and the next river. Retry or take optional +15s overtime.`
                    : nextStar !== null
                    ? `${nextStar - hud.score} more points for the next star.`
                    : runLevel.id === LEVELS.length
                      ? "All forty-two rivers fished. Return for three stars on each."
                      : "Every star on this river is yours."
                  : `${runLevel.stars[0] - hud.score} points short of clearing. ${
                      runLevel.stars[0] - hud.score <= 45
                        ? "One more good catch would have done it."
                        : "Chain quick catches to multiply your points."
                    }`}
            </Text>
            {result && (
              <View style={styles.resultStats}>
                {[
                  ["SCORE", `${hud.score}`],
                  ["CAUGHT", `${hud.catches}`],
                  ["BEST COMBO", `${hud.bestCombo}`],
                  ["ACCURACY", `${hud.accuracy}%`],
                ].map(([label, value]) => (
                  <View key={label} style={styles.stat}>
                    <Text style={styles.statValue}>{value}</Text>
                    <Text style={styles.statLabel}>{label}</Text>
                  </View>
                ))}
              </View>
            )}
            {result && (
              <View style={styles.sealResult}>
                <SealStamp
                  earned={runStartSeal || (hud.seal && revealed === 4)}
                  size={22}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.sealResultKicker,
                      hud.seal && !runStartSeal && styles.newBest,
                    ]}
                  >
                    {hud.seal && !runStartSeal
                      ? revealed === 4
                        ? "SEAL EARNED"
                        : "SEAL CHALLENGE MET"
                      : runStartSeal
                        ? "SEAL ALREADY YOURS"
                        : "SEAL CHALLENGE"}
                  </Text>
                  <Text style={styles.sealResultText}>
                    {sealLabel(runLevel.seal)}
                    {hud.seal || runStartSeal
                      ? ""
                      : ` · ${hud.phase === "lost" ? "clear the level too" : sealStatus(runLevel.seal, hud.sealValue)}`}
                  </Text>
                </View>
              </View>
            )}
            {result && (
              <Text style={[styles.recordLine, newBest && styles.newBest]}>
                {newBest
                  ? `NEW PERSONAL BEST · ${hud.score}`
                  : `PERSONAL BEST · ${Math.max(runStartBest, hud.score)}`}
                {hud.rareCatches > 0 ? `  ·  ${hud.rareCatches} GOLDEN` : ""}
              </Text>
            )}
            {hud.phase === "won" && earned >= 2 && MANUAL_UNLOCKS.filter(reward => reward.afterLevel === runLevel.id).map(reward => (
              <View key={reward.afterLevel} style={{ padding: 12, marginBottom: 14, backgroundColor: "#EFE6D0", borderRadius: 8 }}>
                <Text style={styles.sealResultKicker}>{runStartBest >= runLevel.stars[0] ? "CHAPTER TECHNIQUES" : "TWO TECHNIQUES UNLOCKED"}</Text>
                <Text style={styles.sealResultText}>{reward.skills.map(skill => SKILL_LABEL[skill]).join(" + ")}</Text>
                <Text style={styles.sealResultText}>Their manuals can now drift into any river. Review how to use them before your next cast.</Text>
              </View>
            ))}
            {hud.phase === "paused" ? (
              <>
                <Button
                  id="primary-action"
                  label={pauseView === "restart" ? "Start fresh" : "Resume"}
                  onPress={() => {
                    if (pauseView === "main") action("resume");
                    else begin(runLevel);
                    setPauseView("main");
                  }}
                />
                {pauseView === "main" && (
                  <View style={{ marginTop: 10 }}>
                    <Toggles values={save} onToggle={toggle} />
                  </View>
                )}
                <View style={styles.sheetLinks}>
                  {pauseView === "main" ? (
                    <>
                      <SecondaryButton
                        id="restart-game"
                        label="Restart"
                        onPress={() => setPauseView("restart")}
                      />
                      <SecondaryButton label="All levels" onPress={goToMap} />
                    </>
                  ) : (
                    <SecondaryButton
                      id="secondary-action"
                      label="Go back"
                      onPress={() => setPauseView("main")}
                    />
                  )}
                </View>
              </>
            ) : (
              <>
                {offer && (
                  <View
                    style={{
                      marginBottom: 14,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: COLORS.gold,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={[theme.kicker, { marginBottom: 6 }]}>
                      OPTIONAL CONTINUE · +{offer.seconds}s
                    </Text>
                    <Text style={[theme.description, { marginBottom: 8 }]}>
                      {offer.kind === "rescue"
                        ? `${offer.needed} points to clear.`
                        : `${offer.needed} points to the next star.`}{" "}
                      Keep your score and remaining skills. A reward is earned
                      only by completing the ad.
                    </Text>
                    <Button
                      id="overtime"
                      label={
                        adAvailable
                          ? `Watch ad · +${offer.seconds}s`
                          : adStatus === "loading"
                            ? "Loading ad…"
                            : "Ad unavailable"
                      }
                      onPress={takeOvertime}
                      disabled={!adAvailable || watching || adBusy.current}
                    />
                    <Text
                      accessibilityLiveRegion="polite"
                      style={[styles.overtimeNote, { minHeight: 34 }]}
                    >
                      {AD_STATUS_TEXT[adAvailable ? "ready" : adStatus]}
                    </Text>
                  </View>
                )}
                {hud.phase === "won" && nextLevel && canAdvance ? (
                  <Button
                    id="primary-action"
                    label="Next level"
                    onPress={() => {
                      action("home");
                      openBrief(nextLevel);
                    }}
                  />
                ) : (
                  <Button
                    id="primary-action"
                    label={hud.phase === "won" ? "Fish again" : "Try again"}
                    onPress={() => begin(runLevel)}
                  />
                )}
                <View style={styles.sheetLinks}>
                  {hud.phase === "won" && nextLevel && canAdvance && (
                    <SecondaryButton
                      id="retry"
                      label="Retry"
                      onPress={() => begin(runLevel)}
                    />
                  )}
                  <SecondaryButton
                    id="secondary-action"
                    label="All levels"
                    onPress={goToMap}
                  />
                  <SecondaryButton label="Home" onPress={goHome} />
                </View>
              </>
            )}
          </ScrollView>
        </View>
      )}

      {playing && giftNotice && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: height * 0.4,
            alignSelf: "center",
            backgroundColor: "#173D39",
            borderColor: COLORS.gold,
            borderWidth: 1,
            borderRadius: 6,
            padding: 12,
          }}
        >
          <Text style={{ color: "#FFE5AC", fontWeight: "700", fontSize: 12 }}>
            {giftNotice}
          </Text>
        </View>
      )}
      {help && (
        <FieldGuide
          level={playing || hud.phase === "paused" || result ? runLevel : level}
          inRun={hud.phase === "paused"}
          resumeOnClose={resumeAfterGuide.current}
          onClose={() => {
            setHelp(false);
            if (resumeAfterGuide.current && AppState.currentState === "active")
              action("resume");
            resumeAfterGuide.current = false;
          }}
        />
      )}
      {__DEV__ && <SimulatedAd />}
      {runtimeError && (
        <View style={styles.helpScrim}>
          <View style={styles.helpCard}>
            <Text style={theme.title}>The cast was interrupted.</Text>
            <Text style={[theme.description, { marginBottom: 16 }]}>
              Your completed levels are saved. Restart the river to begin a
              fresh run.
            </Text>
            <Button
              label="Restart river"
              onPress={() => {
                setHelp(false);
                setAssetsReady(false);
                setAssetError(null);
                setCanvasKey((k) => k + 1);
                setScreen("home");
                action("recover", level);
              }}
            />
          </View>
        </View>
      )}
      {storeUpdateBusy && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(11,36,35,.35)", alignItems: "center", justifyContent: "center" }]}>
          <ActivityIndicator color="#F2DEAD" />
          <Text style={{ color: "#FFF0CC", marginTop: 10 }}>Opening update options…</Text>
        </View>
      )}
      <LaunchOverlay visible={!assetsReady || !!assetError} error={assetError}
        onRetry={() => {
          setAssetError(null); setAssetsReady(false); setCanvasKey(k => k + 1);
          action("recover", level);
        }}/>

    </View>
  );
}
function Guide({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <View style={styles.guide}>
      <View style={styles.guideNumber}>
        <Text style={styles.guideGlyph}>{n}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.guideTitle}>{title}</Text>
        <Text style={styles.guideBody}>{body}</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.paper },
  loading: {
    flex: 1,
    backgroundColor: COLORS.paper,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { fontSize: 13, color: COLORS.muted },
  intro: { position: "absolute", left: 27, right: 25 },
  introMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 9,
  },
  tiny: { fontSize: 9, letterSpacing: 2, color: "#5D6D5D", fontWeight: "600" },
  seal: {
    width: 24,
    height: 24,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 2,
    transform: [{ rotate: "-4deg" }],
  },
  sealText: { color: COLORS.paper, fontFamily: "Jianghu", fontSize: 12 },
  wordmark: {
    fontFamily: "Jianghu",
    fontSize: 39,
    lineHeight: 51,
    color: "#293E32",
    marginTop: 1,
    letterSpacing: 1,
    textAlign: "right",
  },
  landing: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: "rgba(246,239,221,.97)",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#DBCDAE",
    padding: 20,
    paddingBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#0C2824",
        shadowOpacity: 0.2,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 6 },
    }),
  },
  chapterRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  chapter: {
    fontSize: 10,
    color: COLORS.red,
    letterSpacing: 2,
    fontWeight: "700",
  },
  best: {
    marginLeft: "auto",
    fontSize: 12,
    color: COLORS.star,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  landingTitle: {
    fontFamily: "Jianghu",
    fontSize: 29,
    color: COLORS.ink,
    marginTop: 10,
  },
  goalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 14,
  },
  goalText: { fontSize: 12, color: COLORS.muted },
  goalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.ink,
    fontVariant: ["tabular-nums"],
  },
  landingLinks: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginTop: 14,
    marginBottom: 2,
  },
  textLink: { fontSize: 12, color: "#556B5D" },
  textLinkStrong: { fontSize: 13, color: COLORS.red, fontWeight: "600" },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#A59D85" },
  hud: { position: "absolute", left: 18, right: 18 },
  hudPanel: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(246,240,224,.94)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 6,
    borderWidth: 1,
    borderColor: "rgba(183,169,137,.5)",
  },
  scoreArea: { flex: 1 },
  hudLabelRow: { flexDirection: "row", alignItems: "center" },
  hudLabel: { fontSize: 9, color: "#677464", letterSpacing: 1 },
  scoreLine: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginTop: 2,
  },
  score: {
    fontSize: 27,
    lineHeight: 31,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    color: COLORS.ink,
  },
  target: { fontSize: 11, color: COLORS.muted },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D4D5BE",
    marginTop: 5,
    marginRight: 16,
  },
  progress: { height: 4, borderRadius: 2, backgroundColor: COLORS.red },
  tick: {
    position: "absolute",
    top: -2,
    width: 2,
    height: 8,
    marginLeft: -1,
    backgroundColor: "#7D6A48",
  },
  divider: {
    height: 35,
    width: 1,
    backgroundColor: "#D8CFB7",
    marginRight: 16,
  },
  timerArea: { width: 56 },
  time: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    color: COLORS.ink,
    marginTop: 2,
  },
  unit: { fontSize: 10, fontWeight: "400" },
  pauseButton: {
    width: 44,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  pauseBars: { flexDirection: "row", gap: 4 },
  pauseBar: {
    width: 3,
    height: 14,
    backgroundColor: COLORS.ink,
    borderRadius: 1,
  },
  sealTotal: { flexDirection: "row", alignItems: "center", gap: 4 },
  sealTotalText: {
    fontSize: 12,
    color: "#B23A2A",
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  sealChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "rgba(14,45,43,.8)",
    borderWidth: 1,
    borderColor: "rgba(208,190,146,.4)",
  },
  sealChipMet: {
    backgroundColor: "rgba(120,40,28,.9)",
    borderColor: "rgba(240,200,130,.7)",
  },
  sealChipFailed: { opacity: 0.55 },
  sealChipText: {
    fontSize: 11,
    color: "#F3EAD0",
    fontVariant: ["tabular-nums"],
  },
  sealResult: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  sealResultKicker: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: "#886C45",
    fontWeight: "700",
  },
  sealResultText: { fontSize: 12, color: COLORS.ink, marginTop: 2 },
  chipRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  skillChip: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "rgba(14,45,43,.88)",
    borderWidth: 1,
  },
  skillUses: {
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  skillName: { fontSize: 12, color: "#F3EAD0", fontWeight: "700" },
  skillHint: { fontSize: 9, color: "#D9CFB2", marginTop: 1 },
  windChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "rgba(14,45,43,.8)",
    borderWidth: 1,
    borderColor: "rgba(208,190,146,.4)",
  },
  windLabel: { fontSize: 9, letterSpacing: 1.5, color: "#D9CFB2" },
  windArrows: { fontSize: 14, color: "#F3EAD0", fontWeight: "700" },
  playFooter: { position: "absolute", left: 23, right: 23 },
  coach: {
    backgroundColor: "rgba(14,45,43,.83)",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(208,190,146,.3)",
  },
  coachRare: {
    backgroundColor: "rgba(92,62,18,.88)",
    borderColor: "rgba(247,207,99,.6)",
  },
  coachText: {
    color: "#E9E4CF",
    fontSize: 11,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  sheetScrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(8,28,28,.38)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: "#D4C8A8",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 30,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#C4B99D",
    marginBottom: 16,
  },
  bigStars: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 8,
  },
  bigStar: { fontSize: 40, color: "#D8CFB8" },
  bigStarOn: { color: COLORS.star },
  resultStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.line,
    paddingVertical: 14,
    marginBottom: 10,
  },
  stat: { alignItems: "center", gap: 6 },
  statValue: {
    fontSize: 23,
    fontWeight: "600",
    color: COLORS.ink,
    fontVariant: ["tabular-nums"],
  },
  statLabel: { fontSize: 9, color: COLORS.muted, letterSpacing: 0.5 },
  recordLine: {
    textAlign: "center",
    fontSize: 10,
    color: "#886C45",
    marginBottom: 14,
    letterSpacing: 1,
  },
  newBest: { color: COLORS.red, fontWeight: "700" },
  overtimeNote: {
    textAlign: "center",
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  sheetLinks: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 4,
  },
  helpScrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(8,28,28,.6)",
    padding: 23,
  },
  helpCard: {
    backgroundColor: COLORS.paper,
    borderRadius: 17,
    padding: 22,
    width: "100%",
    maxWidth: 380,
  },
  guide: { flexDirection: "row", gap: 13, marginVertical: 9 },
  guideNumber: {
    height: 29,
    width: 29,
    borderWidth: 1,
    borderColor: "#B69A70",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-3deg" }],
  },
  guideGlyph: { fontFamily: "Jianghu", fontSize: 17, color: COLORS.red },
  guideTitle: {
    fontSize: 14,
    color: COLORS.ink,
    fontWeight: "600",
    marginBottom: 4,
  },
  guideBody: { fontSize: 12, color: COLORS.muted, lineHeight: 18 },
  assetLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.paper,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 17,
  },
  assetText: { color: COLORS.muted, fontSize: 13 },
});
