# Content

Everything the game is played with, as opposed to how it's played: cards, status effects, ship designs, encounters and sectors.
Each content folder holds one piece of the game, and everything that piece needs, for every part of the game.

- `systems/<system>/` – one ship system's module (`engineer`, `helm`, `hull`, `reactor`, `science`, `tactical`): its cards, and the status effects they cause. Science's deflector cards have a module of their own, `systems/science/deflectors/`.
- `general/` – status effects that the engine itself causes, ship designs used by more than one encounter, and the placeholder encounters. `general.<part>.ts` lists its pieces.
- `sectors/sector<n>/` – one sector: `sector.engine.ts` has its theme, and `sector.<part>.ts` lists its content. Each encounter has a module of its own inside it, with anything that only it uses.

Something a second encounter needs moves out of the first one's folder, to `general/` or `systems/`: no encounter's folder imports from another's.

## A module's files

A module's top-level files put together its content for each part of the game, which their names end with:

| File | Has | Type-checked by |
| --- | --- | --- |
| `<module>.shared.ts` | Card and status effect definitions, which the engine and the clients both use: `defineSharedContent`. | common-data |
| `<module>.engine.ts` | What those cards and effects do, and any ship designs and encounters: `defineEngineContent`. | engine |
| `<module>.ui.tsx` | What those cards and effects are called, and how they're described and drawn: `defineUiContent`. | common-ui |

The cards and effects themselves are in `cards/` and `effects/`, one file per part, each exporting `cards` or `effects`:

| File | Defined with |
| --- | --- |
| `cards/<module>Cards.shared.ts`, `effects/<module>Effects.shared.ts` | `defineCards`, `defineEffects` (common-data) |
| `cards/<module>Cards.engine.ts`, `effects/<module>Effects.engine.ts` | `defineEngineCards`, `defineEngineEffects` (engine) |
| `cards/<module>Cards.ui.tsx`, `effects/<module>Effects.ui.tsx` | `defineUiCards`, `defineUiEffects` (common-ui) |

The engine and UI definers take the shared definitions they're for, so each file has to cover every card or effect in them, and each card's functions get the parameters its target type has:

```ts
import { defineEngineCards } from 'engine/content/EngineContent';
import { cards as sharedCards } from './helmCards.shared';

export const cards = defineEngineCards(sharedCards, {
    warpAway: {
        play: (gameState, ship) => gameState.campaign?.warpAway(ship) === true,
    },
    // ...every other helm card
});
```

Other `*.engine.ts` files hold encounter classes and their helpers; `*.test.ts` files are type-checked with the engine, and `*.test.tsx` files with common-ui.

Each part's content is listed in a manifest: `content.shared.ts`, `content.engine.ts` or `content.ui.ts`, which take in `general.<part>.ts` and each sector's `sector.<part>.ts` list.
common-data builds `cardDefinitions` and `systemEffectDefinitions` from the shared manifest. The engine (in `index.ts`) and each client (in `main.tsx`) register the other two when they start, as do Storybook and the test setup (`vitest.setup.ts`).
After that, content is reached through the registries: `getCardDefinition`, `getSystemEffectDefinition`, `createShipSetup`, `getEncounterDefinition` and `sectorThemes`.

## What can import what

`eslint.content.js` checks that:

- each file only imports what its part of the game has (shared content: only common-data; engine content: no UI; UI content: only the engine's types),
- content files import other folders (even a module's own `cards/` and `effects/`) by their `content/...` path, never `../`,
- nothing imports from a sector except the manifests, and nothing in an encounter's folder imports from another encounter's,
- the packages only import the manifests where content is registered, and otherwise only import content's types.

`registration.test.ts` and `registration.test.tsx` check that every piece of content that a content file exports is in its manifest, that every `cards` and `effects` a module's `cards/` and `effects/` files export is put into content in its manifest, and that each piece of shared content is given its behaviour and its look exactly once.

## Leaving a sector out

As only the manifests import a sector, leaving one out of all three of them leaves its code out of the build (e.g. for a demo with only the first sector).
Types still come from every sector, so a build like that has to swap the manifests in at build time (an esbuild and a Vite alias), rather than editing them, to keep type-checking the full game.
