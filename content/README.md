# Content

Everything the game is played with, as opposed to how it's played: cards, status effects, ship designs, encounters and sectors.
Each content folder holds one piece of the game, and everything that piece needs, for every part of the game.

- `systems/<system>/` – the cards of one ship system, and the status effects they cause. Science's deflector cards have their own folder.
- `general/` – status effects that the engine itself causes, ship designs used by more than one encounter, and the placeholder encounters.
- `sectors/<n>/` – one sector: `sector.engine.ts` has its theme, and lists its encounters. Each encounter has a folder of its own, with anything that only it uses.

Something a second encounter needs moves out of the first one's folder, to `general/` or `systems/`: no content folder in a sector imports from another.

## A folder's files

Each file is for one part of the game, which its name ends with:

| File | Has | Type-checked by |
| --- | --- | --- |
| `<folder>.shared.ts` | Card and status effect definitions, which the engine and the clients both use. | common-data |
| `<folder>.engine.ts`, `*.engine.ts`, `*.test.ts` | What those cards and effects do, and ship designs, encounters and sectors. | engine |
| `<folder>.ui.tsx`, `*.ui.ts(x)`, `*.test.tsx` | What those cards and effects are called, and how they're described and drawn. | common-ui |

`<folder>.<part>.ts` exports that part's content for the folder: `defineSharedContent`, `defineEngineContent` or `defineUiContent`.
The engine and UI content each name the shared content they give the behaviour or look of, and have to cover every card and effect in it.

Each part's content is listed in a manifest: `content.shared.ts`, `content.engine.ts` or `content.ui.ts`, which take in each sector's `sector.<part>.ts` list.
common-data builds `cardDefinitions` and `systemEffectDefinitions` from the shared manifest. The engine (in `index.ts`) and each client (in `main.tsx`) register the other two when they start, as do Storybook and the test setup (`vitest.setup.ts`).
After that, content is reached through the registries: `getCardDefinition`, `getSystemEffectDefinition`, `createShipSetup`, `getEncounterDefinition` and `sectorThemes`.

## What can import what

`eslint.content.js` checks that:

- each file only imports what its part of the game has (shared content: only common-data; engine content: no UI; UI content: only the engine's types),
- content folders import each other by their `content/...` path, never `../`,
- nothing imports from a sector except the manifests, and nothing in a sector imports from another encounter's folder,
- the packages only import the manifests where content is registered, and otherwise only import content's types.

`registration.test.ts` and `registration.test.tsx` check that every piece of content that a content file exports is in its manifest, and that each piece of shared content is given its behaviour and its look exactly once.

## Leaving a sector out

As only the manifests import a sector, leaving one out of all three of them leaves its code out of the build (e.g. for a demo with only the first sector).
Types still come from every sector, so a build like that has to swap the manifests in at build time (an esbuild and a Vite alias), rather than editing them, to keep type-checking the full game.
