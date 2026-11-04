# Human playtest protocol

The balance bot (`scripts/balance.ts`) checks scores, star lines and seal rates. It cannot tell whether the game is fun, confusing or repetitive. That needs people.

## Setup

- 3–5 players who have not seen the game; at least one who rarely plays mobile games.
- A physical phone with sound on. Fresh install, or delete the app's data first.
- Do not explain the controls. Watch silently and take notes; answer questions only when the player is stuck for more than 30 seconds.
- 15 minutes of play, then a 5-minute interview.

## Observe and record

| When | Record |
| --- | --- |
| Level 1 | Seconds until the first cast; whether they discover hold-to-charge without the coach line |
| Each new briefing card | Did they read it? Can they explain the mechanic after the level? |
| Turtle levels (3 onward) | Accidental turtle strikes; do they understand the −50 and the broken combo? |
| Seal chip | Do they notice it during play? Do they replay a level for the seal? |
| Every level end | Stars, whether they tap Next level or Retry, and their face |
| Quitting | The level and moment they stop or look bored, and what they say |
| Night and storm | Do they complain that they cannot see? Do they use the lantern light and thunder flashes? |

## Interview

1. What was the most satisfying moment?
2. When did it feel unfair or confusing?
3. Which fish or river do you remember?
4. Did anything feel repetitive? From which level?
5. Would you open it again tomorrow? Why?

## What to change

- Two or more players are stuck at the same level: lower that level's one-star line or move its new mechanic later.
- Accidental turtle strikes stay common after two turtle levels: make turtles slower or lower the penalty.
- Players ignore seals: show the seal goal on the first coach line of each level.
- Players say a chapter is repetitive: add a mechanic there. The novelty test in `tests/levels.test.ts` only checks introductions, not perceived variety.

## Gift and sword update — pending human validation

Run this with 3–5 new players on a physical phone; do not explain the gift first.

- Show a manual near a fish. Can the player identify it as a martial-arts manual within 3 seconds and explain how to collect it?
- After a pickup, can they identify the equipped technique and remaining uses without opening the guide?
- Can they distinguish twin, long, horizontal and spinning swords by watching one cast each?
- Do they expect a new manual to replace the current one? Does the replacement toast help?
- Can they correctly predict that all manuals allow exactly three casts, that a miss costs one use, and that waiting costs none?
- In a storm level, can they time a shot from the drifting boat without feeling the aim is random?
- Open ? while a sword is flying. Check the timer and projectiles freeze; read all three tabs; close and continue.
- Ask which of two consecutive manuals they preferred and why. Record confusion and boredom separately from clear rate.

Current evidence: automated rules tests and iPhone 17 Pro / iOS 26.5 simulator visuals. The simulator's native controls were used to turn the heroine left, cast, and open/close the guide. All seven sword effects were then rendered using a temporary deterministic test scene after native interaction disconnected. That scene was removed. This is not evidence of human enjoyment, retention, or physical-device performance.

## Simple controls, difficulty and overtime

- Verify that holding anywhere underwater, dragging, and releasing is sufficient; there is no thumb pad or side preference.
- A water hold must not activate pause/help/menus. Check multi-touch cancellation and app backgrounding during a charge.
- Run the 30-level balance survey with manual-seeking players before tuning scores. Validate with independent seeds; do not alter hit probability to create an ad opportunity.
- At time-up, check both a missed target and a one/two-star clear. The optional offer states +15s and the exact score needed; Skip keeps the result.
- Finish an ad, dismiss it early, fail the load and double-tap Watch. Only the completed ad grants +15s, once. Confirm the manual's uses and score remain unchanged.
- Test full, balanced and minimal effects on an older physical phone. Verify the physics, hazards and aim remain identical, with no repeated quality oscillation.

Bot scores and simulated ad completion do not validate retention, real ad fill, revenue or physical-phone thermal performance.
