import React, { memo, useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { comboMultiplier } from "../game";

/** Anchored above the waterline, independent of the wrapping HUD chips. */
export const ComboBadge = memo(function ComboBadge({ combo, bestCombo, bottom, compact }: {
  combo: number; bestCombo: number; bottom: number; compact: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    scale.setValue(0.9);
    const pop = Animated.sequence([
      Animated.timing(scale, { toValue: 1.08, duration: 90, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]);
    pop.start();
    return () => pop.stop();
  }, [combo, scale]);
  const multiplier = comboMultiplier(combo);
  return (
    <Animated.View
      pointerEvents="none"
      // Reuse one composited layer while scaling the paper, seal and lettering.
      // This small layer exists only while the combo badge is mounted.
      shouldRasterizeIOS
      renderToHardwareTextureAndroid
      accessible
      accessibilityLabel={`${combo} hit combo. Score multiplier ${multiplier}.`}
      style={[styles.badge, { bottom, transform: [{ scale }] }]}
    >
      <View style={styles.inkStroke} />
      <View style={styles.heading}>
        <Text style={styles.title}>BLADE FLOW</Text>
        <View style={styles.seal}><Text style={styles.sealText}>HIT</Text></View>
      </View>
      <Text style={[styles.count, compact && styles.compact]}>×{combo}</Text>
      <Text style={styles.label}>COMBO</Text>
      <Text style={styles.bonus}>
        {multiplier > 1 ? `SCORE ×${multiplier}` : "KEEP IT GOING"}
      </Text>
      {bestCombo < 6 && (
        <Text style={styles.milestone}>{bestCombo < 3 ? 3 : 6} hits → +2s</Text>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  badge: {
    position: "absolute", right: 18, minWidth: 116,
    alignItems: "center", paddingHorizontal: 12, paddingVertical: 8,
    borderTopWidth: 1, borderBottomWidth: 2, borderColor: "#B4965E",
    backgroundColor: "#ECDDB5",
  },
  heading: { flexDirection: "row", alignItems: "center", gap: 7 },
  title: { fontSize: 10, color: "#353F36", letterSpacing: 1 },
  seal: { borderWidth: 1, borderColor: "#A43B2D", padding: 2, transform: [{ rotate: "-7deg" }] },
  sealText: { fontSize: 9, fontWeight: "700", color: "#A43B2D" },
  inkStroke: {
    position: "absolute", left: 8, right: 8, top: 38, height: 27,
    backgroundColor: "rgba(144,115,61,.10)", transform: [{ rotate: "-6deg" }],
    borderBottomWidth: 2, borderColor: "rgba(109,85,41,.18)",
  },
  count: {
    fontFamily: "Jianghu", fontSize: 48, lineHeight: 48, color: "#293E37",
    fontVariant: ["tabular-nums"],
  },
  compact: { fontSize: 36, lineHeight: 36 },
  label: { fontSize: 10, letterSpacing: 2, color: "#713A2D" },
  bonus: { fontSize: 10, fontWeight: "700", color: "#713A2D", marginTop: 3 },
  milestone: { fontSize: 9, color: "#625B46", marginTop: 3 },
});
