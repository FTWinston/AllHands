# Encounter specs: the first three

Build-ready specs for Toll Collectors, Slow Boat and Standing Orders, and the shared engine work they need. Design reasoning is in [encounter-design.md](encounter-design.md); this file says what to build.

Every number here is a starting value to tune in playtests. Every duration is in **game time**, so the difficulty clock (`GameState.timeScale`) scales it. Never use wall-clock time in an encounter. The one exception is reading time, which the base class handles: a hail stays up, and a question stays open, for at least as long as it takes to read in real seconds (see G below). Schedule things with the encounter's own `after` and `every`, which run in game time.

Each spec ends with a **check first** list: things I inferred from reading the code but didn't run, which the spec depends on.

## Build order

| Step | What | Unlocks |
|---|---|---|
| A | Sides declared per encounter; global factions removed | Everything |
| B | Encounter outcomes (success, failure, score) | Fail forward |
| C | Ships can leave an encounter | Toll Collectors |
| | **Toll Collectors** | |
| D | Hails | Slow Boat, Standing Orders |
| E | Requests on the map | Reading the question from the map |
| F | New objective types and the viewscreen objective line | Slow Boat, Standing Orders |
| | **Slow Boat** (plus a travel goal and one card) | |
| | **Standing Orders** (plus a deflector hook and three status effects) | |

A to C are refactors with no new content, and Toll Collectors proves them. Stop and playtest after each encounter.

**Status:** A, B, C and Toll Collectors are built and covered by unit tests, on the `encounter-groundwork` branch. D, E and F are built on `encounter-hails-and-requests`, stacked on it, and Slow Boat on `encounter-slow-boat` and `encounter-prompts`, stacked on that. Standing Orders is on `encounter-standing-orders`, at the top of the stack, followed there by the shared encounter toolkit that the first three turned out to need (G below). Nothing has been played by people yet. What differs from this spec, and what the build turned up, is noted under Toll Collectors, under "D to F as built", and under each encounter's "As built".

## Shared groundwork

### A. Sides per encounter

The mechanism stays: `FactionRegistry`, `FactionState`, `GameObject.faction`, and the AI commander's `registry.areHostile(...)` targeting, which already lets any ship attack any other. Only where the data lives changes.

- `Encounter` gains `protected readonly sides: readonly FactionConfig[] = []`. Each concrete encounter overrides it.
- `FactionRegistry` gains `setEncounterSides(configs)`, which removes every faction except the player's and then applies `configs` as `init` does now. `Encounter.start()` calls it before `populate()`. `Campaign.teardownEncounter()` calls it with `[]`.
- `GameRoom` initialises the registry with the player faction only. `campaign/factions.ts` keeps `playerFactionId` and loses `factionConfigs`.
- A helper for the common case: `hostileToPlayer(id)` returns `{ id, relations: { [playerFactionId]: RelationshipType.Hostile } }`.
- Existing encounters (skirmish, ambush, assault, escort, survive, bosses) each declare `sides = [hostileToPlayer('hostiles')]` until they're replaced.

Remove `factionId` and everything that only exists to carry it:

- `SectorNodeInfo.factionId`, `SectorDestinationInfo.factionId`, `DevEncounterInfo.factionId`, `EncounterSummaryState.factionId`
- `SectorTheme.factionId`; `EncounterDefinition.defaultFactionId`; `Encounter.factionId` and `defaultEnemyFactionId`
- `factionLabels` and `getFactionLabel` in `common-ui/.../sectorLabels.ts`; the `faction` field in `game-ui/src/utils/describeEncounter.ts`
- Their uses in `SectorGenerator.ts`, `Campaign.ts`, `SectorDestinationState.ts`, `testUtils.ts` and the two stories that set a faction

Turn `campaign/enemyTemplates.ts` into ship designs that aren't tied to a faction:

- `EnemyRole` becomes `ShipDesign`. Each design carries its own `appearance`, so a shape always means the same behaviour. `factionAppearances` and `factionSkill` go.
- `createEnemySetup(role, factionId, position, options)` becomes `createShipSetup(design, side, position, options)`, and `options` gains `skill` (default 0.8), set by the encounter.
- `spawnEnemies(state, factionId, spawns)` takes a side id in place of the faction id. `EnemySpawn` gains an optional `position`, for encounters that place ships deliberately instead of on a ring around the player.

### B. Outcomes

- `export type EncounterOutcome = 'success' | 'failure'`, in common-data beside `ObjectiveInfo`.
- `Encounter.complete(outcome: EncounterOutcome = 'success', score = 1)`. `score` is 0 to 1 and only graded encounters pass anything but 1. `Encounter` exposes `outcome` and `score`; `isComplete` stays.
- `EncounterSummaryState.objectiveMet` becomes `outcome: EncounterOutcome | null`.
- `Campaign`: antimatter is awarded only on success, as `Math.round(reward * score)`. Warp Away is offered on **any** outcome, since leaving is how a failed encounter ends. `warpAway()` and `leaveIfAllDeparted()` test `outcome !== null`.
- After a failure, whatever is still hostile stays hostile until the crew warps away. The encounter decides whether its hostiles withdraw.
- Boss encounters can't fail except by losing the ship, for now.

### C. Leaving an encounter

Today a fleeing ship runs 50 units, stays in the game, and comes back if its hull recovers, so "destroy all" means chasing it down. Driving something off has to count.

- `Commander.withdraw()`: switches to the flee behaviour permanently, with no return on hull recovery. Encounters call it to make a ship stand down.
- A ship that is fleeing or withdrawing and has been more than `departDistance` (30) from every hostile it knows about for `departDelayMs` (3000) **departs**: it's removed from the game with a warp-out effect instead of the explosion `Ship` broadcasts on destruction.
- `Encounter.onObjectRemoved(object, reason: 'destroyed' | 'departed')`, passed through from `Campaign.onObjectRemoved`.
- `allHostilesDestroyed(state)` becomes `noHostilesRemain(state)`. Its logic doesn't change; departed ships are simply gone.

### D. Hails

One line of speech on the viewscreen. This is how the opposition and the people being helped get a voice, and how a captain learns an ally's condition.

- `Encounter.hail(speaker: string, text: string)` sets a synced `GameState.hail` (`speaker`, `text`, `expiresAt` in game time). A new hail replaces the current one.
- Shown on the viewscreen only, never on phones. Default duration 6000 game ms, with a floor of 4 real seconds so a fast clock can't make it unreadable.
- Hails are not blocking and need no answer.
- **Prompts** (a hail with choices that tactical answers) are only needed by Slow Boat's elite form, and are specified there.

### E. Requests on the map

The fiction for what a node is: science's long-range sensors are picking up calls for help.

- `EncounterDefinition` gains `request: { from: string; subject: string; text: string }`. Stations have none.
- A node's `name` becomes `"<from>: <subject>"` in place of `"Encounter B2"`. `SectorDestinationInfo` carries `text`, and science's long-range sensor list shows it.
- `getNodeKindLabel('combat')` returns `"Request"`, and the elite form `"Priority request"`. The `'combat'` kind keeps its name in code for now, to limit churn.
- `SectorGenerator`'s `easyEncounters` and `hardEncounters` pools become per-theme lists on `SectorTheme`.

### F. Objectives

`ObjectiveInfo` gains:

| Type | Label | Complete when |
|---|---|---|
| `{ type: 'clear' }` | "Clear the area" | No hostile ships remain. Replaces `destroyAll` |
| `{ type: 'protect'; subject: string }` | "Protect *subject*" | Decided by the encounter |
| `{ type: 'shutDown'; subject: string }` | "Shut down *subject*" | Decided by the encounter |

- `getObjectiveLabel` in `sectorLabels.ts` gains the three labels; its exhaustive switch will point at anything missed.
- `ObjectiveState` gains a `subject` string, empty where unused.
- **The viewscreen shows the objective label during an encounter**, and nothing else about it: no ally health bar, no progress bar. Status comes from hails and from science scanning. Sync the label to the game client only. This changes the current rule that clients learn nothing about the running encounter, deliberately: a captain has no other console.

### D to F as built

- **A hail lasts as long as it takes to read**: 2.5 seconds plus 55 ms per character, in real time whatever the game clock is doing. A fixed six seconds was too long for "Withdrawing." and far too short for a three-sentence briefing.
- **Hails queue, rather than replacing each other.** At first a new hail replaced the current one, and the encounters each worked around that (a throttle in Slow Boat, a private queue in Standing Orders). Measured with an idle crew, Slow Boat still lost one to three of its seven lines at normal speed, and the Standing Orders briefing was cut short at any faster clock. See G.
- **Hails, the objective and the outcome are sent to every client**, like the sector message is, and only the viewscreen draws them. Sending them to the viewscreen alone would mean hanging them off each player ship.
- **The viewscreen shows the outcome too**: the objective's heading changes to "Objective complete" or "Objective failed", with a sound for each. Now that an encounter can be failed, the crew needs telling which it was.
- **There's no countdown for a survive objective.** The label says how long, but not how long is left.
- **The same line said twice in a row doesn't replay**: no second chirp, and the text isn't typed again. It needs an id on each hail if that matters.
- **Prompts came later**, with Slow Boat's elite form: see "As built" under Slow Boat.
- **Only the three new encounters have requests**, so the placeholder fights are still called "Encounter B2", under the "Request" label.
- **Encounter pools are per sector**, and the three new encounters are only in sector 1's.

### G. The encounter toolkit, as built

Built after all three encounters, from what each of them had written for itself (the "third use" rule in the design plan). Everything here is on the `Encounter` base class unless it says otherwise, so a new encounter is mostly `populate`, `tick`, `onObjectRemoved` and its lines.

**Definitions live with the encounter.** Each encounter's file exports its `EncounterDefinition` (id, name, kind, objective, default environment, request, `create`), and `EncounterRegistry` only lists them. Names used in both the definition and the class, such as who's calling and the objective's subject, are constants in that one file. Encounters don't override the constructor to restate their objective: the node already carries it from the definition. Survive is the exception, as how long to hold out varies by node.

**Hails** (`hail(speaker, text, options?)`, in `HailQueue`):

- Lines are said one at a time, in the order they're hailed, each for its full reading time. That time is counted in real milliseconds as it passes, so it holds even if the clock changes speed partway through a line.
- `urgent` lines go ahead of everything waiting (behind other urgent ones), and cut short an ordinary line once it has been up for 3 real seconds (`minHailDuration`). Urgent lines never cut each other short. Slow Boat's turn warnings and the platform's answers to a signal are urgent, and so is *Marrow*'s line at the jump point.
- `maxDelayMs` drops a line that hasn't been said within that much game time. A turn warning that can't be said within 3 seconds isn't said.
- Chatter that's only worth saying straight away checks `isHailing` and waits for a gap instead of queueing. That's how "We have Harrier Two" works.
- `silence()` cuts off the current line and drops the queue. Failure uses it, and Standing Orders' success uses it before its two closing lines.
- Hails carry on while a question is waiting for an answer: the viewscreen shows them above it.

**Questions** (`ask(speaker, text, answers, { timeoutMs, defaultAnswer })`): each answer carries its own `onChosen`, so an encounter that asks two things never has to work out which one was answered. Running out of time gives the default answer. The time limit is in game time, but never less than the reading time of the question in real time, so a fast clock can't make it unanswerable. Asking again replaces the question that's waiting, which then never gets an answer. Completing the encounter drops it.

**Timers** (`after(delayMs, fn)`, `every(intervalMs, fn, firstAfterMs?)`): game time, cancellable, and all cancelled once the encounter is decided. If the game jumps several intervals at once, a repeating timer runs once, not once per interval. They run before `tick`.

**Groups of objects** (`track<T>()`): a list that drops each object as it leaves the game, however it goes, before `onObjectRemoved` is called. Harriers, escorts, cruisers and drones are all tracked groups, so no encounter prunes its own lists.

**Spawning** (`spawnShips(faction, spawns)`): creates AI ships from `ShipSpawn`s (`encounters/shipSpawns.ts`, formerly `spawnEnemies` in `CombatEncounter`) and adds them as one batch, so scenario ids resolve. It's for any faction, friendly ones included.

**Cards kept in hand** (`keepInHand(role, cardType)`, `stopKeeping(cards)`): deals one card to that crew member on every player ship, with three traits:

- `primary`, so it comes back to the hand when it's played, or when it's used up from a slot.
- `expendable`, so it never joins the deck, and is gone when the deck is rebuilt after the encounter.
- `priority`, so it can't be discarded.

`stopKeeping` takes one out of the hand straight away, or, if it's in a slot, lets it be used up once more. This replaces Slow Boat's re-dealt Extend Shields and Standing Orders' re-dealt kit.

It relies on two changes to how a played card is handled:

- **`primary` now works from the hand.** It used to check for "another primary card in the hand" while the card itself was still there, so a primary card played from the hand never came back. It now comes back unless another *copy of the same type* is already there. Before, any other primary card stopped it. `slowAndSteady` is the only primary card in any deck, so nothing that exists plays differently.
- **Only `RemoveOnPlay` extra traits are removed when a card is played.** Since extra traits became an enum, every one was being removed on play, `Normal` and `Negative` included. That stripped a kept card's traits after one play. It also means a `stabilised` card now stays stabilised after being played, as its description says.

**Dev tools launch elite forms.** `devLoadEncounter(id, elite)`, and an **Elite** button beside each request in the dev tools' encounter list. Stations and bosses have no elite form. Tests use it in place of reaching into the campaign.

**Balance simulations are their own test project.** Tests that play an encounter out with the real AI to check its tuning, rather than whether it works, are `*.balance.test.ts` and run with `npm run test:balance`, not with the unit tests. Slow Boat's three played-out tests are the only ones so far.

---

## 1. Toll Collectors

| | |
|---|---|
| **Question** | Prioritise |
| **Class / id** | `TollCollectorsEncounter extends Encounter` / `tollCollectors` |
| **Request** | Hauler Local 12: toll dispute. "Wardens on the Kessin jump point, charging forty percent. We can't pay it and we can't go round." |
| **Objective** | `{ type: 'clear' }` |
| **Target length** | 2 to 3 minutes |
| **Pool** | Sector 1, any layer. The one honest fight in the first slice |

### Sides

```ts
sides = [hostileToPlayer('wardens')];
```

### Ships

| Scenario id | Design | Position | Goal | Notes |
|---|---|---|---|---|
| `tollCruiser` | `bulwark` (today's `heavy`: 135 shield, a third of it volatile, sometimes torpedo-tuned) | 14 units ahead of the player, facing it | `defend-position` on its own position, radius 30 | `fleeThreshold: 0`. Name "Warden Cruiser *Assize*" |
| | `harrier` (today's `scout`) | 3 units to the cruiser's port | `guard-ship: tollCruiser` | `fleeThreshold: 0.4`. Name "Escort One" |
| | `harrier` | 3 units to the cruiser's starboard | `guard-ship: tollCruiser` | "Escort Two" |

Skill 0.7 for all three. The names are what the crew will call them out loud, so they're short and distinct.

### Rules

1. **The cruiser withdraws** when its shields reach 0. Call `commander.withdraw()` and hail. Shields don't recharge during an encounter, so this always comes eventually.
2. **If the cruiser withdraws, the escorts withdraw with it.** Call `withdraw()` on each surviving escort.
3. **If the cruiser is destroyed, the escorts hunt**, even if they were withdrawing with it. Hunting is the existing `guard-ship` behaviour when the ward dies. Also call off any withdrawal and set their flee threshold to 0, so they come back and fight to the end.
4. **Escorts flee at 40% hull** and depart (groundwork C).
5. **Complete with `success`** when `noHostilesRemain`. There is no failure outcome: the only way to lose is to lose the ship.

Rules 2 and 3 are the question. Breaking the cruiser's shields ends the whole encounter, but means fighting 135 points of shield with two escorts on you. Peeling the escorts first is safer and slower. Destroying the cruiser is the worst result: it takes a few seconds to get clear after it turns, and a crew that keeps firing through them will find that out.

### What each station has

| Station | Sees | Does |
|---|---|---|
| Science | The cruiser's shield level and what it's tuned against, by scanning its hull. Each escort's hull, to call when one is about to break | Calls the tuning, and when the cruiser's shields are nearly gone |
| Tactical | The same scanned hull science sees. Its own weapons | Loads the weapon type the cruiser isn't tuned against. Picks the target. Stops firing when the cruiser turns |
| Helm | The flight picture | Stays out of the cruiser's forward arc, or holds the range that keeps the escorts' leash stretched |
| Engineer | Power, and damage arriving | Feeds tactical for the shield break, or shields for the slow route |

**Captain's call:** cruiser first, or escorts first. And the order to cease fire.

### Hails

| When | Speaker | Line |
|---|---|---|
| Start | Warden Cruiser *Assize* | "Unregistered vessel. Transit duty is forty percent of cargo. Heave to for assessment." |
| Cruiser withdraws | Warden Cruiser *Assize* | "Cost exceeds mandate. Withdrawing." |
| Cruiser destroyed | Escort One (or Two) | "*Assize* is gone. No quarter." |
| Success | Hauler Local 12 | "Point's clear. We'll take it from here. Drinks are on the Local." |

### Expected talk

> **Science:** "Cruiser's tuned for torpedoes. About twelve seconds."
> **Captain:** "Then it's phasers on the cruiser, now. Helm, get us round its side."
> **Helm:** "I need three power or we're doing this head on."
> **Engineer:** "You can have it, but shields drop to two."
> **Tactical:** "Its shields are down. It's turning. Do I keep shooting?"
> **Captain:** "No. Let it go."

### Elite form

A second `bulwark`, "Warden Cruiser *Tithe*", arrives 120 seconds in at 14 units on the opposite side, unless *Assize* has already withdrawn or been destroyed. It hails: "*Assize*, we have your signal. Engaging." Its arrival is the punishment for the slow route, so the elite turns "which first" into "can we afford the safe answer".

**Legacy (for when legacies are built):** on success, Local 12's haulers bring spare emitters to the sector boss. No failure legacy, since this encounter can't fail.

### Tuning

| Constant | Value |
|---|---|
| `jumpPointDistance` | 14 |
| `cruiserDefendRadius` | 30 |
| `eliteReinforcementMs` | 120 000 |
| Skill | 0.7 |

### Tests

- Completes with success when all three are destroyed.
- The cruiser withdraws when its shield reaches 0, and both escorts withdraw with it.
- Destroying the cruiser leaves the escorts hunting with a flee threshold of 0.
- Completes with success when the last ship departs instead of being destroyed.
- Elite: the second cruiser spawns at 120 s, and doesn't if the first has gone.
- Never completes with failure.

### As built

- **The defend radius is 30, not 16.** A defending ship ignores anything outside its radius, and a photon torpedo reaches 20 (25 with Extended Range), so at 16 the cruiser could be shelled for free.
- **Shields are polled each tick.** There's no event for them reaching 0.
- **A fleeing ship used to ignore hostiles outside the area it was defending or guarding**, so a withdrawing cruiser wouldn't have moved. Fleeing ships now run from every hostile they know of.
- **Departing ships jump to warp**, as does the player ship when it leaves a fight: the ship stretches and streaks off the way it was facing, with a tag naming who left. The player ship is still in the game until the scene changes, so the viewscreen hides a ship once its jump starts.
- **Destroying the cruiser as it withdraws brings the escorts back.** Whichever escorts are still there call off their own withdrawal, hunt, and no longer flee. An escort that has already left stays gone.
- **The existing placeholder encounters all play at skill 0.8 now.** They used to get 0.7, 0.85 or 1 from their sector's faction.
- **Its hails are in**, as written above, plus one from the second cruiser when it arrives.

### Found while building

- **The withdrawal takes a long time.** Against a player ship that sits still, the escorts take about 23 seconds to get clear and leave after the cruiser's shields drop, and the cruiser about 33. Those 33 seconds are now the window in which "let it go" matters, so some of that length is useful, but it's worth feeling out. Lowering `departDistance` from 30 would shorten it; 20 would roughly halve it.
- **The last ten seconds are free.** The escorts are faster than the cruiser and leave about ten seconds before it does. After that there's nobody left to turn back, so finishing the cruiser off costs nothing.

### Still to check, by playing it

- How long 135 shield takes to break with the starting tactical deck. If it's over 90 seconds, the shield-break route is never the right call, and the cruiser needs a smaller shield.
- Whether the cruiser and escorts at 14 units give the crew time to make a plan before the shooting starts.

---

## 2. Slow Boat

| | |
|---|---|
| **Question** | Protect |
| **Class / id** | `SlowBoatEncounter extends Encounter` / `slowBoat` |
| **Request** | Clinic ship *Marrow*: escort request. "Full ward, forty beds. We're crossing the Shallows drift and something's been shadowing us since the last beacon." |
| **Objective** | `{ type: 'protect', subject: 'Marrow' }` |
| **Target length** | 3 to 4 minutes |
| **Pool** | Sector 1, not the first two layers |

### Sides

```ts
sides = [
    { id: 'clinic', relations: { [playerFactionId]: RelationshipType.Friendly, stranded: RelationshipType.Hostile } },
    hostileToPlayer('stranded'),
];
```

### New engine pieces

**A travel goal.** `AiGoalInfo` gains `{ type: 'travel-route'; waypoints: Position[]; arrivalRadius: number }`. The commander sets the destination to the next waypoint and advances on arrival. It never chases. Its tactical officer still fires at hostiles in range, so the ship defends itself as it goes. The commander exposes `routeComplete`, and which waypoint it's on.

**A preferred target.** `search-and-destroy` gains an optional `prefer: string` (a scenario id, resolved like `guard-ship`'s). `Commander.updateTarget` adds `preferBonus` (30) to that object's score, so the harriers go for *Marrow* unless the player ship is much closer. This is what makes interposing work: get close enough to a harrier and it switches to you.

**A new ship design, `clinicShip`.** A tender appearance (for example `ring-spine-tender`). Hull: 8 plating and 2 shield emitters, so 30 shield and a lot of health. Helm: `slowAndSteady` only. Tactical: one slot, `phaserStrip` and `lowYield`. `fleeThreshold: 0`. Skill 0.6.

**A new engineer card, `extendShields`.** No target. Cost 3. "For 10 seconds, hits on the nearest friendly ship within 4 units land on your shields instead." Implemented as a status effect on the player's hull that the damage path checks when a friendly ship is hit.

- The encounter deals it to the engineer's hand at the start with the `primary` trait, so it comes back after each play, and removes it at the end.
- Its range is the point. It only works if helm keeps the ship within 4 units of *Marrow*, which is where the harriers are.

### Ships and timeline

*Marrow* (scenario id `marrow`) starts 4 units to the player's starboard on a parallel heading and flies three waypoints, a dog-leg of about 20, 15 and 20 units ending at the jump point. Tune its helm deck and the distances so the crossing takes about 180 seconds.

| Time | Event |
|---|---|
| 0 s | *Marrow* hails. Harriers One and Two spawn 12 units out, astern on either quarter, with `search-and-destroy` and `prefer: marrow` |
| Every 40 s | One more harrier spawns at 12 units from *Marrow* on a random bearing, if fewer than 3 are alive. Numbered in order |
| 5 s before each waypoint | *Marrow* hails its turn |
| *Marrow* within `arrivalRadius` of the last waypoint | Success |

Harriers are the `harrier` design at skill 0.6 with `fleeThreshold: 0.4`. A harrier that flees departs (groundwork C), so driving one off removes it and finishing it is wasted fire.

### Rules

1. **Success** when *Marrow* completes its route. It departs with a warp-out, every harrier withdraws, and the encounter completes with `success`.
2. **Failure** when *Marrow* is destroyed. Every harrier withdraws, and the encounter completes with `failure`. The crew warps away with nothing.
3. *Marrow* hails its hull state as it crosses 75%, 50% and 25%. That's the only way the crew learns it, other than science scanning *Marrow* in place of a harrier.
4. *Marrow* hails which harrier it's engaging whenever its target changes, at most once every 10 seconds.

### What each station has

| Station | Sees | Does |
|---|---|---|
| Helm | The flight picture | Stays within 4 units of *Marrow* through two turns it doesn't control, on the side the next harrier is coming from |
| Tactical | Its weapons. The scanned hull of whatever science is scanning | Drives harriers to 40% and switches. Takes the ones *Marrow* isn't engaging |
| Science | One ship's systems at a time | Scans a harrier's helm to call its run before it starts, or scans *Marrow* to learn how bad it is. It can't do both |
| Engineer | Power, and `extendShields` | Chooses when to spend 3 power covering *Marrow*, and whose power that comes out of |

**Captain's call:** how to split between covering *Marrow* and driving harriers off. And near the end, with shields low and *Marrow* almost there, whether to keep taking its hits.

### Hails

| When | Speaker | Line |
|---|---|---|
| Start | Clinic Ship *Marrow* | "Glad of the company. We'll hold a steady course and keep our one gun busy. Stay close, our shields are mostly for show." |
| Before each turn | Clinic Ship *Marrow* | "Coming about to port in five." (or starboard) |
| Target change | Clinic Ship *Marrow* | "We have Harrier Two." |
| 75% / 50% / 25% | Clinic Ship *Marrow* | "Taking hits, nothing vital." / "We've lost the aft ward. Moving patients forward." / "We can't take much more of this." |
| First harrier flees | Harrier (any) | "Not worth it. Breaking off." |
| Success | Clinic Ship *Marrow* | "Jump point. Forty patients say thank you, and so do I." |
| Failure | none | Silence is the line |

### Expected talk

> **Marrow (viewscreen):** "We have Harrier Two."
> **Captain:** "Then One's ours. Tactical?"
> **Tactical:** "On it, but it's behind us."
> **Science:** "Three's lining up a run on her stern. Ten seconds, maybe."
> **Engineer:** "I can cover her for ten, but I need science's power to do it."
> **Science:** "Take it after I call the run."
> **Helm:** "She's turning to port. I'm going to lose her if I don't follow now."

### Elite form

At 60 seconds the harriers' leader hails with an offer, as a **prompt**:

> **Stranded Lead:** "There's two hundred of us on a dead hauler, and that ship's carrying antibiotics. A third of the stores and we're gone. Your call."

Tactical gets a modal with **Hand it over** and **Refuse**, built like the sector intro confirmation and with the same check that the sender is tactical. It times out after 20 seconds as a refusal.

- **Hand it over:** every harrier withdraws, and no more spawn. *Marrow* completes its route. Success, with score 0.5.
- **Refuse:** one extra harrier spawns immediately, and the cap rises to 4.

This needs a synced `GameState.prompt` (`speaker`, `text`, `options`, `expiresAt`) and a `Encounter.onPromptAnswered(optionId)` hook. Neither answer is the right one, which is the point of asking.

**Legacy (for when legacies are built):** handing the stores over makes the Stranded friendly at the sector boss. Refusing and succeeding has *Marrow* there as a repair stop mid-fight. Failing has neither.

### Reward

On success, the engineer is offered a permanent `extendShields` for their deck, on top of antimatter. How a reward card is offered isn't designed yet. Antimatter alone is fine for the slice.

### Tuning

| Constant | Value |
|---|---|
| `crossingMs` (target) | 180 000 |
| `harrierIntervalMs` | 40 000 |
| `maxHarriers` | 3 (elite, after a refusal: 4) |
| `harrierSpawnDistance` | 12 |
| `preferBonus` | 30 |
| `extendShields` cost / duration / range | 3 / 10 000 ms / 4 units |
| `turnWarningMs` | 5 000 |
| `offerAtMs` / `offerTimeoutMs` (elite) | 60 000 / 20 000 |

`turnWarningMs` is a tell, so it should read from the global tell multiplier once difficulty exists.

### Tests

- Success when *Marrow* reaches the last waypoint; the harriers withdraw; reward is given.
- Failure when *Marrow* is destroyed; no reward; Warp Away is still offered.
- Harriers prefer *Marrow*, and switch to the player ship when it's much closer.
- A harrier below 40% hull flees and departs, and a replacement arrives on the next interval.
- Never more than `maxHarriers` alive.
- `extendShields` redirects a hit on *Marrow* to the player's shields within 4 units, and doesn't beyond.
- The card is in the engineer's hand at the start, returns after play, and is gone after the encounter.
- *Marrow* hails at each hull threshold once.
- Elite: each prompt answer, and the timeout, has its stated effect.

### As built

The standard form is built, on `encounter-slow-boat`, and the elite form on `encounter-prompts`, stacked on it.

- **The elite form is as specified**, with two lines added for the harriers' leader: "That'll keep us alive. We're gone." and "Then we'll take all of it." Handing the stores over is worth half the reward. An offer that's still standing when *Marrow* is destroyed is withdrawn.
- **A prompt is a modal on tactical's phone** that covers the rest of the screen until it's answered or runs out, so tactical can't fire while deciding. The viewscreen shows the question, the possible answers and a countdown along the bottom, with anything said meanwhile above it.
- **A prompt's time limit is in game time**, unlike a hail's reading time, so a faster clock leaves less time to talk it over. It's never less than the time it takes to read the question, though.
- **There's no `onPromptAnswered` hook.** Each answer carries its own `onChosen` (see G), so the offer is `ask(...)` with "Hand it over" calling `handOverStores` and "Refuse" calling `refuseOffer`.

- **Shields are the health bar, so *Marrow* can't have "a lot of hull".** Hull health is a card count of about ten, and one torpedo does 34 to 40. Anything that gets past the shields is nearly the end. *Marrow* has 75 shield at full hull power, which absorbs everything while it lasts, and almost nothing under it.
- ***Marrow* reports its shields, not its hull**, at three quarters, half and a quarter. Its opening line now ends "our shields weren't built for this."
- **The route is 60, 40 and 60 units**, not 20, 15 and 20. *Marrow* covers about 0.87 units a second on `slowAndSteady`, so the spec's route took 70 seconds. The crossing now takes 197.
- **Harriers never switch to the player ship.** With a bonus of 30, and the existing rule that a new target has to score a quarter better than the current one, they always go for *Marrow*. The crew is only ever hit through its own extended shields.
- ***Marrow* plays at skill 1.** At 0.6 the noise in its targeting had it change its mind every ten seconds, which made "We have Harrier Two" useless.
- **Extend Shields is layered.** A hit lands on the extending ship's shields first, and whatever they let through then meets the target's own shields, not its hull. At the player ship's usual hull power that's a fifth of each hit.
- **The card is kept in hand, as the spec says, but only once `primary` was fixed.** A `primary` card played from the hand used to not come back, so at first the encounter dealt a fresh expendable Extend Shields whenever the engineer had none and the shields weren't extended. It now uses `keepInHand` (see G): one card, which comes straight back each time it's played. That means it can be replayed while the shields are still extended, which restarts their 10 seconds for another 3 power. Before, it couldn't be played again until they'd run out.
- **Hails take turns.** The opening line is always read in full before anything else is said. Turn warnings are urgent, so they cut short whatever else is being said, and they're dropped if they can't be said within 3 seconds. "We have Harrier Two" waits for a gap rather than queueing, as it's no use late. The first turn's direction is worked out from where *Marrow* started, which the encounter keeps, rather than from its motion history, which may no longer go back that far.
- **The helm follows a route without its own evaluation.** A travelling ship has a `travelling` stance, which makes the helm ignore its target and fly to the destination, as a withdrawing one does.
- **Failure is silent.** Whatever was being said is cut off when *Marrow* is destroyed.
- **No reward card.** Antimatter only.

### Measured

With a simulated crew, on a few random seeds, so treat these as rough. Two seeds of each, and a full crossing, are in `SlowBoatEncounter.balance.test.ts` (`npm run test:balance`), which will fail if tuning changes push either outcome the other way:

- **A crew that does nothing loses *Marrow*** at 86, 120 and 188 seconds into the 197-second crossing.
- **A crew that only stays alongside with shields extended the whole way, and never fires, gets it there** in five runs out of five, ending with between nothing and 36 of its own 120 shield.

So extending shields alone is just about enough, and driving harriers off is what makes it comfortable. What a real crew manages, with a card that costs 3 power and a helm that has to keep within 4 units, is the thing to playtest.

### Still to check, by playing it

- Whether keeping within 4 units of *Marrow* through its turns is achievable by hand, and fun.
- Whether three and a quarter minutes of the same pressure holds up, or it needs a change of pace partway.
- Whether the crew notices that the harriers never shoot at them.

---

## 3. Standing Orders

| | |
|---|---|
| **Question** | Diagnose |
| **Class / id** | `StandingOrdersEncounter extends Encounter` / `standingOrders` |
| **Request** | Dock clerk, Tessaly Yard: impounded cargo. "The old customs platform's had our supply run for three weeks. I've found its manual. I need someone with a deflector dish." |
| **Objective** | `{ type: 'shutDown', subject: 'Customs Platform 7' }` |
| **Target length** | 3 to 5 minutes |
| **Pool** | Sector 1, not the first two layers |

### The idea

The platform stands down for one specific deflector combination: a modifier, a substance and a delivery. Each part can be observed, and each by a different seat. The platform only listens once its shields are down, and it must not be destroyed.

| Part | Who learns it | How |
|---|---|---|
| **Substance** | Science | Scanning the platform's science system shows the platform's own deflector card. Its substance is the answer's |
| **Modifier** | Engineer | Every 15 seconds the platform pings the ship, and a status effect lands on a random crew system for 8 seconds: **Phased Ping**, **Coherent Ping** or **Inverted Ping**. No ping at all means Modulated |
| **Delivery** | Whoever is watching the viewscreen | The platform "answers in kind". It fires only phasers: Beam. Only torpedoes: Pulse. Both: Burst |

With a captain, the third clue is the captain's, and it's the one clue in the slice that a captain holds personally. With four, tactical is the natural watcher.

### Sides

```ts
sides = [hostileToPlayer('customs')];
```

On success the encounter calls `factionRegistry.setRelationship('customs', playerFactionId, RelationshipType.Neutral)`, which already exists and already notifies listeners.

### Choosing the answer

At `start()`, pick the answer from the combinations **the science player can actually build**:

1. Read the science deck. For each of the three slots, collect the values its scan cards can provide, plus the slot's default (Modulated, Graviton, Field), which is what an empty slot gives.
2. Drop Field from the delivery options: a platform that never fires gives no pressure.
3. Keep only the combinations that can be slotted at once. A scan card goes into one slot and provides only that slot's part, even if it names two or three, so every non-default part needs its own card. Coherent Chroniton Beam can't be built from a single `coherentChronitonScan`.
4. Pick one at random that has at least two non-default parts.

With the current starting science deck this gives modifiers Modulated, Phased, Inverted and Coherent; substances Graviton, Polaron, Tetryon and Chroniton; and deliveries Burst, Pulse and Beam, less the combinations that would need one card in two slots.

Then configure the platform to match:

- **Substance:** set the platform's substance slot directly, so its deflector card shows it. Give it no substance scan cards of its own that could change it.
- **Modifier:** the ping uses the matching effect, or doesn't run for Modulated.
- **Delivery:** its tactical deck is phasers only, torpedoes only, or both.

### New engine pieces

**The platform**, a ship design `customsPlatform`: an `AiShip` that doesn't move, made by setting `priorities: { helm: 0 }`, which disables the helm officer. Goal `defend-position` on its own position. Hull: 6 shield emitters, 1 energy tuning, 1 torpedo tuning and 10 plating, so 90 shield and a lot of health. Two weapon slots. `fleeThreshold: 0`. Skill 0.6. Placed 12 units ahead of the player.

**Three status effects**, `phasedPing`, `coherentPing` and `invertedPing`. Not levelled, 8 seconds, no mechanical effect. They exist to be read. Each needs an entry in the three places a system effect is defined (common-data, common-ui, engine).

**A deflector hook.** `Ship` gains a `ListenableEvent` fired when a deflector card resolves against it, carrying the source ship and the card type. `ScienceState.playDeflectorCard` is where it resolves today. The encounter subscribes on the platform.

**Drones.** A `drone` ship design: the `harrier` with half the hull, appearance `mantis-drone`, `fleeThreshold: 0`, on the `customs` side.

### Rules

1. **The ping** runs every 15 seconds while the player ship is within `pingRange` (10) of the platform. Outside it, no ping and no modifier clue. `pingRange` is inside the platform's weapon range, so collecting the clue means being shot at.
2. **The platform listens only with its shields at 0.** A deflector card played on it before that does nothing, and it hails "Signal not received."
3. **Right combination, shields down:** the platform goes neutral, every drone is removed, the encounter completes with `success`.
4. **Wrong combination, shields down:** two drones launch, if fewer than 4 are alive. The answer doesn't change. The platform hails.
5. **Platform destroyed:** the encounter completes with `failure`. Drones shut down. The clerk hails.
6. No time limit. The platform's fire is the clock.

Rule 2 is tactical's job, and it's a careful one: take 90 points of shield off without going far into the hull, using whichever weapon type the shields aren't tuned against. Science can scan the hull to call that tuning, or scan the science system to get the substance, and not both at once.

### What each station has

| Station | Sees | Does |
|---|---|---|
| Science | The platform's deflector card (substance), or its hull and tuning, depending on what it scans. Its own three slots | Collects the substance, then assembles the combination from three parts that came from three people, and fires it |
| Engineer | The ping effect by name, on whichever system it lands | Calls the modifier. Keeps science powered for the deflector, which costs more than a scan |
| Tactical | Its weapons, and the scanned hull when science is on it | Strips the shields and then **stops**. Handles drones after a wrong answer |
| Helm | The flight picture | Holds the ship inside ping range and outside the platform's best arc, then moves to whatever range the delivery type needs |
| Viewscreen | What the platform is firing | The delivery clue |

**Captain's call:** when the crew is sure enough to send it. A wrong answer costs two drones, and waiting for one more ping to confirm costs hull.

### Hails

| When | Speaker | Line |
|---|---|---|
| Start | Dock Clerk, Tessaly Yard | "Manual says it stands down for an inspection signal: three parts, off your deflector. It only listens with its shields down, and it answers in kind, so match how it shoots. Please don't break it. We need the dock." |
| Start, 6 s later | Customs Platform 7 | "Vessel in controlled space. Cargo is impounded pending inspection. Withdraw or be assessed." |
| Signal with shields up | Customs Platform 7 | "Signal not received." |
| Wrong combination | Customs Platform 7 | "Inspection signal invalid. Enforcement dispatched." |
| Right combination | Customs Platform 7 | "Inspection accepted. Transit granted. Have a compliant day." |
| Success, 6 s later | Dock Clerk, Tessaly Yard | "Three weeks! Three weeks, and it wanted a form. Thank you." |
| Platform destroyed | Dock Clerk, Tessaly Yard | "...That was the dock. That was the only dock." |

The clerk's opening line is the whole briefing, and the only place the rule is stated. A crew that talks over it will have to work the rule out.

### Expected talk

> **Engineer:** "Something called Inverted Ping just landed on helm."
> **Captain:** "Inverted. Science, what've you got?"
> **Science:** "Tetryon. I need the last part."
> **Captain:** "It's only firing torpedoes, so... pulse?"
> **Tactical:** "Shields are at ten. Do I finish them?"
> **Captain:** "Finish the shields and then hands off. Science, can you build Inverted Tetryon Pulse?"
> **Science:** "Two cards short. And I need four power for the dish."

### Elite form

The platform **re-keys**. Each time its shields take a hit after reaching 0, and at most once every 30 seconds, one random part of the answer changes, and the platform's deflector card, ping or armament changes to match. Nothing announces it. An answer the crew assembled a minute ago may be stale, so they have to confirm all three parts immediately before sending.

**Legacy (for when legacies are built):** on success, Tessaly Yard sends a repair tender to the sector boss. On failure, nothing.

### Tuning

| Constant | Value |
|---|---|
| `platformDistance` | 12 |
| Platform shield / hull | 90 / plating-heavy |
| `pingIntervalMs` / `pingDurationMs` | 15 000 / 8 000 |
| `pingRange` | 10 |
| `dronesPerWrongAnswer` / `maxDrones` | 2 / 4 |
| `rekeyCooldownMs` (elite) | 30 000 |

`pingDurationMs` is a tell and should read from the global tell multiplier once difficulty exists.

### Tests

- The chosen answer is always buildable from the given science deck, for the starting deck and for a deck with no delivery cards at all.
- The platform's deflector card, ping effect and weapons match the answer.
- No ping outside `pingRange`; no ping when the modifier is Modulated.
- A deflector card played with shields up does nothing and counts as no attempt.
- The right combination with shields down: platform neutral, drones gone, success.
- A wrong combination with shields down: two drones, capped at four, answer unchanged.
- Destroying the platform: failure, no reward, Warp Away still offered.
- Elite: a re-key changes exactly one part and updates the matching clue.

### As built

Both forms are built, on `encounter-standing-orders`.

- **The platform turns, but never moves.** Its weapons have narrow arcs (a phaser cannon covers a radian, a torpedo half that), so a platform that couldn't turn would never fire at a ship off its nose. Its helm deck is nothing but Face Target. A test with the real AI confirms it stays put, turns and fires.
- **It has 60 plating under its 90 shield**, not "a lot of health" in the abstract. A torpedo does 34 to 40 and a phaser cannon 20, so that's one or two stray hits after its shields go. Without it, the shot that follows the one that breaks its shields would destroy it.
- **The platform's deflector is set directly**, to the substance alone, and reasserted every tick, so nothing its own science officer does can change what a scan shows.
- **It's armed with phaser cannons for a beam, photon torpedoes for a pulse, and both for a burst.**
- **The signal is chosen from what the science deck can build**, needing at least two cards. If the deck can't build any signal with a delivery, the platform picks a simple one anyway, and science is kept supplied with the scan cards they lack, with `keepInHand` (see G). Each kit card comes back to science's hand once the deflector has used it. When the elite form re-keys, the kit is worked out again from science's own cards: kit cards the new signal doesn't need are taken away, and any it does are dealt.
- **Each part of the signal has its own kit card**, so a kit never needs two of the same. The modifier's are the modifier-and-substance scans (Phased Polaron, Coherent Tetryon, Inverted Antiproton), as the modifier-and-delivery ones are the only source of each delivery. A kept card can't come back to a hand that already holds a copy, so a duplicate would be lost after one use.
- **The briefing is read in full, then the platform speaks.** Its replies to a signal ("Signal not received.", "Inspection signal invalid.") are urgent, so they cut the briefing short after 3 seconds if science fires that early.
- **Deflector cards do nothing in the engine yet**, so the signal's effect comes entirely from a new hook on the ship it's used on.
- **Drones leave when the platform stands down or is destroyed**, with a warp-out.
- **The elite form re-keys on a timer**, every 30 seconds once the shields are down, not on each hit, and only ever changes the modifier or the substance. Changing the delivery would mean re-arming the platform mid-fight.

### Still to check, by playing it

- **How often science can actually assemble the signal.** It needs up to three specific cards, from a six-card deck that also has to supply ordinary scans.
- That scanning the platform's science system shows its deflector card on science's screen. The engine sends it; I haven't seen it drawn.
- The power cost of the assembled deflector against science's usual power, since "science needs four power" is the scarcity lever here.
- The range of each delivery type, so helm's repositioning for the final shot is real and not a formality. Deflector cards have no range of their own in the engine yet.
- Whether the ping's mark, which lasts 8 seconds on one of four systems, is noticed by an engineer who isn't looking for it.
- How long 90 shield takes to strip, and whether the crew can stop in time once it has.
