---
name: building-encounters
description: Build or change an All Hands encounter (packages/engine/src/encounters) from its spec in docs/encounter-specs*.md. Use when implementing an encounter or its elite form, adding an engine piece an encounter needs (ship design, AI goal, card, status effect, objective type), or writing a new encounter spec.
---

# Building an encounter

Three encounters are built: Toll Collectors, Slow Boat and Standing Orders. `docs/encounter-design.md` says why encounters are shaped as they are, and `docs/encounter-specs.md` and `docs/encounter-specs-2.md` say what to build. This skill holds what neither says: how each build actually went, and what had to be worked out every time.

The one thing all three had in common: **the spec is a hypothesis.** Each was written from reading the engine, not running it, and each had three or more claims the engine contradicted. Slow Boat's ally was to have "a lot of hull" in a game where one hit past the shields ends a ship. Its route took 70 seconds, not 180. Standing Orders' platform couldn't turn, so it never fired. None of these showed up as a failing test. They showed up as an encounter that worked and asked nothing. So most of the work is before the encounter class: turning the spec into engine terms, and finding what it assumed.

## Steps

### 1. Read the spec against its nearest relative

Read the encounter's whole spec, its "Check first" list included, then the built encounter closest to it, with its tests:

| The new one has | Read |
|---|---|
| Ships that leave rather than die, a second wave on a timer | `TollCollectorsEncounter.ts` |
| An ally with its own agenda, status said over comms, a question for the crew, a card kept in hand | `SlowBoatEncounter.ts` |
| A hidden answer, a thing that must survive, a ship built by hand, an answer drawn from the crew's own decks | `standingOrders/` |

Then read `Encounter.ts` from top to bottom. It's short, and everything in section G of the first spec is there.

Done when you can say which question the encounter asks (design doc, section 3) and what the captain's call is, without looking.

### 2. Turn every number into engine units

Go through the spec's Ships, Rules and Tuning sections with [ENGINE-NUMBERS.md](ENGINE-NUMBERS.md) open. For each number, work out what it comes to in the engine: how many hits, how many seconds, how many units. The ones that have been wrong before:

- **Anything described as health.** Health is a count of cards, and a hit that gets through damages that many cards. Under the shields nearly everything dies in one or two hits. If something has to survive mistakes, it needs shields sized for it, or a hull padded with `hullBare`.
- **Any distance against any duration.** Work out the crossing time from a measured speed, then confirm it in step 7.
- **Any radius against any weapon range.** A ship that defends a position ignores everything outside its radius, so a radius inside torpedo range lets the crew shell it for free.
- **Any AI choice the crew is told about or relies on.** Skill below 1 adds noise to target choice, and makes the commander skip updates. An ally whose target is announced plays at skill 1.
- **Any "switches to", "prefers", "unless".** Find the comparison in `Commander.ts` and put the encounter's real distances through it. Slow Boat's harriers were meant to switch to a crew that got close. With a bonus of 30 and a switching factor of 1.25, they never do.
- **Any ship that has to shoot.** Check its helm deck can bring its weapons' arcs to bear, and that every card it holds has an `aiEvaluator`, since the AI never plays one without.

Done when every row of the Tuning table and every ship in the spec has been checked, and each mismatch is settled: either the number changes, or a missing piece joins step 4.

### 3. Find the channel for every clue

The design depends on each station seeing something the others can't. "Science sees X" is only true if X is in what a scan sends. For every row of "What each station has", name the **channel**: the synced field that puts that fact on that phone. The channels that exist are listed in ENGINE-NUMBERS.md, under "What each seat can see". If a clue has no channel, the encounter has to make one, the way Standing Orders set the platform's deflector directly and invented a status effect for the engineer to read.

Check the other direction too: that the clue isn't also on the viewscreen or another phone. The hull of the scanned ship goes to tactical as well as science.

Then check the answer is reachable. If acting on the answer needs particular cards, read the crew's real decks (they change at every shop) and choose the answer from what they can do, or keep them supplied with `keepInHand`. Standing Orders does both.

Done when every clue has a named channel, seen by exactly the seats the spec says, and the answer can always be acted on.

### 4. Build the engine pieces first, each with its own tests

A new AI goal, card, effect, ship design or hook is its own piece of work with its own test file, finished before the encounter that uses it. Where each one goes:

- **Ship design:** a template in `campaign/shipDesigns.ts`, a name in `designNames`, and the design added to the list in `shipDesigns.test.ts`. That test needs every design to have its own appearance and to afford its own cards. A design's `fleeThreshold` is 0.25 unless it says otherwise, so say.
- **Card:** three places, by the same key: `common-data/.../cardDefinitions.ts`, `common-ui/.../getUiCardDefinition.tsx`, `engine/src/cards/getEngineCardDefinition.ts`. Each card belongs to one system.
- **Status effect:** three places: `common-data/.../systemEffectDefinitions.ts`, `common-ui/src/utils/getUiSystemEffectDefinition.tsx`, `engine/src/effects/getEngineSystemEffectDefinition.ts`. One that only exists to be read has `apply: () => true` and an empty `remove`.
- **Objective type:** `ObjectiveInfo.ts`, then `getObjectiveLabel` in `common-ui/.../sectorLabels.ts`, whose exhaustive switch finds the rest.
- **AI goal:** `AiGoalInfo`, then `Commander.ts`, and a stance in `ai/types.ts` if the helm has to fly differently.
- **A hook on a ship:** a `ListenableEvent` on `Ship`, like `deflectorReceived`.

Put a helper on the `Encounter` base class only at its third use. The second encounter to need something copies it.

If a fix to shared behaviour falls out (each encounter has found one or two), make it, test it where it lives, and note what else it changes. `primary` cards not returning from the hand was found this way.

Done when each piece passes its own tests with no encounter involved.

### 5. Write the encounter

One file, one class, and its definition exported beside it. The shape the three share:

- Names used in more than one place (who's speaking, the objective's subject, faction ids, scenario ids) are constants at the top. Tuning values are too, each with a comment saying what it is in the game's terms, and exported if a test needs it.
- `factions` is a field. Groups are fields made with `this.track()`.
- `populate()` only places things. The player ships start at the origin facing along the x axis, with starboard towards positive y. Hails, timers, kept cards and questions start in `start()`, after `super.start()`.
- The objective comes from the definition through the node, so there's no constructor.
- `tick()` begins `if (this.isComplete || !thing) return;`, because the campaign keeps ticking after the outcome, so that last words get said.
- Removal arrives synchronously. `depart()` and `destroy()` call `onObjectRemoved` before they return, so set any "this was meant to happen" flag before calling them, as `arrive()` does in Slow Boat.
- Ending has an order: tell the ships what to do, `complete()`, then speak. `complete()` cancels every timer and drops any question. A failure calls `silence()` first, and then says its one line or says nothing.
- The elite form is `this.node.elite` in the same class. It twists the question. It never just adds ships.
- Everything is in game time, through `after` and `every`.
- Loop over `getPlayerShips(this.state)`. There can be more than one.

The class comment says what the encounter is, as the crew would meet it: who's there, what each does, how it ends. Comments throughout say what happens in the game, not what the code does.

Done when the class reads top to bottom as the spec's Rules section.

### 6. Write the lines

Lines are how the crew learns everything it can't see. For each line decide:

- **Is it a tell?** Then it's `urgent` with a `maxDelayMs`, because late is worse than never.
- **Is it status?** Then say it once per stage, and if several stages passed at once, only the worst.
- **Is it chatter?** Then it waits for `!this.isHailing` and is dropped otherwise.
- **Is it the briefing?** Then it's the first thing queued, so it's read in full, and it states the rule once, in words a crew can act on. Nothing else in the game will.

Speaker names are what the crew will say aloud, so they're short and distinct. A line of more than three sentences takes over ten seconds to read. The opposition gets a line when it arrives and one when it leaves.

Done when each line in the spec's Hails table has a trigger that fires once, and nothing the crew needs is only on the viewscreen.

### 7. Test in two layers

**Unit tests** (`<Name>Encounter.test.ts`) check that it works. Follow `SlowBoatEncounter.test.ts`: `setupGameRoom()`, a seeded random, `startCampaign`, then `campaign.devLoadEncounter(id, elite)`. Only the campaign is ticked (`state.currentTime += n; campaign.tick(0)`), so nothing moves or shoots by itself. Put ships where the test needs them by rewriting their motion, set shields through the hull tile, and call `commander.update` when the AI has to notice. `listenToHails` returns what was said. One test per rule in the spec, one per line of the Tests list, and for a failure: no reward, Warp Away still offered, and the run carries on.

**A played-out test** runs the real AI with `state.tick`. Each encounter has needed at least one, because unit tests can't see an encounter that works and is wrong:

- A behaviour test, where the rule depends on what the AI really does (the platform turns, stays put and fires). This stays with the unit tests.
- Measurements: a crew that does nothing, and a crew that does the one obvious thing. If doing nothing wins, or the obvious thing wins every time with room to spare, the encounter isn't asking its question. These go in `<Name>Encounter.balance.test.ts`, run with `npm run test:balance`.

Then launch it: `npm run dev`, and in the dev tools' encounter list start it in both forms. Check each clue reaches the screen it's meant for.

Done when the unit tests, `npm run typecheck` and `npx eslint` on the changed files pass, and the measurements are written down.

### 8. Register it

- Add the definition to the list in `EncounterRegistry.ts`.
- Add its id to a pool in `campaign/sectorThemes.ts`: `early` only if the spec's Pool row allows the first layers.
- Add the id to the sorted list that `Encounter.test.ts` expects.

### 9. Write back to the spec

The spec is the project's memory, and the next spec is written from it. Under the encounter, add:

- **As built:** each place the build differs from the spec, with the reason and the number behind it.
- **Measured:** what the played-out runs showed, with seeds and counts, and how rough they are.
- **Still to check, by playing it:** what only people at a table can answer.

Update the Status paragraph at the top. If a helper reached its third use, add it to section G. Write these the way the existing ones are written: plain statements, the number that forced the change, no account of the debugging.

Done when someone reading only the spec would build what's now in the code.

## Writing a spec

A spec has the same parts as the built ones, in the same order: the header table, factions, new engine pieces, ships and timeline, rules, what each station has with the captain's call, hails, expected talk, the elite form with its legacy, tuning, tests. Do steps 2 and 3 of this skill while writing it, so the numbers are already in engine units and every clue already has its channel. End it with **Check first**: each thing inferred from the code and not run, which the design depends on. That list is what step 2 starts from.
