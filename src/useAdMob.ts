import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  NativeModules,
  Platform,
  TurboModuleRegistry,
} from "react-native";
import Constants from "expo-constants";
import {
  notifyAdAvailability,
  setAdProvider,
  setRewardedStatus,
  adFailureStatus,
  reportAdDiagnostic,
  shouldStartNativeAds,
} from "./ads";
import { createRewardedProvider } from "./rewardedProvider";

type SDK = typeof import("react-native-google-mobile-ads");
const UNITS = {
  ios: "ca-app-pub-4796172198731860/9929142044",
  android: "ca-app-pub-4796172198731860/8262379140",
};
export function useAdMob(idle: boolean, pauseForConsent: () => void) {
  const pauseRef = useRef(pauseForConsent);
  pauseRef.current = pauseForConsent;
  const privacyOpenRef = useRef(false);
  const idleRef = useRef(idle);
  idleRef.current = idle;
  const controller = useRef<ReturnType<typeof createRewardedProvider> | null>(
    null,
  );
  const sdkRef = useRef<SDK | null>(null);
  const restartRef = useRef<(() => Promise<void>) | null>(null);
  const [privacyRequired, setPrivacyRequired] = useState(false);
  const [privacyBusy, setPrivacyBusy] = useState(false);
  const [privacyError, setPrivacyError] = useState<string | null>(null);
  useEffect(() => {
    const hasNativeModule =
      TurboModuleRegistry.get("RNGoogleMobileAdsModule") != null ||
      NativeModules.RNGoogleMobileAdsModule != null;
    // Never require the ads package unless this binary actually contains it.
    // Expo Go throws from TurboModuleRegistry.getEnforcing on that require.
    if (
      !shouldStartNativeAds(
        Platform.OS,
        Constants.executionEnvironment,
        Constants.appOwnership,
        hasNativeModule,
      )
    ) {
      setRewardedStatus("unavailable");
      return;
    }
    let cancelled = false,
      starting = false,
      consentGathered = false,
      retryInitAt = 0;
    function teardown() {
      setAdProvider(null);
      controller.current?.dispose();
      controller.current = null;
    }
    async function start() {
      if (
        cancelled ||
        starting ||
        privacyOpenRef.current ||
        controller.current ||
        Date.now() < retryInitAt ||
        !idleRef.current ||
        AppState.currentState !== "active"
      )
        return;
      starting = true;
      setPrivacyBusy(true);
      setRewardedStatus("loading");
      try {
        const sdk: SDK =
          sdkRef.current ?? require("react-native-google-mobile-ads");
        sdkRef.current = sdk;
        if (!consentGathered) {
          let infoUpdated = false;
          consentGathered = true;
          try {
            const info = await sdk.AdsConsent.requestInfoUpdate();
            infoUpdated = true;
            if (cancelled) return;
            if (info.status === sdk.AdsConsentStatus.REQUIRED)
              pauseRef.current();
            await sdk.AdsConsent.loadAndShowConsentFormIfRequired();
          } catch (error) {
            // Retry a failed info refresh when idle, not a dismissed privacy form.
            if (!infoUpdated) consentGathered = false;
            reportAdDiagnostic("consent", error);
            /* Previous-session consent may remain valid. */
          }
        }
        if (cancelled) return;
        const info = await sdk.AdsConsent.getConsentInfo();
        setPrivacyRequired(
          info.privacyOptionsRequirementStatus ===
            sdk.AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
        );
        if (!info.canRequestAds) {
          setRewardedStatus("consent");
          retryInitAt = Date.now() + 30000;
          return;
        }
        if (!idleRef.current || AppState.currentState !== "active") return;
        // iOS native AppDelegate disables publisher IDs and personalization
        // before this initialization. Do not use the library's no-op JS setter.
        await sdk.default().initialize();
        if (cancelled) return;
        const unit =
          __DEV__ || process.env.EXPO_PUBLIC_ADMOB_TEST_ADS === "true"
            ? sdk.TestIds.REWARDED
            : UNITS[Platform.OS as keyof typeof UNITS];
        const next = createRewardedProvider(
          () => {
            const ad = sdk.RewardedAd.createForAdRequest(unit, {
              requestNonPersonalizedAdsOnly: true,
            });
            const events = {
              loaded: sdk.RewardedAdEventType.LOADED,
              earned: sdk.RewardedAdEventType.EARNED_REWARD,
              closed: sdk.AdEventType.CLOSED,
              error: sdk.AdEventType.ERROR,
            };
            return {
              on(event, callback) {
                return ad.addAdEventListener(events[event], (error) => {
                  if (event === "error") reportAdDiagnostic("rewarded", error);
                  if (event === "loaded") reportAdDiagnostic("Ready");
                  callback(error);
                });
              },
              load: () => ad.load(),
              show: () => ad.show(),
              destroy: () => ad.destroy(),
            };
          },
          notifyAdAvailability,
          Date.now,
          setRewardedStatus,
        );
        retryInitAt = 0;
        controller.current = next;
        setAdProvider(next.provider);
        next.setIdle(idleRef.current && AppState.currentState === "active");
      } catch (error) {
        retryInitAt = Date.now() + 30000;
        reportAdDiagnostic("initialization", error);
        setRewardedStatus(adFailureStatus(error));
        if (__DEV__) console.warn("[AdMob]", String(error));
      } finally {
        starting = false;
        if (!cancelled) setPrivacyBusy(false);
      }
    }
    restartRef.current = async () => {
      retryInitAt = 0;
      await start();
    };
    void start();
    const tick = setInterval(() => {
      controller.current?.setIdle(
        idleRef.current && AppState.currentState === "active",
      );
      if (!controller.current) void start();
    }, 5000);
    const sub = AppState.addEventListener("change", (phase) => {
      controller.current?.setIdle(idleRef.current && phase === "active");
      if (phase === "active" && idleRef.current && !controller.current)
        void start();
    });
    return () => {
      cancelled = true;
      restartRef.current = null;
      clearInterval(tick);
      sub.remove();
      teardown();
    };
  }, []);
  useEffect(() => {
    controller.current?.setIdle(idle && AppState.currentState === "active");
    if (idle && !controller.current) void restartRef.current?.();
  }, [idle]);
  const openPrivacy = useCallback(async () => {
    if (privacyBusy || privacyOpenRef.current || !sdkRef.current) return;
    privacyOpenRef.current = true;
    setPrivacyBusy(true);
    setPrivacyError(null);
    setAdProvider(null);
    controller.current?.dispose();
    controller.current = null;
    try {
      await sdkRef.current.AdsConsent.showPrivacyOptionsForm();
    } catch {
      setPrivacyError("Privacy options are unavailable. Please try again.");
    } finally {
      privacyOpenRef.current = false;
      await restartRef.current?.();
      setPrivacyBusy(false);
    }
  }, [privacyBusy]);
  return { privacyRequired, privacyBusy, privacyError, openPrivacy };
}
