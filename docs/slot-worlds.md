# Directed slot worlds

All 25 slots now have original generated environment artwork and a separate nine-cell symbol atlas. Six detailed upper-body character rigs serve 25 named thematic roles; they are shared models, not 25 independently sculpted characters. The existing decorative SVG landscapes and object drawings remain fallback art if a texture fails to load.

## Architecture and events

- `worldDirector.ts` defines explicit theme directions and maps presentation events to idle, anticipation, neutral, disappointed, delighted, cheer, celebrate, triumph, and bonus states. The medium-return cheer begins at 5× confirmed total stake without changing the displayed win-tier rules.
- Both classic and signature slots emit `spin` after the existing start guard, `settled` only when presenting the confirmed result, `bonus` for the confirmed free-spin introduction, and `error` for an unconfirmed request. Animation state never produces a wager or changes settlement.
- `WorldCharacter` uses four independently composited atlas parts, Web Animations, animated eye overlays, randomized blink/gaze timing, secondary motion, and a connected fishing-rod prop for angler roles. `RigFace` calibrates eye placement per model. These are browser-composited 2D rigs, not Spine assets or 3D skeletons. Mouth textures retain their painted base expression.
- `WorldEnvironment` combines the painted environment, pointer parallax, water reflections, swimming atlas fish, and a reusable finite particle pool. Existing weather layers supply snow, leaves, mist, and theme details. Character panels sit beside desktop reels and above mobile reels, avoiding symbols and controls.
- `MaterialSymbol` selects an individual cell from the selected game's cached atlas. Wild/scatter labels and vault multipliers remain engine-rendered text. No sprite animation changes the symbol's identity or the result grid. Classic ways games remain ways games; no artificial tumbling mechanic has been added.

## Results and pacing

Win-tier thresholds continue to come from `slotWinTier`: big at 10× total stake, mega at 25×, epic at 50×. The character also distinguishes a positive net return, stake returned, and a net loss. An unsuccessful or uncertain request produces no win/loss reaction. A below-stake bonus/scatter result is labelled return rather than profit and does not trigger profit confetti.

The primary Spin/Stop behavior, fixed control placement, accepted-request recovery, counted autoplay, held-Space repeat play, free-spin awards, audio controls, minimum stake, game math, RTP, server RNG, and wallet settlement are preserved. Presentation never blocks a new eligible spin beyond the existing game controls.

## Resources and accessibility

Only the selected cabinet's environment, symbol atlas, and one shared rig are requested; water worlds additionally reuse the reef fish atlas. Atlases use WebP with alpha. All 56 shipped files total about 11.5 MB; no single texture exceeds 450 KB. Backgrounds are 1152px wide, symbol atlases 864px square, and rig atlases 768px square. The browser caches each atlas across its many symbol instances.

The environment loop targets 60 fps on the full tier and 30 fps on the low tier; this is a scheduling target, not a measured device-performance guarantee. Low-core, low-memory and narrow-view devices use the lower tier. Sustained long draw times reduce the tier. Pixel ratio, canvas size, particle count and simulation delta are capped. Pools reuse particle objects. Hidden tabs and offscreen environments/characters stop their loops/animations. Resize/intersection observers, timers, Web Animations and RAF callbacks are disposed on exit. Returning to an old result does not restart its celebration. Reduced motion disables the environment RAF, rig animation, symbol reactions, and parallax while retaining artwork and controls.

## Asset provenance

Assets are in `public/worlds/`. `slot-world-assets.json` records the built-in image-generation tool, prompts/briefs, dimensions, byte sizes and SHA-256 hashes for every shipped file. The first two initial briefs are reconstructed and explicitly marked; subsequent generation prompts are recorded verbatim. No third-party provider artwork, recordings, SDK, or game logic is included. Generated PNG source files were converted and resized to WebP for delivery; source-generation files remain outside the repository.

The test suite verifies texture integrity, director thresholds, unknown-result handling, bounded pool reuse, reduced motion, hidden-tab handling, observer and animation cleanup, and existing game/control behavior. `npm run check:worlds` runs 67 offline Chrome presentation cases: all 25 slots at 1200px and 390px plus confirmed wins, pending requests, Stop and a retained bonus. Set `CHROME_PATH` if Chrome is not installed at the platform default. Reports and screenshots go into ignored `artifacts/world-presentation/`. Finite animations are finished by the test fixture for stable screenshots; production animations are unaffected. Browser checks use local fixture outcomes and do not exercise live cash wagering or prove production network latency, mobile-device FPS, or provider certification. The checks also caught and fixed scrollbar-induced horizontal control movement and a bonus-strip height change.

## World inventory

| Slot | Environment | Character role | Signature |
| --- | --- | --- | --- |
| Astra Cascade | Astral crystal laboratory | Astra, Celestial laboratory keeper | summon |
| Copper Lock | Copper piston foundry | Cora, Copper lockworks engineer | tinker |
| Nitro Sevens | Neon speedway pit lane | Nitro, Midnight speedway mechanic | tinker |
| Solar Vault | Sunstone observatory | Solis, Keeper of the sunforge | summon |
| Neon Drift | Rain on neon streets | Vega, Neon street pilot | tinker |
| Jade Temple | Bamboo canopy | Lian, Jade sanctuary keeper | bloom |
| Lunar Tides | Moonlit tidal harbor | Mara, Moon harbor navigator | cast |
| Ember Crown | Crownfire battlements | Rhea, Crownfire sentinel | summon |
| Velvet Orbit | Orbital station windows | Nova, Velvet orbit captain | survey |
| Coral Cove | Living coral lagoon | Coralie, Lagoon angler | cast |
| Midnight Express | Steam railway | Ada, Midnight rail conductor | tinker |
| Saffron Sky | Saffron palace dunes | Saffra, Caravan cartographer | survey |
| Frost Bloom | Frozen blossom valley | Eira, Glacier bloom keeper | bloom |
| Obsidian Echo | Obsidian crystal cavern | Nyx, Crystal grotto watcher | summon |
| Electric Garden | Electric botanical garden | Flora, Butterfly garden keeper | bloom |
| Ruby Rebellion | Ruby royal gallery | Rubi, Royal gallery sentinel | summon |
| Copper Canyon | Copper frontier trail | Copper, Frontier prospector | survey |
| Aurora Arcade | Aurora arcade boulevard | Pixel, Arcade district inventor | tinker |
| Atlas of Gold | Flying expedition port | Atlas, Sky expedition cartographer | survey |
| Thunder Aerie | Storm eagle mountain eyrie | Aella, Thunder eagle guardian | summon |
| Sugar Parade | Sugar carnival parade | Pippa, Sugar parade inventor | stir |
| Corsair Pearls | Black pearl crossing | Pearl, Corsair pearl diver | cast |
| Amber Apiary | Amber apiary meadow | Amber, Meadow honey artisan | stir |
| Clockwork Aurora | Clockwork conservatory | Tikka, Aurora clockmaker | tinker |
| Dragon Atelier | Volcanic artisan forge | Kaia, Dragon forge warden | summon |
