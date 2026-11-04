# Vertical swimming and early large-fish encounters

- Red koi and rice eels now rise and dive along broad sinusoidal depth paths.
  Their horizontal swimming speed is retained. Depth targets stay inside the
  playable water and body pitch follows vertical movement, up to 0.7 radians.
  The existing swept collision uses both movement axes.
- Levels 5, 8, 11, 14, 17, 20, 23, 26 and 29 each have one visitor opportunity
  at 20 seconds of active play. Bull sharks are available from level 5, swordfish
  from 11, hammerheads from 17, and giant groupers from 23. A deterministic
  selection varies the visitor by level. Levels 31–42 retain their usual rosters.
- One healthy ordinary fish is replaced. Protected turtles and species needed
  for the level's catch seal are excluded; if no eligible slot exists, the
  encounter is skipped. There are never additional fish or render components.
- The visitor retains its normal health and rewards. Catching it respawns the
  ordinary roster fish. An uncaught visitor expires after 12 active seconds.
  It does not repeat during the same run. The HUD identifies the visitor and
  remaining hits. Background/pause freezes the simulation and visitor timer.
- No new textures, shaders, particles or network calls are added. Depth motion
  adds constant work per relevant fish; the encounter scans the bounded fish
  population once at its scheduled time.

Validation: movement tests check visible depth travel, water bounds, pause,
visitor timing/expiry, no repeat after removal, fixed population and turtle
preservation. Existing bot balance checks cover all 42 levels with separate
casual/skilled runs. The full campaign projectile stress suite also runs with
these encounters. These are automated rules checks, not measured physical
iPhone/Android FPS or a substitute for physical playtesting.
