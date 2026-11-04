import React, { useCallback } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from "react-native";
import { CHAPTERS, LEVELS, type LevelRules } from "../levels";
import { isUnlocked, type Save } from "../save";
import { COLORS, hazards, SealStamp, Stars, styles as theme } from "./theme";

type ChapterItem = { index: number; levels: LevelRules[] };
const CHAPTER_ITEMS: ChapterItem[] = CHAPTERS.map((_, index) => ({
  index,
  levels: LEVELS.filter((l) => l.chapter === index),
}));

export function LevelMap({
  save,
  totalStars,
  currentId,
  top,
  bottom,
  onPick,
  onClose,
}: {
  save: Save;
  totalStars: number;
  currentId: number;
  top: number;
  bottom: number;
  onPick: (level: LevelRules) => void;
  onClose: () => void;
}) {
  const renderItem: ListRenderItem<ChapterItem> = useCallback(
    ({ item }) => (
      <ChapterCard
        item={item}
        save={save}
        currentId={currentId}
        onPick={onPick}
      />
    ),
    [save, currentId, onPick],
  );
  return (
    <View style={[styles.root, { paddingTop: top + 8 }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onClose}
          hitSlop={12}
          style={styles.back}
        >
          <Text style={styles.backText}>‹ River</Text>
        </Pressable>
        <View style={styles.total}>
          <Text style={styles.totalStar}>★</Text>
          <Text style={styles.totalText}>
            {totalStars}
            <Text style={styles.totalOf}> / {LEVELS.length * 3}</Text>
          </Text>
        </View>
      </View>
      <Text style={[theme.title, styles.heading]}>Forty-two Rivers</Text>
      <FlatList
        data={CHAPTER_ITEMS}
        keyExtractor={keyOf}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: bottom + 24, gap: 14 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={5}
        removeClippedSubviews
        initialScrollIndex={Math.max(
          0,
          Math.min(CHAPTERS.length - 1, LEVELS[currentId - 1].chapter),
        )}
        onScrollToIndexFailed={noop}
        getItemLayout={getItemLayout}
      />
    </View>
  );
}
const CARD_HEIGHT = 262,
  CARD_GAP = 14;
function getItemLayout(_: unknown, index: number) {
  return {
    length: CARD_HEIGHT,
    offset: (CARD_HEIGHT + CARD_GAP) * index,
    index,
  };
}
function keyOf(item: ChapterItem) {
  return String(item.index);
}
function noop() {}

const ChapterCard = React.memo(function ChapterCard({
  item,
  save,
  currentId,
  onPick,
}: {
  item: ChapterItem;
  save: Save;
  currentId: number;
  onPick: (level: LevelRules) => void;
}) {
  const chapter = CHAPTERS[item.index],
    first = item.levels[0],
    // Development access never writes fake stars or unlocks into the save.
    open = __DEV__ || isUnlocked(save, first.id),
    stars = item.levels.reduce(
      (sum, l) => sum + (save.levels[l.id]?.stars ?? 0),
      0,
    ),
    seals = item.levels.filter((l) => save.levels[l.id]?.seal).length;
  return (
    <View style={[styles.card, !open && styles.cardLocked]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={theme.kicker}>CHAPTER {ROMAN[item.index]}</Text>
          <Text style={styles.chapterName}>{chapter.name}</Text>
          <Text style={styles.chapterSub}>{chapter.subtitle}</Text>
        </View>
        <View style={styles.chapterTally}>
          <Text style={styles.chapterStars}>
            ★ {stars}
            <Text style={styles.totalOf}>/18</Text>
          </Text>
          <View style={styles.sealTally}>
            <SealStamp earned={seals > 0} size={11} />
            <Text style={styles.sealCount}>
              {seals}
              <Text style={styles.totalOf}>/6</Text>
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.grid}>
        {item.levels.map((level) => (
          <LevelTile
            key={level.id}
            level={level}
            stars={save.levels[level.id]?.stars ?? 0}
            seal={!!save.levels[level.id]?.seal}
            unlocked={__DEV__ || isUnlocked(save, level.id)}
            current={level.id === currentId}
            onPick={onPick}
          />
        ))}
      </View>
    </View>
  );
});
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

const LevelTile = React.memo(function LevelTile({
  level,
  stars,
  seal,
  unlocked,
  current,
  onPick,
}: {
  level: LevelRules;
  stars: number;
  seal: boolean;
  unlocked: boolean;
  current: boolean;
  onPick: (level: LevelRules) => void;
}) {
  const tag = level.challenge
    ? "TRIAL"
    : level.intro
      ? "NEW"
      : (hazards(level)[0] ?? "");
  const press = useCallback(() => onPick(level), [onPick, level]);
  return (
    <Pressable
      testID={`level-${level.id}`}
      accessibilityRole="button"
      accessibilityLabel={
        unlocked
          ? `Level ${level.id}, ${level.name}, ${stars} stars${seal ? ", seal earned" : ""}`
          : `Level ${level.id}, locked. Earn 2 stars in the previous level.`
      }
      accessibilityState={{ disabled: !unlocked }}
      disabled={!unlocked}
      onPress={press}
      style={({ pressed }) => [
        styles.tile,
        current && styles.tileCurrent,
        !unlocked && styles.tileLocked,
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      {seal && (
        <View style={styles.tileSeal}>
          <SealStamp earned size={11} />
        </View>
      )}
      {unlocked ? (
        <Text style={styles.tileNumber}>{level.id}</Text>
      ) : (
        <View style={styles.lock}>
          <View style={styles.lockShackle} />
          <View style={styles.lockBody} />
        </View>
      )}
      {unlocked ? (
        <Stars count={stars} size={11} gap={1} />
      ) : (
        <Text style={styles.lockText}>Locked</Text>
      )}
      <Text
        numberOfLines={1}
        style={[styles.tileTag, tag === "NEW" && styles.tileNew]}
      >
        {unlocked ? tag : "2★ TO OPEN"}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.paper,
    paddingHorizontal: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: { paddingVertical: 8, paddingRight: 12 },
  backText: { fontSize: 15, color: COLORS.ink },
  total: { flexDirection: "row", alignItems: "baseline", gap: 5 },
  totalStar: { color: COLORS.star, fontSize: 16 },
  totalText: {
    fontSize: 16,
    color: COLORS.ink,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  totalOf: { fontSize: 11, color: COLORS.muted, fontWeight: "400" },
  heading: { marginTop: 0, marginBottom: 12 },
  card: {
    height: CARD_HEIGHT,
    backgroundColor: "#F8F3E6",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 16,
  },
  cardLocked: { opacity: 0.6 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start" },
  chapterName: {
    fontFamily: "Jianghu",
    fontSize: 25,
    color: COLORS.ink,
    marginTop: 2,
  },
  chapterSub: { fontSize: 11, color: COLORS.muted },
  chapterTally: { alignItems: "flex-end", gap: 4 },
  sealTally: { flexDirection: "row", alignItems: "center", gap: 5 },
  sealCount: {
    fontSize: 12,
    color: "#B23A2A",
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  tileSeal: { position: "absolute", top: 6, right: 6 },
  chapterStars: {
    fontSize: 14,
    color: COLORS.star,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  tile: {
    width: "31.6%",
    height: 72,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#D7CCAF",
    backgroundColor: COLORS.paper,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  tileCurrent: {
    borderColor: COLORS.red,
    borderWidth: 1.5,
    backgroundColor: "#FBF1E0",
  },
  tileLocked: { backgroundColor: "#ECE6D6" },
  tileNumber: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "600",
    color: COLORS.ink,
    fontVariant: ["tabular-nums"],
  },
  lockText: { fontSize: 9, color: "#A9A493", letterSpacing: 1 },
  lock: { alignItems: "center", height: 25, justifyContent: "flex-end" },
  lockShackle: {
    width: 10,
    height: 8,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: "#A9A493",
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  lockBody: {
    width: 15,
    height: 11,
    borderRadius: 2,
    backgroundColor: "#A9A493",
  },
  tileTag: {
    fontSize: 8.5,
    color: "#8D7550",
    letterSpacing: 0.5,
    maxWidth: "92%",
  },
  tileNew: { color: COLORS.red, fontWeight: "700" },
});
