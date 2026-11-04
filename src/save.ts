import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { canEnterLevel } from "./progression";
import { LEVELS, starsFor } from "./levels";

const SAVE_KEY = "jianghu-fishing/save-v2",
  LEGACY_KEY = "jianghu-fishing/preferences-v1";
export type LevelRecord = {
  best: number;
  stars: number;
  bestCombo: number;
  seal: boolean;
};
export type Save = {
  haptics: boolean;
  sound: boolean;
  music: boolean;
  levels: Record<number, LevelRecord>;
  // Mechanic briefings the player has already seen.
  seen: string[];
  // The first overtime is a gift, so players learn what the ad would buy.
  freeOvertimeUsed: boolean;
};
const EMPTY: Save = {
  haptics: true,
  sound: true,
  music: true,
  levels: {},
  seen: [],
  freeOvertimeUsed: false,
};
function count(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}
export function parseSave(raw: string | null, legacy: string | null): Save {
  const save: Save = { ...EMPTY, levels: {}, seen: [] };
  try {
    const old = legacy ? JSON.parse(legacy) : null;
    if (old && old.haptics === false) save.haptics = false;
  } catch {}
  try {
    const value = raw ? JSON.parse(raw) : null;
    if (!value || typeof value !== "object") return save;
    save.haptics = value.haptics !== false;
    save.sound = value.sound !== false;
    save.music = value.music !== false;
    save.freeOvertimeUsed = value.freeOvertimeUsed === true;
    if (Array.isArray(value.seen))
      save.seen = value.seen.filter((s: unknown) => typeof s === "string");
    for (const level of LEVELS) {
      const record = value.levels?.[level.id];
      if (!record) continue;
      const best = count(record.best);
      save.levels[level.id] = {
        best,
        stars: Math.min(
          3,
          Math.max(count(record.stars), starsFor(best, level)),
        ),
        bestCombo: count(record.bestCombo),
        seal: record.seal === true,
      };
    }
  } catch {}
  return save;
}
export function isUnlocked(save: Save, id: number) {
  return canEnterLevel(save.levels, id);
}
export function useSave() {
  const [save, setSave] = useState<Save>(EMPTY),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    AsyncStorage.multiGet([SAVE_KEY, LEGACY_KEY])
      .then(([[, raw], [, legacy]]) => {
        if (alive) setSave(parseSave(raw, legacy));
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (loaded)
      void AsyncStorage.setItem(SAVE_KEY, JSON.stringify(save)).catch(() => {});
  }, [save, loaded]);
  const record = useCallback(
    (levelId: number, score: number, combo: number, seal: boolean) => {
      const level = LEVELS[levelId - 1];
      if (!level) return;
      setSave((previous) => {
        const old = previous.levels[levelId] ?? {
          best: 0,
          stars: 0,
          bestCombo: 0,
          seal: false,
        };
        const next = {
          best: Math.max(old.best, score),
          stars: Math.max(old.stars, starsFor(score, level)),
          bestCombo: Math.max(old.bestCombo, combo),
          seal: old.seal || seal,
        };
        if (
          next.best === old.best &&
          next.stars === old.stars &&
          next.bestCombo === old.bestCombo &&
          next.seal === old.seal &&
          previous.levels[levelId]
        )
          return previous;
        return { ...previous, levels: { ...previous.levels, [levelId]: next } };
      });
    },
    [],
  );
  const markSeen = useCallback((key: string) => {
    setSave((previous) =>
      previous.seen.includes(key)
        ? previous
        : { ...previous, seen: [...previous.seen, key] },
    );
  }, []);
  const spendFreeOvertime = useCallback(() => {
    setSave((previous) =>
      previous.freeOvertimeUsed
        ? previous
        : { ...previous, freeOvertimeUsed: true },
    );
  }, []);
  const toggle = useCallback((key: "haptics" | "sound" | "music") => {
    setSave((previous) => ({ ...previous, [key]: !previous[key] }));
  }, []);
  const totalStars = useMemo(
    () =>
      Object.values(save.levels).reduce((sum, record) => sum + record.stars, 0),
    [save.levels],
  );
  const totalSeals = useMemo(
    () => Object.values(save.levels).filter((record) => record.seal).length,
    [save.levels],
  );
  // The first unlocked level that still has stars to earn, else the last level.
  const nextLevelId = useMemo(() => {
    for (const level of LEVELS)
      if (
        isUnlocked(save, level.id) &&
        (save.levels[level.id]?.stars ?? 0) === 0
      )
        return level.id;
    for (const level of LEVELS)
      if (isUnlocked(save, level.id) && (save.levels[level.id]?.stars ?? 0) < 2)
        return level.id;
    for (const level of LEVELS)
      if (isUnlocked(save, level.id) && (save.levels[level.id]?.stars ?? 0) < 3)
        return level.id;
    return LEVELS.length;
  }, [save]);
  return {
    save,
    loaded,
    record,
    markSeen,
    spendFreeOvertime,
    toggle,
    totalStars,
    totalSeals,
    nextLevelId,
  };
}
