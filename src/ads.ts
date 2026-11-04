// Ad network seam. The game only asks for a rewarded ad and learns whether the
// reward was earned; a real SDK (e.g. AdMob via react-native-google-mobile-ads
// in a development build) registers itself with `setAdProvider`.

// Expo Go, and any binary built before the ads SDK was linked, has no
// RNGoogleMobileAdsModule. Loading the JS package there calls getEnforcing and
// throws. Callers must check the native module itself, not only Expo Go's
// execution environment, which is not always "storeClient".
export function shouldStartNativeAds(
  platform: string,
  executionEnvironment: string | null | undefined,
  appOwnership: string | null | undefined,
  hasNativeModule: boolean,
) {
  if (platform !== "ios" && platform !== "android") return false;
  if (executionEnvironment === "storeClient" || appOwnership === "expo")
    return false;
  return hasNativeModule;
}
export type AdResult = "rewarded" | "dismissed" | "failed";
export type AdProvider = {
  ready(): boolean;
  showRewarded(placement: string): Promise<AdResult>;
};

export type RewardedStatus =
  | "loading"
  | "ready"
  | "showing"
  | "no_fill"
  | "network"
  | "consent"
  | "failed"
  | "unavailable";
let rewardedDiagnostic = "Starting";
export function getRewardedDiagnostic() {
  return rewardedDiagnostic;
}
export function reportAdDiagnostic(source: string, error?: unknown) {
  const code = (error as { code?: unknown } | null)?.code;
  const safe =
    typeof code === "string" || typeof code === "number"
      ? String(code)
          .replace(/[^a-zA-Z0-9_./-]/g, "")
          .slice(0, 80)
      : "unknown";
  rewardedDiagnostic = error ? `${source}: ${safe}` : source;
  notifyAdAvailability();
}
let rewardedStatus: RewardedStatus = "loading";
export function getRewardedStatus() {
  return rewardedStatus;
}
export function setRewardedStatus(next: RewardedStatus) {
  if (rewardedStatus === next) return;
  rewardedStatus = next;
  notifyAdAvailability();
}
export function adFailureStatus(error: unknown): RewardedStatus {
  const code = String(
    (error as { code?: unknown } | null)?.code ?? "",
  ).toLowerCase();
  if (/no.?fill/.test(code)) return "no_fill";
  if (/network|timeout/.test(code)) return "network";
  return "failed";
}
export const AD_STATUS_TEXT: Record<RewardedStatus, string> = {
  loading: "Loading an optional ad… You can retry without waiting.",
  ready: "Keep your score and remaining skills. One continue per run.",
  showing: "Ad in progress…",
  no_fill: "No ads available right now. You can retry for free.",
  network: "Could not load an ad. Check your connection or retry for free.",
  consent: "Ads are currently unavailable. You can retry for free.",
  failed: "Ad unavailable. Please try again later or retry for free.",
  unavailable: "Ad unavailable. You can retry for free.",
};

let provider: AdProvider | null = null;
let showing = false;
const listeners = new Set<() => void>();
export function notifyAdAvailability() {
  for (const listener of listeners) listener();
}
export function subscribeRewarded(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function setAdProvider(next: AdProvider | null) {
  provider = next;
  setRewardedStatus(next?.ready() ? "ready" : next ? "loading" : "unavailable");
  notifyAdAvailability();
}
export function rewardedReady() {
  return !showing && !!provider?.ready();
}
export async function showRewarded(placement: string): Promise<AdResult> {
  if (showing || !provider?.ready()) return "failed";
  showing = true;
  notifyAdAvailability();
  try {
    return await provider.showRewarded(placement);
  } catch {
    return "failed";
  } finally {
    showing = false;
    notifyAdAvailability();
  }
}

export type AdEvent =
  | "offer_shown"
  | "offer_declined"
  | "offer_accepted"
  | "ad_rewarded"
  | "ad_dismissed"
  | "ad_failed"
  | "overtime_paid_off"
  | "overtime_fell_short";
// Hook for analytics; the offer funnel is what tunes CONTINUE in production.
export function trackAd(event: AdEvent, detail: Record<string, unknown>) {
  if (__DEV__) console.info("[ads]", event, JSON.stringify(detail));
}
