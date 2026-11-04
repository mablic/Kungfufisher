# Recovery and campaign expansion — October 22, 2026

## Report and diagnosis limits

The supplied screenshot shows level 13, 220 points, 44 seconds remaining and a spinning blade. The player reports an iPhone 17 Pro, no responsive buttons, and the same view after leaving and returning. A screenshot cannot establish a native deadlock or its exact stack.

The installed Reanimated hook registers its frame callback in an effect that depends on callback identity. Our original inline callback changed with HUD renders. This was a concrete scheduling/lifecycle risk, now removed by memoizing the frame worklet independently of the HUD. It is a plausible contributor, not a confirmed forensic diagnosis of that physical device's hang.

The simulator session did not remain available for an interactive native run. No physical iPhone was connected. Do not claim that this report proves either native freeze elimination or an iPhone 13 frame rate.

## Stability changes

- Stable frame callback identity across score, timer and effect-quality renders.
- Re-enable the frame driver when returning to the foreground. Background pause explicitly publishes paused state to the HUD.
- Foreground heartbeat monitored every second. More than six seconds without a beat raises the existing recovery overlay when the JS/native UI can still respond; it cannot recover an OS-level or permanent native-thread deadlock.
- Recovery reconstructs the run and remounts the Canvas instead of resuming possibly invalid projectiles/effects. Completed-level save records are outside the runtime and are retained; the interrupted run starts over.
- Frame catch-up is capped at 100 ms. Aim prediction and turtle-warning prediction have a 256-sample ceiling.
- Light mist uses a simple translucent rectangle instead of a multi-hole runtime shader. Balanced scene raster dimensions are 80% of screen dimensions; minimal is 1/1.75 (about 57%). Native HUD resolution and collision coordinates are unchanged.

## Content and difficulty

42 levels / seven chapters / 18 river and coastal species. New coastal artwork and one 1024-square transparent atlas add bull shark, hammerhead, swordfish and giant grouper. Their health is 4, 5, 3 and 6 strikes respectively. No extra enemies or projectiles are spawned merely to increase difficulty. All rosters stay at eight fish; the added atlas loads only in coastal levels.

Every third level is labeled Trial. All original stages have faster fish and a shorter clock; drifter manuals use 10–14 second intervals rather than eight seconds. Star thresholds were recalibrated with 60 training seeds per profile, then validated independently with 24 seeds per profile per level. Bot behavior does not measure real-player skill, engagement, ad acceptance or revenue.

Independent validation: 42/42 stages passed the reachability gates. Across those samples, casual-profile clear rates averaged 60.6% on buildup stages and 44.9% on Trials. Skilled-profile three-star and seal completions were present on every stage. These are simulated aggregate estimates, not per-user guarantees. Trial casual-clear guard is intentionally lower than the buildup guard; all stages remain free to retry.

The existing completed-level IDs 1–30 remain unchanged. Saved earned stars are not reduced when score thresholds change.

## Advertising

The existing optional +15-second rewarded continue remains once per run. A native AdMob provider is now registered in source; native rebuild and account-side consent/ad-serving configuration are required. Expo Go does not run the native provider. See `admob-and-android.md`. Player choice, ad supply and network failures also prevent any guarantee of one viewed ad per three levels. No forced-loss flag, fake completion callback or automatic ad viewing was added.

## Checks

- 59 regression tests passed, including a 20-seed level-13 spin/pause/resume soak, reconstruction from invalid coordinates, 24 simultaneous catches, armored-school feedback limits and campaign calibration.
- Independent campaign validation: 2,016 runs (42 stages × 24 seeds × two profiles), every row valid.
- TypeScript and iOS/Android Hermes production export passed.
- Native UI, TestFlight and physical-device frame timings remain unverified for this patch. No cloud build or store submission was started.

## Physical-device acceptance

Use the new TestFlight build on the reported iPhone 17 Pro first. Replay level 13 with Lotus Wheel repeatedly, alternate guide/pause with casting, background during a cast, then foreground and resume. Complete the level and re-enter it. Confirm the timer continues, buttons work and no recovery prompt appears during normal play. If it hangs again, capture the TestFlight feedback and the device's corresponding analytics/crash log so the native call stack can be investigated.

On iPhone 13, profile an installed Release build with sound and haptics enabled, both cold and after 15 minutes. Include late-stage fog, storm, large fish and multi-target casts. Examine frame-time p95/p99 and impact-adjacent clusters over 33.3 ms; a passing simulation test is not a GPU benchmark.
