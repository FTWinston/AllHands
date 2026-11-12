---
name: building-encounters
description: Build or change an All Hands encounter (packages/engine/src/encounters) from its spec in docs/encounter-specs*.md. Use when implementing an encounter or its elite form, adding an engine piece an encounter needs (ship design, AI goal, card, status effect, objective type), or writing a new encounter spec.
---

# Building an encounter

`docs/encounter-design.md` says why encounters are shaped as they are, and `docs/encounter-specs.md` and `docs/encounter-specs-2.md` say what to build. This skill holds what neither says: what every build has had to work out.

**The spec is a hypothesis.** Each one was written from reading the engine, not running it, and every build so far has found the engine contradicting it in ways no failing test showed. The encounter worked, and asked nothing: an ally that died to one hit, a platform that couldn't turn to fire, a plan that won every time without anyone speaking. So most of the work comes before the encounter class. Steps 2 and 3 are where it's done.

Beside this file:

- [ENGINE-NUMBERS.md](ENGINE-NUMBERS.md): what a spec's numbers come to in the engine, how AI ships behave, and what each seat can see. Open for steps 2 and 3.
- [TESTING.md](TESTING.md): how encounter tests are written, the harness's traps, and running an encounter in the real game. Read before step 3, as the traps cost more than anything else here.
- [WRITING-A-SPEC.md](WRITING-A-SPEC.md): only when writing a spec.

## Steps

### 1. Read

Read the encounter's whole spec, its "Check first" list included. Read `Encounter.ts` top to bottom: it's short, and it's the whole toolkit. Read the "As built" and "Measured" of whichever encounter was built last, whatever it's about, as that's where the newest findings about the AI are.

Then read the built encounter that already does what this one needs, with its tests:

| For | Read |
|---|---|
| Ships that leave rather than die; a second wave on a timer | `TollCollectorsEncounter.ts` |
| An ally flying its own route; status said aloud; a question for the crew; a card kept in hand | `SlowBoatEncounter.ts` |
| A hidden answer drawn from the crew's own decks; a ship built by hand; a relationship that changes | `standingOrders/` |
| A system that has to be put out; a ship that mustn't repair itself | `FeverShipEncounter.ts` |
| An object that isn't a ship; something done after the outcome; a rule heard from hits | `deadWeight/` |
| A graded outcome; many ships spawned on a schedule; a faction that isn't the crew's enemy | `LastShuttleOutEncounter.ts` |
| An opposition that starts neutral; new orders mid-encounter; a crew card the encounter reacts to | `QuietRunningEncounter.ts` |

Done when you can say which question the encounter asks (design doc, section 3) and what its captain's call is, without looking.

### 2. Work the spec on paper

Before any code, with ENGINE-NUMBERS.md open. Three passes.

**Units.** Turn every number in the spec's Ships, Rules and Tuning into what it comes to in the engine: hits, seconds, units of distance. Check each of these, as each has been wrong before:

- Anything described as health, against the damage of the weapons present.
- Any distance against any duration.
- Any radius against any weapon range.
- Any "switches to", "prefers" or "unless": put the encounter's real distances through the comparison in `Commander.ts`.
- Each AI ship's reactor against the cost of every card it carries, and each modifier against the weapons it carries.
- Any AI choice the crew is told about: that ship plays at skill 1.

**The cheapest win.** Find the cheapest plan the spec's own numbers let win every time, and hold the captain's call up against it. If one side of the call is never worth taking, or the answer can be had without the seat that's meant to find it, the encounter isn't asking its question. This is arithmetic, and ten minutes of it found that Quiet Running could be crossed unseen on any reading, with science doing nothing.

**Channels.** For every row of "What each station has", name the synced field that puts that fact on that phone ("What each seat can see" in ENGINE-NUMBERS.md). If there's none, the encounter has to make one. Then check the other way: that no other seat or the viewscreen has it too, and that its own seat can't get it more cheaply. If acting on the answer needs particular cards, check the crew's real decks can do it, or keep them supplied.

Done when every number is in engine units, the cheapest win is written down beside the captain's call, every clue has a named channel, and each mismatch is settled: the number changes, a missing piece joins step 4, or it's a finding for step 9.

### 3. Draft it, and measure

Write a draft of the class with its factions, its ships and as much of its rules as decides who's in danger, register it, and play it out with the real AI. Rates only show when it runs: how often a ship draws, how long before its first shot, how much shield it takes off a crew a minute.

Measure a few scripted crews, five seeds each:

- **One that does nothing.** If it's destroyed, there's no failure to fall forward from: losing the ship ends the whole game.
- **One that tries the obvious thing and gets it wrong.** Same question.
- **One that plays the cheapest win from step 2.** If it wins every time with room to spare, that's the finding.
- **One for each side of the captain's call.** If one is plainly better, that's the finding.

And for everything the spec says a ship does ("it weaves", "it jams you", "they go for the shuttle"), write a test that watches the AI do it. A card having an `aiEvaluator` proves nothing.

A finding is not a tuning job. Where the numbers are simply off (a route too long, a ship too slow to be a threat), change them and record it. Where the measurements contradict the encounter's question or its captain's call, record that with the numbers, say it first in your report, and leave the redesign to the designer.

Done when those crews are measured, each behaviour the spec claims is watched in a test or listed by name as not watched, and the runs are kept as `<Name>Encounter.balance.test.ts`.

### 4. Build the engine pieces first

A new AI goal, card, effect, ship design or hook is its own piece of work, with its own tests and its own commit, finished before the encounter that uses it.

- **Ship design:** a template in `campaign/shipDesigns.ts`, a name in `designNames`, and the design added to the list in `shipDesigns.test.ts`, which needs each to have its own appearance. Give its `fleeThreshold`: it's 0.25 otherwise.
- **Card:** three places, by the same key: `common-data/.../cardDefinitions.ts`, `common-ui/.../getUiCardDefinition.tsx`, `engine/src/cards/getEngineCardDefinition.ts`. Each card belongs to one system.
- **Status effect:** three places: `common-data/.../systemEffectDefinitions.ts`, `common-ui/src/utils/getUiSystemEffectDefinition.tsx`, `engine/src/effects/getEngineSystemEffectDefinition.ts`.
- **Objective type:** `ObjectiveInfo.ts`, then `getObjectiveLabel` in `common-ui/.../sectorLabels.ts`, whose exhaustive switch finds the rest.
- **AI goal:** `AiGoalInfo`, then `Commander.ts`, and a stance in `ai/types.ts` if the helm has to fly differently.
- **A hook on a ship:** a `ListenableEvent` on `Ship`, like `hitReceived`.

A helper goes on the `Encounter` base class at its third use. The second encounter to need something copies it.

Every build has also found a bug in shared behaviour. Fix it where it lives, test it there, give it its own commit, and say what else it changes.

Done when each piece passes its own tests with no encounter involved.

### 5. Write the encounter

One file, one class, and its definition exported beside it:

- Names used in more than one place (speakers, the objective's subject, faction and scenario ids) are constants at the top. So are tuning values, each with a comment in the game's terms, exported if a test needs it.
- `factions` is a field, typed `FactionConfig[]` if none of its entries comes from `hostileToPlayer`. Groups are fields made with `this.track()`.
- `populate()` only places things. Hails, timers, kept cards and questions start in `start()`, after `super.start()`. There's no constructor: the objective comes from the definition.
- `tick()` returns early once `this.isComplete`, as the campaign keeps ticking after the outcome so that last words get said.
- Removal arrives synchronously: `depart()` and `destroy()` call `onObjectRemoved` before they return. Set any "this was meant to happen" flag first.
- Ending has an order: tell the ships what to do, `complete()`, then speak. `complete()` cancels every timer and drops any question, so anything that happens after the outcome has its own due time and is done in `tick`, above the `isComplete` return. A failure calls `silence()` first.
- The elite form is `this.node.elite` in the same class. It twists the question, and never just adds ships.
- Everything is in game time, through `after` and `every`. Loop over `getPlayerShips(this.state)`: there can be more than one.

Comments say what happens in the game, as the crew would meet it, not what the code does.

Done when the class reads top to bottom as the spec's Rules section.

### 6. Write the lines

Lines are how the crew learns everything it can't see. Each is one of four kinds:

- **A tell:** `urgent`, with a `maxDelayMs`, because late is worse than never.
- **Status:** said once per stage, and only the worst if several passed at once. A line that's the crew's only count of something queues, however small.
- **Chatter:** waits for `!this.isHailing`, and is dropped otherwise.
- **The briefing:** queued first, so it's read in full. It states the rule once, in words a crew can act on. Work out its reading time and start nothing urgent until it's over.

Done when each line in the spec's Hails table has a trigger that fires once.

### 7. Test it, and run it

Unit tests: one per rule in the spec and one per line of its Tests list, and for a failure, no reward, Warp Away still offered, and the run carrying on. The behaviour tests and measurements from step 3 are finished here against the final class. Then run it in the real game and read the screenshots. TESTING.md has how.

Done when the unit tests, `npm run test:balance`, `npm run typecheck` and `npx eslint` on the changed files pass, and the screenshots have been looked at.

### 8. Register it

- Add the definition to the list in `EncounterRegistry.ts`, its id to a pool in `campaign/sectorThemes.ts`, and the id to the sorted list `Encounter.test.ts` expects.
- Then run every other encounter's unit and balance tests. Adding to a pool changes the random numbers every seeded campaign sees, so a test that leaned on one random answer needs a new seed. If a simulation's "usually" turns out to depend on the seeds, widen it and correct that encounter's "Measured".

### 9. Write back to the spec

The spec is the project's memory, and the next spec is written from it. Under the encounter, add:

- **As built:** each place the build differs from the spec, with the reason and the number behind it.
- **Measured:** what the played-out runs showed, with seeds and counts. Findings from steps 2 and 3 go first.
- **Still to check, by playing it:** what only people at a table can answer, and each behaviour or screen that wasn't watched.

Add an "As built" under each shared piece you built, and update the Status paragraph at the top. Then add to ENGINE-NUMBERS.md any fact about the engine that cost you time and would cost the next build the same, as one line, where its subject is.

Done when someone reading only the spec would build what's now in the code.
