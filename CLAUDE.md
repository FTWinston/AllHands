# All Hands

Multiplayer co-op starship bridge game. npm workspaces monorepo (TypeScript, React, Colyseus-style synced state).

## Packages (`packages/`)
- `common-data` – shared types/data (cards, sectors, messages, `*Info` interfaces). Dependency-free; no UI.
- `engine` – server-side simulation: `state/` (synced schema classes), `campaign/` (sector map, encounters flow), `encounters/` (the `Encounter` base class, and stations), `utils/` (e.g. `shipQueries.ts`).
- `common-ui` – shared React components, labels and card UI definitions (e.g. predefined sector/faction labels).
- `player-ui` – per-crew-station client (helm, science, tactical, engineer); `features/<name>/`.
- `game-ui` – main viewscreen client. `game-app` – app/packaging. `renderer` – rendering.

Build order: common-data → engine/common-ui → player-ui/game-ui → game-app.

## Content (`content/`)
Cards, status effects, ship designs, encounters and sectors live in `content/`, not the packages: `systems/<system>/` (each system's cards), `general/` (other effects, ship designs, placeholder encounters) and `sectors/<n>/<encounter>/` (an encounter with everything only it uses). Each folder's files are split by suffix: `*.shared.ts` (data, type-checked by common-data), `*.engine.ts` and `*.test.ts` (engine), `*.ui.tsx` and `*.test.tsx` (common-ui). `content/README.md` has the rest; `eslint.content.js` enforces what may import what.

## Commands (run from repo root)
- Build: `npm run build`; `npm run build:devtools` enables the dev tools (in-game encounter picker etc.), via `DEV_TOOLS=true` in `engine` and `game-ui`'s `.env.devtools`. The engine is bundled, with the `common-data` source it uses, into `engine/dist/index.js` by esbuild (`packages/engine/build.mjs`); `common-data` has no build of its own.
- Typecheck: `npx tsc -b`. Apart from compiling `game-app`, it only emits declarations, so doesn't touch the engine bundle.
- Unit tests: `npm run test:unit -- --run`; story tests: `npx vitest run --project storybook` (slow). Tests run with dev tools off unless `DEV_TOOLS=true` is set in the environment.
- Balance simulations (`*.balance.test.ts`, encounters played out with the real AI to check their tuning): `npm run test:balance -- --run`. Not part of the unit tests, as they're slow and fail whenever tuning changes.
- Lint: `npx eslint <files>` (`npm run lint` runs with --fix over everything)
- End-to-end: `npm run dev` serves the game at http://localhost:23552/ (dev mode). Pressing **Start Single-Player Game** in the main menu also opens 4 mobile-sized Playwright windows (`launch-players.ts`), one per crew role, which auto-join and start the game. Those windows aren't controllable via Claude in Chrome; open the URL there yourself to drive the main screen.

## Conventions
- Match surrounding style; `*Info` interfaces in common-data are implemented directly by engine state classes (`implements SectorNodeInfo`) — don't write `toInfo()` converters. Use `IArray` in interfaces so both `ArraySchema` and plain arrays satisfy them.
- Game flow: `GamePhase` = sectorIntro|map|encounter|sectorOutro; ended/setup come from `GameStatus`. Game clock always advances; ship internals only tick during an encounter (`isSimulatingSystems`). `Ship.startEncounter()` resets timers and deals hands.
- Reviews happen on GitHub PRs; use `gh api graphql` reviewThreads (`isResolved:false`) to list open comments.
