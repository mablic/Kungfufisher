import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { setAdProvider, type AdResult } from "../ads";
import { setAudioActive } from "../audio";
import { CONTINUE } from "../continues";
import { COLORS } from "./theme";

const AD_SECONDS = CONTINUE.adSeconds;

// Development stand-in for a rewarded ad network, so the overtime flow can be
// played in Expo Go. Release builds register the real SDK instead.
export const SimulatedAd = React.memo(function SimulatedAd() {
  const [left, setLeft] = useState<number | null>(null),
    resolver = useRef<((result: AdResult) => void) | null>(null);
  useEffect(() => {
    setAdProvider({
      ready: () => resolver.current === null,
      showRewarded: () =>
        new Promise<AdResult>((resolve) => {
          resolver.current = resolve;
          setAudioActive(false);
          setLeft(AD_SECONDS);
        }),
    });
    return () => {
      resolver.current?.("failed");
      resolver.current = null;
      setAdProvider(null);
    };
  }, []);
  useEffect(() => {
    if (left === null || left <= 0) return;
    const timer = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);
  if (left === null) return null;
  const close = () => {
    const resolve = resolver.current;
    resolver.current = null;
    setLeft(null);
    setAudioActive(true);
    resolve?.(left <= 0 ? "rewarded" : "dismissed");
  };
  return (
    <View style={styles.scrim}>
      <Text style={styles.label}>TEST AD</Text>
      <Text style={styles.title}>Your advertisement here</Text>
      <Text style={styles.body}>
        {left > 0
          ? `Reward in ${left}s`
          : "Reward earned · close to keep fishing"}
      </Text>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.min(100, ((AD_SECONDS - Math.max(0, left)) / AD_SECONDS) * 100)}%`,
            },
          ]}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={left > 0 ? "Skip ad" : "Close ad"}
        onPress={close}
        hitSlop={12}
        style={styles.close}
      >
        <Text style={styles.closeText}>{left > 0 ? "Skip" : "Close ✕"}</Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#111816",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    zIndex: 100,
  },
  label: {
    color: COLORS.gold,
    fontSize: 12,
    letterSpacing: 3,
    marginBottom: 12,
  },
  title: {
    color: "#F3EDDD",
    fontSize: 28,
    textAlign: "center",
    fontFamily: "Jianghu",
  },
  body: { color: "#B9B3A2", fontSize: 15, marginTop: 12 },
  track: {
    width: 220,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFFFFF22",
    marginTop: 18,
    overflow: "hidden",
  },
  fill: { height: 4, backgroundColor: COLORS.gold },
  close: {
    position: "absolute",
    top: 64,
    right: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#FFFFFF22",
  },
  closeText: { color: "#F3EDDD", fontSize: 14 },
});
