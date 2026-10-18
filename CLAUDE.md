# All Hands

Multiplayer co-op starship bridge game. npm workspaces monorepo (TypeScript, React, Colyseus-style synced state).

## Packages (`packages/`)
- `common-data` – shared types/data (cards, sectors, messages, `*Info` interfaces). Dependency-free; no UI.
- `engine` – server-side simulation: `state/` (synced schema classes), `campaign/` (sector map, encounters flow), `encounters/`, `utils/` (e.g. `shipQueries.ts`).
- `common-ui` – shared React components, labels and card UI definitions (e.g. predefined sector/faction labels).
- `player-ui` – per-crew-station client (helm, science, tactical, engineer); `features/<name>/`.
- `game-ui` – main viewscreen client. `game-app` – app/packaging. `renderer` – rendering.

Build order: common-data → engine/common-ui → player-ui/game-ui → game-app.

## Commands (run from repo root)
- Typecheck: `npx tsc -b` (builds all packages). This rewrites `engine/dist` without the `tsc-alias` step that resolves its `src/...` imports, so `npm run dev` then fails with `Cannot find module 'src/...'`. Run `npm run build:devtools` before `npm run dev` to fix it.
- Unit tests: `npm run test:unit -- --run`; story tests: `npx vitest run --project storybook` (slow)
- Lint: `npx eslint <files>` (`npm run lint` runs with --fix over everything)
- End-to-end: `npm run dev` serves the game at http://localhost:23552/ (dev mode). Pressing **Start Single-Player Game** in the main menu also opens 4 mobile-sized Playwright windows (`launch-players.ts`), one per crew role, which auto-join and start the game. Those windows aren't controllable via Claude in Chrome; open the URL there yourself to drive the main screen.

## Conventions
- Match surrounding style; `*Info` interfaces in common-data are implemented directly by engine state classes (`implements SectorNodeInfo`) — don't write `toInfo()` converters. Use `IArray` in interfaces so both `ArraySchema` and plain arrays satisfy them.
- Game flow: `GamePhase` = sectorIntro|map|encounter|sectorOutro; ended/setup come from `GameStatus`. Game clock always advances; ship internals only tick during an encounter (`isSimulatingSystems`). `Ship.startEncounter()` resets timers and deals hands.
- Reviews happen on GitHub PRs; use `gh api graphql` reviewThreads (`isResolved:false`) to list open comments.
