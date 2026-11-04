import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MECHANICS, type LevelRules, type Seal } from "../levels";
import { FISH, SPECIES } from "../species";

export const COLORS = {
  ink: "#253E37",
  muted: "#657368",
  paper: "#F3EDDD",
  gold: "#D5B67A",
  red: "#9E4F3D",
  star: "#C9952F",
  line: "#DCD2B8",
};

export function Button({
  label,
  onPress,
  id,
  disabled = false,
  compact = false,
}: {
  label: string;
  onPress: () => void;
  id?: string;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <Pressable
      testID={id}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primary,
        compact && { minHeight: 48 },
        disabled && { opacity: 0.5 },
        pressed && { transform: [{ scale: 0.98 }], backgroundColor: "#803A2C" },
      ]}
    >
      <View style={styles.buttonCornerLeft} />
      <Text style={[styles.primaryText, compact && { fontSize: 23 }]}>
        {label}
      </Text>
      <Text style={styles.arrow}>↗</Text>
      <View style={styles.buttonCornerRight} />
    </Pressable>
  );
}
export function SecondaryButton({
  label,
  onPress,
  id,
}: {
  label: string;
  onPress: () => void;
  id?: string;
}) {
  return (
    <Pressable
      testID={id}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.6 }]}
    >
      <Text style={styles.secondaryText}>{label}</Text>
    </Pressable>
  );
}
export const Stars = React.memo(function Stars({
  count,
  size = 14,
  gap = 2,
}: {
  count: number;
  size?: number;
  gap?: number;
}) {
  return (
    <View
      style={{ flexDirection: "row", gap }}
      accessibilityLabel={`${count} of 3 stars`}
    >
      {[0, 1, 2].map((i) => (
        <Text
          key={i}
          style={{
            fontSize: size,
            lineHeight: size * 1.2,
            color: i < count ? COLORS.star : "#CFC5AC",
          }}
        >
          ★
        </Text>
      ))}
    </View>
  );
});
export function Toggles({
  values,
  onToggle,
}: {
  values: { sound: boolean; music: boolean; haptics: boolean };
  onToggle: (key: "sound" | "music" | "haptics") => void;
}) {
  return (
    <View style={styles.toggles}>
      {(["sound", "music", "haptics"] as const).map((key) => (
        <Pressable
          key={key}
          accessibilityRole="switch"
          accessibilityState={{ checked: values[key] }}
          accessibilityLabel={key}
          onPress={() => onToggle(key)}
          hitSlop={8}
          style={styles.toggle}
        >
          <View style={[styles.toggleDot, values[key] && styles.toggleOn]} />
          <Text style={styles.toggleText}>
            {key[0].toUpperCase() + key.slice(1)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
// Short labels for the hazards a level adds, most significant first.
export function hazards(level: LevelRules) {
  const list: string[] = [];
  const has = (kind: number) => level.roster.includes(kind);
  if (level.challenge) list.push("Trial");
  if (has(FISH.shark) || has(FISH.hammerhead)) list.push("Sharks");
  if (has(FISH.grouper)) list.push("Giant grouper");
  if (has(FISH.swordfish)) list.push("Swordfish");
  if (has(FISH.dragon)) list.push("Dragon carp");
  if (has(FISH.sturgeon)) list.push("Sturgeon");
  if (level.thunder) list.push("Thunder");
  if (level.weather === "storm") list.push("Storm");
  else if (level.weather === "night") list.push("Night");
  else if (level.fog >= 0.3) list.push("Rain veil");
  else if (level.fog > 0) list.push("Mist");
  if (level.windShift) list.push("Shifting wind");
  else if (level.wind) list.push("Wind");
  if (level.waves) list.push("Swell");
  if (has(FISH.turtle)) list.push("Turtles");
  if (has(FISH.lantern)) list.push("Lantern koi");
  if (has(FISH.catfish)) list.push("Burrowers");
  if (has(FISH.iron)) list.push("Armoured");
  if (has(FISH.puffer)) list.push("Puffers");
  if (has(FISH.mandarin)) list.push("Ambushers");
  if (has(FISH.eel)) list.push("Eels");
  if (has(FISH.flick)) list.push("Quick turners");
  if (has(FISH.fry)) list.push("Small fish");
  if (level.speed > 1.05) list.push(`Fast ×${level.speed.toFixed(2)}`);
  return list;
}
export function sealLabel(seal: Seal) {
  switch (seal.type) {
    case "catch":
      return seal.count === 1
        ? `Land the ${SPECIES[seal.fish].name.toLowerCase()}`
        : `Land ${seal.count} × ${SPECIES[seal.fish].name.toLowerCase()}`;
    case "combo":
      return `Reach a combo of ${seal.count}`;
    case "golden":
      return seal.count === 1
        ? "Land a golden fish"
        : `Land ${seal.count} golden fish`;
    case "steady":
      return `Miss ${seal.misses} casts or fewer`;
    case "spare":
      return "Leave all protected creatures unharmed";
  }
}
// Compact in-run progress for the HUD chip.
export function sealStatus(seal: Seal, value: number) {
  switch (seal.type) {
    case "catch":
    case "combo":
    case "golden":
      return `${Math.min(value, seal.count)}/${seal.count}`;
    case "steady":
      return `${value}/${seal.misses} misses`;
    case "spare":
      return value ? "protected creature hit" : "protected creatures safe";
  }
}
// A vermilion seal-stamp mark; hollow until earned.
export const SealStamp = React.memo(function SealStamp({
  earned,
  size = 18,
}: {
  earned: boolean;
  size?: number;
}) {
  return (
    <View
      accessibilityLabel={earned ? "Seal earned" : "Seal not yet earned"}
      style={[
        styles.stamp,
        { width: size, height: size, borderRadius: size * 0.14 },
        earned ? styles.stampOn : styles.stampOff,
      ]}
    >
      <View
        style={[
          styles.stampInner,
          { borderColor: earned ? "#F6DCC8" : "#C7A98F" },
        ]}
      />
    </View>
  );
});
export function introFor(level: LevelRules) {
  return level.intro ? MECHANICS[level.intro] : null;
}

export const styles = StyleSheet.create({
  primary: {
    minHeight: 54,
    backgroundColor: COLORS.red,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 15,
    overflow: "hidden",
  },
  primaryText: {
    fontFamily: "Jianghu",
    fontSize: 26,
    color: "#FCF0D4",
    letterSpacing: 1,
  },
  arrow: { color: "#E3C18C", fontSize: 21 },
  buttonCornerLeft: {
    position: "absolute",
    top: 5,
    left: 5,
    width: 9,
    height: 9,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: "#D4A97A",
  },
  buttonCornerRight: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 9,
    height: 9,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#D4A97A",
  },
  secondary: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  secondaryText: { fontSize: 13, color: COLORS.muted },
  toggles: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 22,
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  toggleDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#8F9A8D",
  },
  toggleOn: { backgroundColor: COLORS.red, borderColor: COLORS.red },
  toggleText: { fontSize: 12, color: "#556B5D" },
  kicker: {
    fontSize: 10,
    letterSpacing: 2,
    color: COLORS.red,
    fontWeight: "600",
  },
  title: {
    fontFamily: "Jianghu",
    fontSize: 34,
    color: COLORS.ink,
    marginTop: 8,
    lineHeight: 42,
  },
  description: {
    fontSize: 12,
    lineHeight: 19,
    color: COLORS.muted,
    marginTop: 6,
  },
  stamp: {
    padding: 2.5,
    transform: [{ rotate: "-6deg" }],
  },
  stampOn: { backgroundColor: "#B23A2A" },
  stampOff: { borderWidth: 1, borderColor: "#C7A98F", borderStyle: "dashed" },
  stampInner: { flex: 1, borderWidth: 1, borderRadius: 1.5 },
  chip: {
    fontSize: 10,
    color: "#7A6440",
    borderWidth: 1,
    borderColor: "#CDBF9F",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 3,
    overflow: "hidden",
  },
});
