# Art assets and provenance

All three assets were generated with the built-in imagegen tool for this project, then copied into `assets/art/`. The transparent sprites retain their generated alpha. No third-party game character or game artwork was copied. Fonts are Cormorant Garamond from the npm package `@expo-google-fonts/cormorant-garamond`, licensed under OFL; the font license is included in `assets/art/FONT-LICENSE.txt`.

## Files

- `/Users/yingxie/Documents/Git/Game/FishGame/assets/art/jiangnan-background.png` — 887 × 1774, opaque background.
- `/Users/yingxie/Documents/Git/Game/FishGame/assets/art/wuxia-swordsman.png` — 1536 × 1024, the earlier swordsman/skiff sprite, no longer shown.
- `assets/art/wuxia-heroine.png` — 1153 × 668, transparent heroine/skiff sprite. She faces right in the art. The hull, canopy and bow stay put (`HERO_BOAT`); only the figure mirrors when she turns, around her feet (`HERO_PIVOT`). The cut is applied before the mirror so the bow cannot flip. The forward sleeve is a hinged clip (`HERO_ARM` in `src/pose.ts`).
- `/Users/yingxie/Documents/Git/Game/FishGame/assets/art/river-fish-atlas.png` — 2172 × 724, transparent three-cell atlas.

The heroine is a Chinese jianghu swordswoman, not a Japanese ronin: douli, long hair and crimson ribbon, layered hanfu, straight jian, crimson sash, jade detail and Chinese wooden skiff. The product interface is entirely English. The illustration texture, jade water, restrained vermilion and parchment UI carry the visual identity.

## Additional assets (campaign update)

- `assets/art/river-creatures-atlas.png`: 2048 × 1024, transparent 4 × 2 atlas of 512 px cells: mandarin fish, whisker catfish, puffer, rice eel, river turtle, ancient sturgeon, iron carp, dragon carp. Each creature was generated individually in side view on a flat magenta background, using `river-fish-atlas.png` as the style reference, then keyed, despilled, cropped and packed with `python scripts/key-sprite.py OUT.png 4 name=path ...` (requires Pillow and numpy).
- `assets/art/bg-reed-marsh.jpg`, `bg-rain-river.jpg`, `bg-moonlit-lake.jpg`, `bg-storm-gorge.jpg`: 720 × 1280 chapter backgrounds generated with `jiangnan-background.png` as the composition and style reference. Their painted waterlines (27.9%, 32.2%, 32.4% and 34.2% of image height) were measured from the luminance edge and are listed in `BACKGROUNDS` in `src/Ocean.tsx`, which scales each image to cover the screen with its waterline on the simulation surface.

Rejected generations: a first dragon carp that came out as a full dragon with legs, a first iron carp with pixel-art edges, and a storm gorge whose underwater spray hid the fish.

## Generation prompts

### Environment

Use case: stylized-concept. Asset type: production mobile 2D game environment background, portrait 1024x2048 composition, no UI no text. Chinese wuxia ink-wash and exquisite hand-painted ancient China landscape, sophisticated premium indie game art, restrained warm ivory rice-paper grain, distant misty layered Huangshan limestone mountains, elegant pine tree framing on upper left, small hazy muted vermilion sun upper right. Waterline is exactly 32 percent from top. Above waterline is airy pale parchment sky with sparse mist mountains, leave upper 16 percent very clear for UI. Below waterline is a side-cutaway underwater river environment taking 68 percent of image: luminous muted jade teal near surface gradually deep deep blue-green bottom, subtle paper grain and watercolor texture, soft caustic light shafts, delicate reeds and river stones only at lower corners, tiny suspended motes. Underwater center must be clean spacious for moving fish gameplay with strong readable silhouettes. Beautiful atmospheric painterly shading, Chinese ink brush edges and fine elegant detail, not flat vector shapes, not a mockup. No people, no boat, no fish, no buildings, no lettering, no borders, no interface, no watermark.

The generated waterline differs from the prompt, so the scene calibrates the background draw height to align its painted waterline with the simulation's surface.

### Swordsman

Use case: stylized-concept. Asset type: SINGLE production 2D mobile game character sprite, isolated transparent PNG, high quality detailed hand-painted Chinese wuxia swordsman fisherman and narrow wooden skiff together as ONE cohesive side-view sprite. A real unmistakable Chinese jianghu wandering swordsman, adult heroic proportions 5 heads tall, NOT chibi, wearing broad conical bamboo douli hat pitched down completely hiding face, black charcoal layered hanfu robes with elegantly flowing hems and sleeves, dark ink cloak moving toward left, subtle aged gold trim, muted crimson waist sash and trailing scarf, a sheathed straight Chinese jian sword strapped diagonally across his back, tiny jade pendant. Strong three-quarter side silhouette facing RIGHT, standing balanced with bent knees on a low slender Chinese wooden river skiff, empty right hand extended forward at waist height ready to cast spear, other hand relaxed. NO spear, no fishing rod (animated separately). Hair tied traditional topknot under hat, NO visible facial features, no western costume, no samurai armor, no kabuto, no cartoon smiling face. Painterly Chinese ink brush and elegant fine gouache rendering, dark silhouette with readable layered fabric, premium polished wuxia mobile game production asset. Boat extends horizontally beneath character, boat length about twice character standing height, full figure and full boat uncropped, transparent negative space around all edges. No water, no background, no shadow rectangle, no lettering, no UI, no watermark. Canvas landscape 1536x1024.

### Fish atlas

Use case: stylized-concept. Asset type: production 2D game fish sprite sheet, 1536x512 wide 3:1 image, genuinely transparent background. Exactly THREE different fish, aligned in a SINGLE horizontal row with three equal square cells and generous transparent margins. LEFT CELL: silvery pale jade Chinese river crucian carp with ink-green fins and rounded body. CENTER CELL: vermilion red-and-ivory Chinese koi carp, plump graceful body. RIGHT CELL: small gold Chinese river fish with warm gold scales and flowing amber fins, narrow nimble body. All three face RIGHT, perfect side view, exactly same groundline centered in their cells, complete fish including tail within each cell, no overlap, each fish occupies around 75 percent cell width and 45 percent cell height. Premium stylized painterly Chinese ink and gouache game art, detailed delicate scales and semi-translucent fin rays, appealing small dark eyes, subtle cream highlights, clean readable soft-edged silhouettes, slightly cute proportions but NOT cartoon googly eyes, NOT emoji, NOT flat SVG, NOT photorealistic. Dark enough fin edges to read on teal underwater background. Match atmospheric Chinese wuxia hand-painted mobile game. No text, no numbers, no background, no water, no bubbles, no cell borders, no shadow rectangles.
