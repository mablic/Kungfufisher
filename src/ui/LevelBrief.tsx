import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, useWindowDimensions } from "react-native";
import { MANUAL_UNLOCKS, MANUAL_LESSON, unlockedManuals } from "../skillProgression";
import { SKILL_LABEL, SKILL_MARK } from "../skills";
import { CHAPTERS, type LevelRules } from "../levels";
import type { LevelRecord } from "../save";
import {
  Button,
  COLORS,
  hazards,
  introFor,
  SealStamp,
  SecondaryButton,
  sealLabel,
  Stars,
  styles as theme,
} from "./theme";

export function LevelBrief({
  level,
  record,
  completedLevel,
  seenManuals,
  isNew,
  bottom,
  onStart,
  onBack,
}: {
  level: LevelRules;
  record: LevelRecord | undefined;
  completedLevel: number;
  seenManuals: readonly string[];
  isNew: boolean;
  bottom: number;
  onStart: () => void;
  onBack: () => void;
}) {
  const { height } = useWindowDimensions();
  const manuals = unlockedManuals(__DEV__ ? Math.max(completedLevel, level.id - 1) : completedLevel);
  const [showManuals, setShowManuals] = useState(false);
  const hasNew = manuals.some(skill => !seenManuals.includes(`manual:${skill}`));
  const nextReward = MANUAL_UNLOCKS.find(reward => reward.afterLevel >= level.id && reward.afterLevel > completedLevel);
  const intro = introFor(level),
    tags = hazards(level);
  return (
    <ScrollView style={[styles.sheet, { maxHeight: height * 0.88 }]} contentContainerStyle={{ paddingBottom: bottom }} bounces={false}>
      <View style={styles.row}>
        <Text style={theme.kicker}>
          {level.challenge ? "TRIAL" : "LEVEL"} {level.id} ·{" "}
          {CHAPTERS[level.chapter].name.toUpperCase()}
        </Text>
        {record && record.stars > 0 && <Stars count={record.stars} size={13} />}
      </View>
      <Text style={theme.title}>{level.name}</Text>
      <Text style={styles.introBody}>Earn 2 stars to unlock the next river. One star saves your catch; three stars show mastery.</Text>
      <View style={styles.goals}>
        {level.stars.map((score, i) => (
          <View key={i} style={styles.goal}>
            <Stars count={i + 1} size={10} gap={0} />
            <Text style={styles.goalScore}>{score}</Text>
          </View>
        ))}
        <View style={styles.goal}>
          <Text style={styles.goalLabel}>TIME</Text>
          <Text style={styles.goalScore}>{level.seconds}s</Text>
        </View>
      </View>
      <View style={styles.seal}>
        <SealStamp earned={!!record?.seal} size={20} />
        <View style={{ flex: 1 }}>
          <Text style={styles.sealKicker}>
            {record?.seal ? "SEAL EARNED" : "SEAL CHALLENGE"}
          </Text>
          <Text style={styles.sealText}>
            {sealLabel(level.seal)}, and clear the level.
          </Text>
        </View>
      </View>
      {intro && (
        <View style={[styles.intro, isNew && styles.introNew]}>
          {isNew && <Text style={styles.newTag}>NEW</Text>}
          <Text style={styles.introTitle}>{intro.title}</Text>
          <Text style={styles.introBody}>{intro.body}</Text>
        </View>
      )}
      {tags.length > 0 && (
        <View style={styles.tags}>
          {tags.map((tag) => (
            <Text key={tag} style={theme.chip}>
              {tag}
            </Text>
          ))}
        </View>
      )}
      {record && record.best > 0 && (
        <Text style={styles.best}>
          Best {record.best} · best combo {record.bestCombo}
        </Text>
      )}
      <View style={styles.intro}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: hasNew || showManuals }} onPress={() => setShowManuals(value => !value)}>
          <Text style={styles.introTitle}>{hasNew ? "NEW TECHNIQUES UNLOCKED" : `YOUR MANUALS · ${manuals.length}/8`}</Text>
          <Text style={styles.introBody}>
            {manuals.length ? "Hit a drifting book to equip it. Each book grants 3 casts. A new book replaces your current technique. Tap to review." : "Learn your cast first. Earn 2 stars in Mistwood Trial (level 6) to unlock your first two techniques."}
          </Text>
        </Pressable>
        {(showManuals ? manuals : manuals.filter(skill => !seenManuals.includes(`manual:${skill}`))).map(skill => (
          <View key={skill} style={{ marginTop: 12, borderTopWidth: 1, borderColor: COLORS.line, paddingTop: 8 }}>
            <Text style={styles.introTitle}>{SKILL_MARK[skill]} {SKILL_LABEL[skill]} · 3 CASTS</Text>
            <Text style={styles.introBody}>{MANUAL_LESSON[skill]}</Text>
          </View>
        ))}
        {nextReward && <Text style={[styles.introBody, { marginTop: 8 }]}>Earn 2 stars in level {nextReward.afterLevel} to unlock {nextReward.skills.map(skill => SKILL_LABEL[skill]).join(" + ")}.</Text>}
      </View>
      <Button id="primary-action" label="Cast off" onPress={onStart} />
      <SecondaryButton label="All levels" onPress={onBack} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    borderWidth: 1,
    borderColor: "#D4C8A8",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goals: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.line,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 12,
  },
  goal: { alignItems: "center", gap: 3, minWidth: 60 },
  goalLabel: {
    fontSize: 9,
    color: COLORS.muted,
    letterSpacing: 1,
    lineHeight: 12,
  },
  goalScore: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.ink,
    fontVariant: ["tabular-nums"],
  },
  seal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  sealKicker: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: "#B23A2A",
    fontWeight: "700",
  },
  sealText: { fontSize: 12, color: COLORS.ink, marginTop: 1 },
  intro: {
    backgroundColor: "#EFE6D0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  introNew: {
    backgroundColor: "#F6E3D2",
    borderWidth: 1,
    borderColor: "#E3B79C",
  },
  newTag: {
    fontSize: 9,
    letterSpacing: 2,
    color: COLORS.red,
    fontWeight: "700",
    marginBottom: 2,
  },
  introTitle: { fontSize: 14, fontWeight: "700", color: COLORS.ink },
  introBody: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.muted,
    marginTop: 3,
  },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  best: {
    fontSize: 11,
    color: "#886C45",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
});
