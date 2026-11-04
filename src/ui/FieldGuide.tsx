import React, { useState, useSyncExternalStore } from "react";
import {
  Linking,
  ScrollView,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Constants from "expo-constants";
import { Canvas, Image as SkImage, useImage } from "@shopify/react-native-skia";
import { getRewardedDiagnostic, subscribeRewarded } from "../ads";
import { FONT_LICENSE } from "../fontLicense";
import { ATLAS_GRID, SPECIES } from "../species";
import { CHAPTERS, LEVELS, MECHANICS, type LevelRules } from "../levels";
import {
  SKILLS,
  SKILL_COLOR,
  SKILL_HINT,
  SKILL_LABEL,
  SKILL_MARK,
} from "../skills";
import { MANUAL_UNLOCKS } from "../skillProgression";
import { Button, COLORS, styles as theme } from "./theme";

function FishPortrait({ kind }: { kind: number }) {
  const spec = SPECIES[kind],
    grid = ATLAS_GRID[spec.atlas];
  const source =
    spec.atlas === 0
      ? require("../../assets/art/river-fish-atlas.png")
      : spec.atlas === 1
        ? require("../../assets/art/river-creatures-atlas.png")
        : spec.atlas === 2
          ? require("../../assets/art/ocean-fish-atlas.png")
          : require("../../assets/art/reef-creatures-atlas.png");
  const image = useImage(source);
  return (
    <Canvas style={{ width: 62, height: 54 }}>
      <SkImage
        image={image}
        x={-(spec.cell % grid.columns) * 62}
        y={-Math.floor(spec.cell / grid.columns) * 54}
        width={62 * grid.columns}
        height={54 * grid.rows}
        fit="fill"
      />
    </Canvas>
  );
}
export function FieldGuide({
  level,
  inRun,
  resumeOnClose,
  onClose,
}: {
  level: LevelRules;
  inRun: boolean;
  resumeOnClose: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"Fish" | "Skills" | "Rivers" | "About">(
    "Fish",
  );
  const [showLicense, setShowLicense] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const version = Constants.expoConfig?.version;
  const adDiagnostic = useSyncExternalStore(
    subscribeRewarded,
    getRewardedDiagnostic,
    getRewardedDiagnostic,
  );
  const openLink = async (url: string) => {
    setLinkError(null);
    try {
      await Linking.openURL(url);
    } catch {
      setLinkError(
        "Unable to open the link. For help, email mablic@hotmail.com.",
      );
    }
  };
  const { height } = useWindowDimensions();
  return (
    <View style={s.scrim} accessibilityViewIsModal>
      <View style={[s.card, { maxHeight: height * 0.86 }]}>
        <Text style={theme.kicker}>
          {inRun ? "GAME PAUSED · FIELD GUIDE" : "FIELD GUIDE"}
        </Text>
        <Text style={[theme.title, { fontSize: 30 }]}>Know the river</Text>
        <View style={s.tabs}>
          {(["Fish", "Skills", "Rivers", "About"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t }}
              style={[s.tab, tab === t && s.active]}
            >
              <Text
                style={{
                  color: tab === t ? COLORS.paper : COLORS.ink,
                  fontWeight: "600",
                }}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </View>
        <ScrollView
          key={tab}
          style={{ flexShrink: 1 }}
          contentContainerStyle={{ paddingBottom: 12 }}
          showsVerticalScrollIndicator
        >
          {tab === "Fish" && (
            <>
              <Text style={s.body}>
                Hold, drag to aim, release to cast. Lead moving fish.
                Gold-glowing fish score ×3. Chain 3 catches for ×1.5; 6 for ×2.
                {" "}Your first streaks of 3 and 6 each earn +2 seconds, up to
                4 bonus seconds per run. The aim preview stops at your finger's
                distance or the charged range, whichever is shorter; wind still
                bends the flight.
              </Text>
              {SPECIES.map((fish, i) => (
                <View key={i} style={s.row}>
                  <FishPortrait kind={i} />
                  <View style={s.copy}>
                    <Text style={s.title}>
                      {fish.name}
                      {level.roster.includes(i) ? " · HERE" : ""}
                    </Text>
                    <Text style={s.meta}>
                      {fish.behaviour === "protected"
                        ? `PROTECTED · −${Math.abs(fish.points)} POINTS`
                        : `${fish.points} POINTS · ${fish.hp} STRIKE${fish.hp === 1 ? "" : "S"}`}
                    </Text>
                    <Text style={s.body}>{fish.blurb}</Text>
                  </View>
                </View>
              ))}
            </>
          )}
          {tab === "Skills" && (
            <>
              <Text style={s.body}>
                Spear a stitched martial-arts manual to learn its technique. The
                cover seal matches your equipment badge and sword aura. A new
                manual replaces your technique and restores 3 uses.
              </Text>
              <Text style={s.body}>
                Every manual grants exactly 3 casts, including Heavenly Swords.
                Uses never expire with time. One release uses one charge, even
                for twin swords; misses still count. After the third cast, your
                normal sword returns. Pausing never consumes a use.
              </Text>
              <Text style={s.body}>Earn 2 stars in levels 6, 18, 30 and 36 to unlock two techniques each time. All eight are available for the final chapter. Unlocked manuals stay available when replaying earlier rivers.</Text>
              {SKILLS.map((skill) => (
                <View key={skill} style={s.row}>
                  <View style={[s.emblem, { borderColor: SKILL_COLOR[skill] }]}>
                    <Text style={{ fontSize: 23, color: SKILL_COLOR[skill] }}>
                      {SKILL_MARK[skill]}
                    </Text>
                  </View>
                  <View style={s.copy}>
                    <Text style={s.title}>{SKILL_LABEL[skill]}</Text>
                    <Text style={s.meta}>
                      {`3 CASTS · UNLOCK AFTER LEVEL ${MANUAL_UNLOCKS.find(reward => reward.skills.includes(skill))?.afterLevel}`}
                    </Text>
                    <Text style={s.body}>
                      {SKILL_HINT[skill]}.{" "}
                      {skill === "storm"
                        ? "One strike per visible fish; armored fish may survive. Hidden fish are sheltered."
                        : skill === "spin"
                          ? "Hits once per fish per cast, not every rotation."
                          : skill === "kungfu"
                            ? "Drag up or down to choose a row. Release to cleave fish on both sides instantly, including armor. Fish above and below are untouched. Protected creatures and hidden fish are spared."
                            : "Avoid turtles, squid and seahorses: hitting them costs points."}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}
          {tab === "About" && (
            <>
              <Text style={s.title}>
                Kung Fu Fisher{version ? ` · ${version}` : ""}
              </Text>
              <Text style={s.body}>
                A single-player arcade fishing game inspired by Chinese wuxia.
                Practice timing and aim in short, score-based challenges across
                {` ${LEVELS.length} levels and ${CHAPTERS.length} regions.`}
              </Text>
              <Text style={s.title}>Play without an account</Text>
              <Text style={s.body}>
                No game account, subscriptions or in-app purchases are required.
                Gameplay works offline. Level progress and preferences stay on
                this device. Achievements are saved locally on this device.
              </Text>
              <Text style={s.title}>Optional ads</Text>
              <Text style={s.body}>
                When an ad is available at time-up, you may earn 15 extra
                seconds, once per run. You can skip the offer and retry for
                free. Ads require an internet connection; their availability
                varies. Skipping an ad does not block normal gameplay.
              </Text>
              <Text style={s.title}>Privacy summary</Text>
              <Text style={s.body}>
                Google AdMob and its consent service support advertising. On
                iOS, the app does not ask for tracking permission. The SDK may
                process device identifiers, IP address, ad interactions and
                diagnostic data. Non-personalized ads can still process data.
                Where required, Ad privacy choices are available on the home
                screen.
              </Text>
              <Pressable
                accessibilityRole="link"
                onPress={() =>
                  openLink("https://tradepartner.fyi/kungfu-fisher/privacy")
                }
                style={{ paddingVertical: 12 }}
              >
                <Text style={s.title}>Kung Fu Fisher Privacy Policy ↗</Text>
              </Pressable>
              <Pressable
                accessibilityRole="link"
                onPress={() => openLink("https://policies.google.com/privacy")}
                style={{ paddingVertical: 12 }}
              >
                <Text style={s.title}>Google Privacy Policy ↗</Text>
              </Pressable>
              <Text style={s.title}>Support</Text>
              <Text selectable style={s.meta}>
                Ad support reference: {adDiagnostic}
              </Text>
              <Pressable
                accessibilityRole="link"
                onPress={() =>
                  openLink("https://tradepartner.fyi/kungfu-fisher/support")
                }
                style={{ paddingVertical: 12 }}
              >
                <Text style={s.title}>Support website ↗</Text>
              </Pressable>
              <Text style={s.body}>
                Questions or a problem? Contact mablic@hotmail.com. Please
                include your device model, operating system version and game
                version.
              </Text>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Email Kung Fu Fisher support"
                onPress={() =>
                  openLink(
                    "mailto:mablic@hotmail.com?subject=Kung%20Fu%20Fisher%20Support",
                  )
                }
                style={{ paddingVertical: 12 }}
              >
                <Text style={s.title}>Email support ↗</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: showLicense }}
                onPress={() => setShowLicense((value) => !value)}
                style={{ paddingVertical: 12 }}
              >
                <Text style={s.title}>
                  {showLicense ? "Hide font license" : "Font license"}
                </Text>
              </Pressable>
              {showLicense && (
                <Text selectable style={s.body}>
                  {FONT_LICENSE}
                </Text>
              )}
              {linkError && (
                <Text accessibilityRole="alert" style={s.body}>
                  {linkError}
                </Text>
              )}
            </>
          )}
          {tab === "Rivers" && (
            <>
              <Text style={s.title}>
                Level {level.id} · {level.name}
              </Text>
              <Text style={s.body}>
                Score {level.stars[0]} / {level.stars[1]} / {level.stars[2]} for
                1 / 2 / 3 stars in {level.seconds}s. Two stars unlock the next
                level. Play continues after clearing.
              </Text>
              <Text style={s.body}>
                Swell:{" "}
                {level.waves < 0.1
                  ? "calm"
                  : level.waves < 0.65
                    ? "rolling"
                    : "heavy"}
                .{" "}
                {level.windShift
                  ? "Wind changes direction."
                  : level.wind
                    ? "Watch the pennant for wind direction."
                    : "No prevailing wind."}
              </Text>
              {CHAPTERS.map((chapter, i) => (
                <View key={chapter.name} style={s.chapter}>
                  <Text style={s.title}>
                    {i + 1}. {chapter.name}
                  </Text>
                  <Text style={s.body}>
                    {chapter.subtitle} · levels {i * 6 + 1}–{i * 6 + 6}
                  </Text>
                  <Text style={s.body}>
                    {
                      [
                        "Calm water, charge control and small fast fish.",
                        "Sudden turns and wind. Compensate for sideways drift.",
                        "Armored fish, rolling swell and fog. The launch point drifts with the boat.",
                        "Lantern light reveals fish in the dark. Aim to search the water.",
                        "Strong sideways drift, swell, gusts and storm visibility combine.",
                        "Coastal currents and armored sharks. Save piercing or heavy techniques for larger fish.",
                        "Swordfish, hammerheads and giant groupers combine with late-stage weather challenges.",
                      ][i]
                    }
                  </Text>
                </View>
              ))}
              {LEVELS.map((l) => (
                <View key={l.id} style={s.level}>
                  <Text style={s.title}>
                    {l.id}. {l.name}
                  </Text>
                  <Text style={s.body}>
                    {l.seconds}s · clear {l.stars[0]} · {l.weather}
                    {l.waves >= 0.65
                      ? " · heavy swell"
                      : l.waves > 0
                        ? " · rolling swell"
                        : ""}
                    {l.intro ? `\n${MECHANICS[l.intro].body}` : ""}
                  </Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
        <Button
          compact
          label={resumeOnClose ? "Resume fishing" : "Close guide"}
          onPress={onClose}
          id="close-guide"
        />
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  scrim: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(9,29,29,.65)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    zIndex: 50,
  },
  card: {
    width: "100%",
    maxWidth: 460,
    backgroundColor: COLORS.paper,
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  tabs: { flexDirection: "row", gap: 6, marginVertical: 14 },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    backgroundColor: "#E2DBC9",
  },
  active: { backgroundColor: COLORS.ink },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  copy: { flex: 1 },
  title: {
    color: COLORS.ink,
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 3,
  },
  meta: {
    color: COLORS.red,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.7,
    marginBottom: 3,
  },
  body: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginBottom: 5 },
  emblem: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#173D39",
    borderWidth: 2,
    borderRadius: 8,
  },
  chapter: { marginTop: 12, padding: 10, backgroundColor: "#E9E1CD" },
  level: { marginTop: 10 },
});
