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
- Typecheck: `npx tsc -b` (builds all packages)
- Unit tests: `npm run test:unit -- --run`; story tests: `npx vitest run --project storybook` (slow)
- Lint: `npx eslint <files>` (`npm run lint` runs with --fix over everything)

## Conventions
- Match surrounding style; `*Info` interfaces in common-data are implemented directly by engine state classes (`implements SectorNodeInfo`) — don't write `toInfo()` converters. Use `IArray` in interfaces so both `ArraySchema` and plain arrays satisfy them.
- Payload-less client messages use `undefined` as the payload type.
- "Fake"/non-encounter cards (e.g. route cards) are NOT in `cardDefinitions.ts`; they're built dynamically (`NonEncounterCardInfo`/`NonEncounterCardState`, `getNonEncounterCardDefinition` in common-ui) and synced via `CrewSystemState.nonEncounterCards`. Warp Away is a regular card added to helm's hand.
- Game flow: `GamePhase` = sectorIntro|map|encounter|sectorOutro; ended/setup come from `GameStatus`. Game clock always advances; ship internals only tick during an encounter (`isSimulatingSystems`). `Ship.startEncounter()` resets timers and deals hands.
- Content (faction/sector names, messages) is placeholder for now; real writing comes later.
- Reviews happen on GitHub PRs; use `gh api graphql` reviewThreads (`isResolved:false`) to list open comments.
- Many files have mixed line endings; git normalises, don't mass-reformat.
