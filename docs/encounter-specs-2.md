# Encounter specs: the rest of Sector 1

Build-ready specs for the worked examples in [encounter-design.md](encounter-design.md) that aren't built yet: Fever Ship, Dead Weight, Last Shuttle Out, Quiet Running, and the Sector 1 boss, The Gate That Never Closed. The first three encounters, and the toolkit they left behind, are in [encounter-specs.md](encounter-specs.md). Read its section G first: everything here is written against that base class.

The same rules hold. Every number is a starting value to tune in playtests. Every duration is in game time, scheduled with the encounter's own `after` and `every`. Reading time is the base class's business.

These were written with the first three built, so the numbers are already in the engine's terms: hits are counted in cards, shields by hull power, clues by the field that carries them. Where a design in the plan depended on something the engine doesn't do, the spec says what it does instead, under **Changed from the plan**. Each spec still ends with **Check first**: what I read in the code and didn't run.

**Status:** groundwork H is built, on `aimed-shots`, and so is reading a hand (M below), on `scan-hands`, stacked on it. Fever Ship is built, both forms, on `fever-ship`: see its "As built". It needed one shared fix, to the AI's scan evaluator, and nothing else shared. Groundwork I, K and the `recover` objective from L are built, on `dead-weight`, and so is Dead Weight, both forms, with a new card, Transfer Power: see each one's "As built". Last Shuttle Out is built, both forms, on `last-shuttle-out`, with three new ship designs and nothing shared: see its "As built". Its grid never fires on the crew, which is the largest change from its spec. `setObjective` from L, and J, are not built yet, and nor are the encounters after Last Shuttle Out.

## Build order

| Step | What | Unlocks |
|---|---|---|
| H | Aimed shots land on the system aimed at | Fever Ship, Dead Weight |
| | **Fever Ship** (plus one ship design) | |
| I | Hits can be heard | Dead Weight, Quiet Running |
| K | Ships that do nothing | Dead Weight, and everything after |
| L | Two objective types | Dead Weight, Quiet Running |
| | **Dead Weight** (plus a tow line) | |
| | **Last Shuttle Out** (nothing shared that's new) | |
| J | New orders for a ship | Quiet Running, the boss |
| | **Quiet Running** (plus two cards) | |
| L | An objective that changes | The boss |
| | **The Gate That Never Closed** (plus four key cards) | |

Fever Ship is first because it needs the least: one shared change and one design. Stop and playtest after each.

## Shared groundwork

### H. Aimed shots

Tactical can aim at a system once science has identified it, and the aim does nothing: `TacticalState.playWeapon` resolves the sub-target, uses it to check the angle, and drops it. `fireShot` then calls `target.damage` with no system, so `Ship.damage` picks one at random.

- `WeaponSlotTargetCardFunctionality.fire` gains a last parameter, `targetSystem: ShipSystem | null`. `playWeapon` passes `subTarget?.system ?? null`, for the first shot and each extra one.
- `fireShot` passes it on as `Damage.targetSystem`, which `Ship.damage` already honours: 60% of what gets through (rounded up) to that system, the rest to the hull.
- `Damage` gains `sourceId?: string`, the firing ship's id, set by `fireShot`. Groundwork I needs it.

This changes every fight. AI tactical officers already aim at their commander's focus system, tactical first and then helm, whenever their science has found it, so the crew will lose weapons and manoeuvres faster than now. It also makes Focus Shields mean something, as `HullState.damageShields` already scales what gets through by the aimed system's pass-through. Run Slow Boat's balance tests before and after, and note the difference.

Tests: an aimed shot damages the system aimed at and the hull in a 60 to 40 split. An unaimed one still picks at random. Each shot of a spread carries the aim.

**As built:**

- As specified. All five weapons pass the aim on, and a hit says who fired it.
- **Slow Boat got harder.** A crew that does nothing loses *Marrow* at 77 and 104 seconds, where it was 87 and 120, because the harriers aim at its tactical system and then its helm. A crew that only extends its shields still gets it there on both seeds.
- ***Marrow*'s shields can go from a third to nothing in one hit**, and the ship is lost before its last warning is said. The simulation that expected that line now expects any shield warning.
- **Seeded runs drift wherever anything aims.** An unaimed shot uses a random number to pick its system and an aimed one doesn't, so everything random after it goes differently.
- **Extended shields use the extender's own system.** A hit aimed at a covered ship's helm is scaled by the pass-through of the covering ship's helm. So the crew's Focus Shields changes what gets through to a ship it's covering.

### I. Hits can be heard

`Ship` gains `readonly hitReceived = new ListenableEvent<{ damage: Damage; passedThrough: number }>()`, fired from `Ship.damage` where `wasHit` is called now: after the shields have taken their share, before the damage is applied. Like `deflectorReceived`, it's for encounters. Dead Weight uses it to make torpedoes spill, and Quiet Running to notice that the crew has opened fire.

**As built:** as specified. It fires once per hit, including a hit the shields take all of (`passedThrough` 0) and one that destroys the ship. By then an unaimed hit has had its system picked, so `damage.targetSystem` always says where it landed. A miss never reaches `Ship.damage`, so it isn't heard.

### J. New orders

An AI ship's goal is fixed when it spawns. Two additions to `Commander`:

- `setGoal(goal: AiGoalInfo)`: replaces the goal, starts any route from its first waypoint, forgets the wander point, and resolves scenario ids as at spawn. A ship that's withdrawing keeps withdrawing.
- `standDown()`: from its next update the ship has no target and holds where it is, so it neither shoots nor manoeuvres. `rally()` undoes it, as it does a withdrawal. This is for one ship of a faction going quiet while the rest fight on. Where a whole faction stops, change the relationship, as Standing Orders does.

Tests: a guard given `search-and-destroy` hunts. A ship told to stand down doesn't fire at a hostile in its arc, and does again after `rally()`.

### K. Ships that do nothing

Objectives need objects: a module, a station, a relay. The engine's only objects are ships, and a ship gives an object everything it needs for free: a hull to scan and shoot, a name, a faction, a shape. So an object is a ship whose officers are all switched off.

- `DesignTemplate` already allows `priorities` (it's on `AiShipSetupInfo`). A design with all four at 0 is **inert**: nothing aboard plays a card.
- `ShipSpawn` and `ShipSetupOptions` gain `priorities?: AiPriorities`, overriding the design's, for encounters that switch off one officer on one ship.
- An inert ship never moves by itself. An encounter that wants it moved sets its motion.
- An inert design's decks are one card per crew system, so each has a health of 1, and its hull is what matters.

`shipDesigns.test.ts` gains a case: an inert ship, ticked for a minute beside a hostile, plays nothing and stays put.

**As built:**

- **Officers switched off aren't enough.** A ship's reactor and hull play their own cards without any officer, so an inert ship with a working reactor still draws, tunes its shields and gets Aux Power. `inertTemplate(appearance, hullCards)` in `shipDesigns.ts` makes the whole design: `inertPriorities` (all four at 0), an empty reactor deck, so every system's power is 0 and nothing is ever drawn, and `fleeThreshold` 0.
- **Its one card per crew system starts in the deck, not the hand** (initial hand size 0), so a hand read from it is empty. The cards are Slow and Steady, Passive Scan, Phaser Strip and Distribute Power. Not Aux Power: an expendable card isn't in a system's card pool, so it doesn't count towards health, and an engineer system holding only that has a health of 0.
- `priorities` on `ShipSpawn` and `ShipSetupOptions` is merged over the design's, so switching one officer off leaves the others as the design had them.

### L. Objectives

`ObjectiveInfo` gains:

| Type | Label | Complete when |
|---|---|---|
| `{ type: 'reach'; subject: string }` | "Reach *subject*" | Decided by the encounter |
| `{ type: 'recover'; subject: string }` | "Recover *subject*" | Decided by the encounter |

`Encounter` gains `protected setObjective(objective: ObjectiveInfo)`, which replaces `state.objective` and the summary's. Only the boss uses it, once. The node keeps the objective it was made with.

**As built:** only `recover`, for Dead Weight. `reach` and `setObjective` are left for the encounters that need them. `ObjectiveState` needed nothing, as it already carries any objective's `subject`.

### M. Reading a hand, as built

Not something these specs asked for: it came out of writing them. The design plan's tells all assume a scan shows what a ship is holding, and no scan did.

A scan card played on a system that's already revealed now does one of two things, chosen by where science drops it:

- **Find a vulnerability**, as before.
- **Read the hand:** science sees the cards that system is holding, kept up to date as it draws and plays, until they scan something else. Then it has to be paid for again. No scan card has a side effect when it reads.

So a system gives up three things, at two prices. Its power and what it's doing now come with the first card. What it's about to do, or how to hurt it, each cost a second.

For encounters:

- What science sees is `scienceState.scannedHelm` (or `scannedTactical`, `scannedScience`, `scannedEngineer`), and its `hand`: null until read, then copies of the cards.
- `scienceState.readHand(target, system)` reads one from code, if science is scanning that system.
- **Change a hand through `SystemState`'s own methods** (`addCardToHand`, `drawFromTop`, `discard`, `removeCard`, `playCard`), or a hand that's being read won't show the change. Changing a trait on a card that's already held doesn't show either, until `scienceScanDataChanged` is invoked.
- The AI never reads a hand.

---

## 4. Fever Ship

| | |
|---|---|
| **Question** | Restrain, by way of a diagnosis |
| **Class / id** | `FeverShipEncounter extends Encounter` / `feverShip` |
| **Request** | Hauler *Ostler*: ship out of control. "This is *Ostler*'s crew, not *Ostler*. She took an update meant for a warship and she's locked us out. We're cutting through to the engine room. Stop her shooting, and don't sink her. We're still aboard." |
| **Objective** | `{ type: 'disable', subject: 'Ostler' }` |
| **Target length** | 3 to 4 minutes |
| **Pool** | Sector 1, not the first two layers |

### The idea

One of *Ostler*'s four crew systems is running the update. Put that system out, and she stops. Put out a different one and the update digs in. Every aimed hit also costs her some hull, so the crew can afford about two tries.

Each part of that is a different seat's:

| Part | Who has it | How |
|---|---|---|
| **Which system, probably** | Science | Scanning a system shows its power. A hauler's systems run at 2. The one with the update runs at 5, and stays there |
| **Which system, for certain** | Science | A second scan card reads the system's hand (groundwork M). The infected one is holding a warship's cards |
| **What it's doing** | A different seat each time | See "What the update does" below. It's a hint, and science's readings confirm it |
| **Putting it out** | Tactical | Aiming at that system (groundwork H), with weapons small enough not to hole her |
| **How much hull she has left** | Science and tactical | The scanned hull, which both see, and nobody else |

### Factions

```ts
factions = [hostileToPlayer('ostler')];
```

On success the encounter calls `factionRegistry.setRelationship('ostler', playerFactionId, RelationshipType.Neutral)`.

### New engine pieces

**Groundwork H.** Without it there's no encounter.

**A ship design, `hauler`.** Appearance `armed-freighter`. `fleeThreshold: 0`. Skill 0.7.

- Hull: 4 shield emitters and 12 bare, so 60 shield over a hull of 16.
- Reactor: `reactorCards(2)`, so every system at 2. At hull power 2 her shields absorb 70% of each hit.
- Helm: `slowAndSteady` × 3, `strafe`, `faceTarget`.
- Tactical: `phaserStrip` × 5, one slot.
- Science: `passiveScan` × 5.
- Engineer: `distributePower` × 3, `drawPower` × 2. No `auxPower` in the deck: it's expendable, so it wouldn't count towards the system's health.

Every crew system has five cards, so each takes five damage to put out.

### What the update does

At `populate()`, pick one of the four crew systems at random. Build the ship by hand, as Standing Orders builds its platform: take the `hauler` setup, add three of that system's reactor cards (so it starts at 5 and draws faster), and swap its deck for a warship's:

| Infected | Its deck | What the crew notices | Who notices |
|---|---|---|---|
| Helm | `zigZag` × 2, `sweep` × 2, `strafe` | A hauler flying like a fighter, and their shots missing | Helm, the viewscreen |
| Tactical | `photonTorpedo` × 2, `phaserCannon`, `fullSpread`, `highYield`, two slots | Torpedoes from a ship that had a cutting beam | The viewscreen, and whoever's hit |
| Science | `tetryonScan` × 2, `antiprotonScan`, `polaronScan`, `chronitonScan` | Status effects landing on their own systems | The engineer |
| Engineer | `overcharge` × 3, `distributePower`, `drawPower` | Other systems' power jumping to 5 for a few seconds at a time | Science |

The last is the hard case, and it's deliberate. With the update in her engineering, science sees fives come and go on healthy systems. The rule is "five, and stays five", and that takes watching. Reading a hand settles it at once: three Overcharges in an engineer's hand, torpedoes in a hauler's tactical. But a hand costs a second card on a system science may be about to rule out, and it's lost the moment they scan another.

### Ships

*Ostler* (scenario id `ostler`) starts 12 units ahead, facing the crew, with `search-and-destroy`. She's the only other ship.

### Rules

1. **The infected system put out** (its health at 0): success. *Ostler* goes neutral, whatever was being said is cut off, and her crew speaks.
2. **A healthy system put out**, the first time for each: the update digs in. Every other crew system of hers gains 1 power (`adjustPowerLevel(1)`), and she says so. Her own engineer may repair it later, which changes nothing.
3. ***Ostler* destroyed:** failure, in silence.
4. No time limit. Her fire is the clock, and her hull is the budget.

What an aimed hit costs her, at her usual hull power of 2:

| Weapon | Shields up: to the system / to the hull | Shields down |
|---|---|---|
| Phaser strip (10) | 2 / 1 | 6 / 4 |
| Phaser cannon (20) | 4 / 2 | 12 / 8 |
| Photon torpedo (40) | 8 / 4 | 24 / 16, which destroys her |

Her 60 shield lasts four or five cannon hits. So the first system costs about 4 hull, the second about the same with her shields nearly gone, and a third is taken out with her shields down, at 8 hull a hit from what's left of 16. A shot that isn't aimed lands on a system at random, and one time in six all of it lands on her hull.

### What each station has

| Station | Sees | Does |
|---|---|---|
| Science | One system's power at a time, live, after finding which of four scan slots it is. That system's hand, for a second card. *Ostler*'s hull and shields | Reads each system, calls the one that's at five and staying there, and decides whether a hand is worth a card. Says when her hull is getting short |
| Tactical | The systems science has identified, as targets. The same hull science sees | Puts one system out with the smallest weapon that will, and stops. Never fires unaimed |
| Helm | The flight picture | Holds inside 10 units for the cannon, or 6 for the strips, of a ship that's hunting them |
| Engineer | Effects arriving on their own systems. Power | Calls it when *Ostler*'s science is what's hitting them. Feeds science for the scans, then tactical |

**Captain's call:** how sure to be before shooting. There are three levels, each slower than the last: the hint, which arrives in seconds; a power reading, which takes finding the right scan slot; and the hand, which takes another card after that. A wrong shot costs a quarter of her hull and makes her hit harder.

### Hails

| When | Speaker | Line |
|---|---|---|
| Start | *Ostler*'s Crew | "It's in one system. One of the four, and it's driving that one flat out. Knock that one out and she stops. Knock out the wrong one and it digs in. Go gently. We're in here." |
| After that | Hauler *Ostler* | "FLEET DOCTRINE NINE. HOSTILE CONTACT. ENGAGING." |
| A healthy system out | Hauler *Ostler* | "SUBSYSTEM LOST. REALLOCATING." |
| After that | *Ostler*'s Crew | "Not that one! She's running hotter." |
| Her hull at half | *Ostler*'s Crew | "We felt that. She wasn't built to be shot at." |
| Success | Hauler *Ostler* | "DOCTRINE... NINE..." |
| After that | *Ostler*'s Crew | "She's stopped. We've got the engine room. Thank you, and sorry about your paintwork." |
| Failure | none | Silence |

*Ostler*'s lines are urgent, so they cut in. The hull line is said once.

### Expected talk

> **Helm:** "She's jinking. Haulers don't jink."
> **Captain:** "So it's her helm? Science?"
> **Science:** "I've found her tactical and it's at two. Helm's the next slot, I need a card."
> **Tactical:** "Tell me which one before I shoot anything."
> **Science:** "Helm's at five. Still five."
> **Captain:** "Helm it is. Strips only, and count them."
> **Tactical:** "Two hits. Third one puts it out. How's her hull?"
> **Science:** "Fourteen of sixteen."

### Elite form

The update moves, once. When the infected system is put out, it jumps to another crew system that's still working, picked at random: that system gains 3 power and the first loses 3. *Ostler* says "DOCTRINE RESTORED FROM BACKUP." and her crew, "It's moved. It's somewhere else now." Putting that one out ends it.

Only the power moves, not the deck, so the second time there's no hint, and a hand shows nothing but a hauler's cards. Power is the only reading left, with about half the hull budget to spend on it.

**Legacy (for when legacies are built):** on success, *Ostler*'s crew bring the update they pulled out of her to the sector boss. It names one of the Gate's pylons as a slave, so the first phase starts with three to choose from. No failure legacy.

### Tuning

| Constant | Value |
|---|---|
| `ostlerDistance` | 12 |
| Hull / shield / hull power | 16 / 60 / 2 |
| Cards per crew system | 5 |
| `healthyPower` / `infectedPower` | 2 / 5 |
| `digInPower` | 1 |
| Skill | 0.7 |

### Tests

- The infected system starts at power 5 with a warship's deck, and the other three at 2, for each of the four.
- A hand read from the infected system holds only cards from its warship deck, and one read from a healthy system holds none of them.
- Putting the infected system out: success, *Ostler* neutral, reward given.
- Putting a healthy one out: no outcome, the other crew systems gain 1 power, and only the first time for that system.
- Destroying *Ostler*: failure, nothing said, Warp Away still offered.
- Elite: the infection moves once, to a system that's still working, and putting that out is a success. It doesn't move a second time.
- With the real AI: an *Ostler* with infected tactical fires torpedoes, and one with healthy tactical never does.

### Changed from the plan

- **A hand is the second reading, not the first.** The plan had the infected system holding cards the others don't, and when this was first written no scan showed a hand at all, so the tell became power. A hand can now be read for a second card (groundwork M). Power stays as the quick reading, and the cards also show up as behaviour.
- **"Erratic" is more power**, as there's nothing else in the engine that makes a ship worse to fight at a stroke.

### Check first

- That a system at 0 health can't play anything. Every card is damaged, and `playCard` refuses damaged cards, but I haven't watched an AI officer with a dead hand.
- That the encounter sees the infected system at 0 before *Ostler*'s engineer repairs it. The repair is an officer's decision and takes at least a tick. If it can happen first, listen to that system's engineer tile (`scienceScanDataChanged`) instead of polling.
- That an AI science officer playing `antiprotonScan` and the others puts their effects on the player ship. `scanEvaluator` exists for each. I haven't traced what it plays them as.
- That a healthy system's power stays near 2. *Ostler*'s engineer gets an `auxPower` card whenever the reactor offers one, and plays it. A reading of 3 is expected. A healthy 5 would break the tell, so if it happens, switch her engineer off (`priorities: { engineer: 0 }`) when engineering isn't the infected system.
- How long it takes science to find and read one system, in cards and seconds. If it's under five seconds the captain's call disappears, and if it's over twenty the crew will always guess.

### As built

Both forms are built, on `fever-ship`. The design held, but the clock and three of the four tells needed changing to work with the real AI. Only the helm's is as planned.

- **The update raises its system's power by 3 directly, rather than with three reactor cards**, so it draws no faster than the rest. With the cards, an infected tactical drew four times as often, and destroyed a crew that did nothing at 90 and 110 seconds. In the elite form only the power moves anyway.
- ***Ostler*'s reactor runs at 3, not 2** (`reactorCards(2, 'reactorPowerReactor')`). At 2 a healthy tactical drew a card every 15 seconds, needed four to load and charge a strip, and took 10 of the crew's 120 shield a minute: no clock at all. At 3 it takes about 22 a minute. Her crew systems still run at 2. The reactor isn't a crew system, though a scan of her engineer system shows it.
- **Her hull lists its 12 bare cards before its 4 emitters.** A hull takes damage in the order its design lists the cards, and a damaged emitter takes its 15 off the shields' capacity, so with emitters first her first few hull hits would have taken her shields with them.
- **Her engineer can't repair anything** (`repairCapacity` and `maxRepairCapacity` set to 0). An AI engineer repairs without a card, on every think (one a second), whenever a system is a fifth damaged. It would undo each strip hit before the next landed, so no system could be put out with small weapons, and her hull would count double. With nothing repairing her, the encounter can check each system's health in `tick`, as nothing can bring it back within a tick.
- **A healthy system that's put out comes back 20 seconds later** (`rerouteMs`): the update reroutes around it. With nothing repairing her, a healthy tactical put out would disarm her for good, and "shoot tactical first" would cost a few hull and end the clock. Coming back repairs its cards, which leaves them stabilised, so a system put out twice stays out.
- **The infected tactical is torpedo, cannon, torpedo, cannon, torpedo, in one slot**, with no Full Spread or High Yield. The spec's deck in two slots destroyed an idle crew at 74 and 110 seconds. This one does it at 85. The AI also tried to put the torpedo modifiers on the cannon, as `weaponModifierEvaluator` ignores `requiredWeaponTrait`.
- **The infected science is Antiproton Scan × 3 and Chroniton Scan × 2.** The AI only ever scans to reveal a system, and only those two leave a mark when they reveal (Antiproton Residue, Chroniton Saturation). It stops once it has found all four of the crew's systems, so the marks land in the first minute and are gone by the second.
- **The AI couldn't play any scan card but Passive Scan.** `scanEvaluator` named every card it scored as `passiveScan`, and `playCard` refuses a type that doesn't match. It now names the card itself. No other design carries any other scan card, so nothing else plays differently.
- **The infected engineer gives no hint.** An AI engineer only plays power cards on a system that has asked for power, and none of a hauler's cards cost more than 2, so nothing asks. If one did (say a crew shot to her reactor lowered its power), Overcharge would answer it, and Overcharge burns a card of its target every second for 15 seconds: the update would put out its own system, and that counts as a healthy one put out. So engineering is the case with only the two readings, power and hand. Its hand is still three Overcharges.
- **Digging in doesn't make her hit harder.** Her healthy cards all cost 2 or less, so more power changes nothing they do. What it changes is the reading: healthy systems read 3 after one wrong guess and 4 after two, and an Aux Power from her reactor can then make one read 5.
- **A scan of her engineer system shows every system's power at once**, which ENGINE-NUMBERS says and this spec didn't. So the quick reading is "find the infected slot or the engineer slot", one card in two on average.
- **A put-out system still fires a weapon that was already loaded and charged** (`playWeapon` doesn't check). It can't play, load or charge anything from its hand. When this was built a manoeuvre under way also ran to its end. A ship whose helm is put out now slows to a stop (see Dead Weight's "As built").
- **Elite: the system the update leaves stays out**, so nothing it does afterwards points back at it. Its power drops by 3 from wherever digging in had taken it, so after two wrong guesses it reads 4, not 2.
- ***Ostler*'s opening line isn't urgent**, so the briefing is read in full first. Every other line of hers is urgent, and so is her crew's reply to each.
- She's called "Hauler Ostler", which is also how she's heard. The objective's subject is "Ostler".

### Measured

From `FeverShipEncounter.balance.test.ts` (`npm run test:balance`), one seed for most cases, with the crew's shots landed directly on the system aimed at, every one a hit. So these are rough, and they say nothing about aiming or about her evasion.

- **A crew that does nothing**, with her tactical healthy: 120 shield down to 32 after four minutes, hull untouched, the same with the update in helm, science or engineering. With it in her tactical: destroyed at 85 seconds, on two seeds.
- **A crew that knows the answer** and lands a strip on it every 10 seconds: success at 30 seconds (three hits), with *Ostler* at 13 of 16 hull and 42 of 60 shield. The same in all four cases.
- **One wrong guess first:** success at 60 seconds, with 10 hull left. The wrong system's loss raised the other two healthy ones to 3.
- **Torpedoes only:** two wrong systems put out with one torpedo each, and the third torpedo, on the right system, destroys her.
- **Elite, a crew that follows the update:** success at 60 seconds, with 10 hull left.
- **Science gets a card every six seconds**, after the one it starts with. So the power reading takes 0 to 17 seconds, and a hand reading another 6. That's inside the five-to-twenty window.
- **Her healthy systems read 2 throughout**, in all eight idle runs of four minutes. Nothing ever asked for power, so her engineer never played anything.

So once the crew knows, strips win with room to spare. The question is how long knowing takes against a clock of about four minutes, or 85 seconds under torpedoes, and a wrong guess costs about 3 hull of 16 with her shields up.

### Still to check, by playing it

- Whether a crew finds the engineer-scan shortcut, and whether, having found it, they ever pay for a hand.
- Whether anyone notices the science marks in the first minute, or the helm jinking, or connects either to her.
- Whether the engineer case, with no hint, feels like the hard case or just an unfair one.
- Whether 20 seconds back is right for a healthy system put out, and whether crews start knocking out her tactical on purpose to buy quiet.
- Whether a crew under torpedoes reacts in time. Idle, it's dead at 85 seconds, and losing the crew ends the run.
- Whether the hull budget is too generous: with strips her shields last about ten hits, so two or three wrong guesses fit before they go, against the plan's "about two".
- Each clue on its screen. It hasn't been run in the game yet: the dev build only serves the game once Start is pressed in the Electron main menu.

---

## 5. Dead Weight

| | |
|---|---|
| **Question** | Restrain |
| **Class / id** | `DeadWeightEncounter extends Encounter` / `deadWeight` |
| **Request** | Halden Ring: repossession. "A Receivership tug has our water plant on a line, and it's leaving. That module is nine hundred people's water. Stop the tug. Don't stop the module." |
| **Objective** | `{ type: 'recover', subject: 'the water module' }` |
| **Target length** | 3 minutes |
| **Pool** | Sector 1, not the first two layers |

### The idea

The tug lets go if its engines are put out, or if both its escorts are driven off. It can't be destroyed while the line is attached, because the module goes with it. Torpedoes that hit the tug hit the module too. And the whole time, the tug is leaving.

### Factions

```ts
factions = [
    hostileToPlayer('receivership'),
    { id: 'ring', relations: { [playerFactionId]: RelationshipType.Friendly } },
];
```

The module is the ring's. Nothing declares how the ring and the Receivership relate, so they're neutral, and the escorts never shoot at what they're being paid to take.

### New engine pieces

**Groundwork H, I, K and L** (`recover`).

**A ship design, `tug`.** Appearance `tug-and-tow`. `fleeThreshold: 0`. `priorities: { engineer: 0 }`, so nobody aboard repairs its engines. Skill 0.7.

- Hull: 2 shield emitters and 18 bare, so 30 shield over a hull of 20. Hull power 2.
- Helm: `slowAndSteady` × 12. Twelve cards is what makes the engines a three-hit job.
- Tactical: `phaserStrip` × 2, one slot.

**A ship design, `waterModule`.** Inert (groundwork K). Appearance `mining-barge`. A hull of 40 bare cards and no shields.

**A tow line**, `encounters/deadWeight/TowLink.ts`, as it's the only encounter with one. It keeps one object a fixed distance astern of another: whenever the tug's motion changes, it rebuilds the module's from it, each keyframe moved `towLength` back along that keyframe's own heading. `release()` leaves the module where it is.

### Ships and timeline

| Scenario id | Design | Position | Goal | Notes |
|---|---|---|---|---|
| `tug` | `tug` | 10 units ahead, facing away | `travel-route`, one waypoint `towDistance` (150) further on | "Receivership Tug *Lien*" |
| | `waterModule` | `towLength` (2.5) astern of the tug | none | "Water Module" |
| | `harrier` | 3 units to the tug's port | `guard-ship: tug` | "Bailiff One". Skill 0.7 |
| | `harrier` | 3 units to the tug's starboard | `guard-ship: tug` | "Bailiff Two" |

At *Marrow*'s speed the tow takes about 170 seconds. Halden Ring says when the tug is a third and two thirds of the way, as nothing shows it.

### Rules

1. **Engines out** (the tug's helm at 0 health): the encounter stops the tug where it is, and 3 seconds later it cuts the line. Success. The bailiffs withdraw. The tug jumps away 5 seconds after that.
2. **Both bailiffs gone**, destroyed or fled: the tug cuts the line and withdraws. Success.
3. **A torpedo that hits the tug** while the line is attached also hits the module, for half the torpedo's damage, straight to its hull. Heard through `hitReceived`: any hit whose traits include `torpedoWeapon`. One torpedo takes half the module. Two destroy it.
4. **The tug destroyed** with the line attached: the module is destroyed with it. Failure.
5. **The module destroyed:** failure. The tug and bailiffs withdraw.
6. **The tug reaches the end of its route** with the line attached: it jumps away, and the module with it. Failure. The bailiffs withdraw.

What an aimed hit on the engines costs the tug, at hull power 2:

| Weapon | Shields up: engines / hull | Shields down | To the module |
|---|---|---|---|
| Phaser strip (10) | 2 / 1 | 6 / 4 | nothing |
| Phaser cannon (20) | 4 / 2 | 12 / 8 | nothing |
| Photon torpedo (40) | 8 / 4 | 24 / 16 | 20 of its 40 |

Its 30 shield is gone by the third cannon hit, which is also the one that finishes the engines: 4, 4, then 10. That leaves it 10 hull of 20, which is one stray shot. A torpedo and one cannon hit does the same job a cannon cycle sooner, for half the module.

### What each station has

| Station | Sees | Does |
|---|---|---|
| Science | The tug's systems, once found. The hull of whichever it scanned last: the tug's or the module's, not both | Finds the tug's helm among four scan slots, so tactical can aim at it. Then chooses whose hull to watch |
| Tactical | "Helm" on the tug as a target, once science has it. Its weapons. The hull science is watching | Three aimed cannon hits and then stops. Keeps torpedoes for the bailiffs |
| Helm | The flight picture | Stays inside 10 units of a ship that's flying away, with two harriers trying to make it turn |
| Engineer | Power, and hits arriving | Keeps helm fast enough to hold range and tactical able to load, which at baseline is one or the other |

**Captain's call:** engines or bailiffs. Engines means flying into both bailiffs to hold range. Bailiffs first is safer, and the tug gets further away the whole time. And whether to spend one torpedo on the tug.

### Hails

| When | Speaker | Line |
|---|---|---|
| Start | Halden Ring | "That's our water on that line. Its engines are the weak point: put those out and it has to let go. Don't sink it while it's holding on. And no torpedoes on the tug. What hits it hits the module." |
| After that | Receivership Tug *Lien* | "This asset is under lawful recovery. Interference will be invoiced." |
| A third / two thirds of the way | Halden Ring | "They're a third of the way to the marker." / "Two thirds. Past the marker we can't follow." |
| First torpedo to hit the tug | Halden Ring | "That hit the module! No more torpedoes!" |
| First bailiff flees | Bailiff One (or Two) | "This wasn't in the contract. Out." |
| Both bailiffs gone | Receivership Tug *Lien* | "Escort's gone. Not worth the invoice. Cutting the line." |
| Engines out | Receivership Tug *Lien* | "Drive's dead. Fine. Keep it. Cutting the line." |
| Success | Halden Ring | "Line's parted. Our own tugs are on the way. Nine hundred people say thank you." |
| Failure, towed away | Receivership Tug *Lien* | "Asset recovered. Good day." |
| Failure, module lost | Halden Ring | "...That was the water." |

The torpedo line is urgent.

### Expected talk

> **Science:** "Got its helm. Third slot. It's on your list."
> **Tactical:** "I see it. Cannon's loaded but I'm at eleven units."
> **Helm:** "I'm closing as fast as I can. Bailiff Two's on our tail."
> **Captain:** "Leave Two. How long to the marker?"
> **Science:** "They said a third. Call it two minutes."
> **Tactical:** "I've got a torpedo ready. One hit and I only need the cannon once."
> **Captain:** "What does that do to the module?"
> **Science:** "Half of it. I'd have to scan the module to tell you more, and then tactical loses the tug's hull."

### Elite form

The module's coolant is failing. It loses one hull card every `coolantIntervalMs` (8 seconds), which over the whole tow is about half of it, so a single torpedo is now fatal and a slow rescue is close to it.

The engineer is kept supplied with **Transfer Power**, a new card: no target, cost 4. "For 20 seconds, the nearest friendly ship within 6 units is powered from yours." It puts a `powerReceived` effect on that ship's hull tile, and while the module has it, its coolant holds. The cost is the point: 4 is one more than the engineer normally has, so covering the module means the engineer boosting itself first. Its range is the same idea as Extend Shields: the module is 2.5 units behind the tug, which is where the cannon wants the ship anyway.

Halden Ring's opening line gains: "Her coolant's going too. If you can spare her power, she'll hold."

**Legacy (for when legacies are built):** on success, Halden Ring's water tenders are at the sector boss, and the crew's repair capacity is refilled once mid-fight. No failure legacy.

### Tuning

| Constant | Value |
|---|---|
| `tugDistance` / `towLength` / `towDistance` | 10 / 2.5 / 150 |
| Tug hull / shield / helm cards | 20 / 30 / 12 |
| Module hull | 40 |
| `torpedoSpill` | 0.5 |
| `lineCutDelayMs` / `tugJumpDelayMs` | 3 000 / 5 000 |
| `coolantIntervalMs` (elite) | 8 000 |
| Transfer Power cost / duration / range (elite) | 4 / 20 000 ms / 6 units |
| Skill | 0.7 |

### Tests

- The module stays `towLength` astern of the tug as it flies, and stops when the line is cut.
- Engines out: the tug stops, cuts the line, success, the bailiffs withdraw, the tug leaves.
- Both bailiffs gone: the same, with the tug withdrawing under its own power.
- A torpedo hit on the tug damages the module by half as much. A cannon hit doesn't. A torpedo hit on a bailiff doesn't.
- The tug destroyed with the line attached: the module goes too, failure.
- The tug destroyed after it has cut the line: still a success.
- The tug at the end of its route: failure, both gone, Warp Away offered.
- Elite: the module loses a card each interval, and none while it's receiving power.
- With the real AI: the tug flies its route with the bailiffs alongside, and the bailiffs go for the crew, never the module.

### Changed from the plan

- **Area weapons don't exist.** The `area` trait is a stub. Spill is the encounter's own rule, for torpedoes only, on the tug only.
- **Helm's job is range, not the stern arc.** A system target has no facing in the engine (its `aspect` is null), so there's no stern shot to hold. The precise weapons are the short ones, and the tug is leaving.
- **Focus Shields aft is gone**, as shields have no sides.

### Check first

- **That putting the helm out stops the ship.** A manoeuvre already under way runs to its end, and one `slowAndSteady` may reach all the way to the waypoint. Rule 1 has the encounter stop the tug by setting its motion for that reason. Check the bailiffs don't have the same problem when they're meant to turn.
- How motion keyframes interpolate between headings, which decides whether shifting each keyframe astern keeps the module behind the tug through a turn. The route is straight, so it only matters if the tug dodges.
- That tactical's target list leaves out friendly ships, so the module can't be shot at directly. If it doesn't, that's a second way to lose it, which may be no bad thing.
- That a tactical deck of two cards and an inert ship's one-card decks work at all.
- The tug's real speed, and the crew's on its usual helm cards. If the crew is much faster the chase is nothing. If it's slower, the engines route can't be done at all.
- Whether three aimed cannon hits in about 150 seconds is achievable with the starting tactical deck, which has one cannon.

### As built

Both forms are built, on `dead-weight`. The question held: the tug gets away on its own clock, the engines are a three-hit cannon job, and a torpedo on the tug costs half the module. What changed was the pace of the tow, and how the bailiffs fight.

- **The tow is 130 units, not 150, and its pace isn't steady.** The AI flies the whole route on one Slow and Steady, which has no maximum distance, and motion between two keyframes eases in and out. So the tug covers its first 5 units in about 20 seconds, does 1.1 a second halfway, and averages 0.76. At 150 the tow took 197 seconds. At 130 it takes 161, with Halden Ring's third at about 70 seconds and two thirds at about 110.
- **The crew's speeds:** Slow and Steady averages 0.75, and Zig-zag and Sweep go forward at 1 unit a second, as their sideways steps cost no time. As the tug starts slowly, a crew that goes straight after it is in cannon range for the first minute, even at 0.75.
- **Putting a helm out now stops the ship, for every ship.** As first built, a manoeuvre under way ran to its end: one Slow and Steady goes all the way to the marker, so the encounter had to stop the tug itself. That was the engine's accident, not a rule anyone chose, so it was changed on `helm-out-stops-ship`: a ship with every helm card damaged slows to a stop, as it does when a manoeuvre is cancelled or it loses the power for one. The crew's own ship does the same. The encounter's own stopping is gone.
- **The tow line is exact on a straight course** (Check first). Each keyframe is moved back along its own heading, so through a quarter turn over 14 units the line goes from 1.8 to 2.7. The tug only turns once it has let go.
- **Tactical can shoot the module** (Check first). Its target list is every object but its own ship, friendly ones included, and firing doesn't check whose a target is. Left in, as a second way to lose it. Science can scan the module too, which is the only way to see its hull.
- **Three aimed cannon hits are one load** (Check first). The cannon is the fourth card of the starting tactical deck, which draws about every 6 seconds, so it's loaded at about 18 seconds and charged at about 30. A full charge is four shots. They land as the spec's table says: engines 12, 8, 4, 0, and the tug's hull 20, 18, 16, 10.
- **A tactical deck of two strips, and an inert ship's one-card decks, work** (Check first). The strips load. Nobody has watched the tug fire them.
- **The bailiffs come out to fight.** A guard goes for any hostile within 30 of what it guards, and flies at it, not beside its ward, so they leave the tug for a crew that's close. That's the spec's "trying to make it turn".
- **The bailiffs can only be driven off with torpedoes.** With a torpedo loaded they hold 12 to 20 units from a crew that chases them, outside cannon range, and their engineers repair what does land. One torpedo takes a bailiff's shields and all but one hull card, and it flees. The crew's deck has one torpedo, back round in about a minute. So "bailiffs first" is two torpedoes, and is the slow way, not the safe one.
- **A bailiff that flees is gone for good:** the encounter has it withdraw, and the first one says its line. "Both gone" is each one destroyed, departed or withdrawing. Otherwise a fleeing bailiff would come back once its engineer had repaired it, and leaving takes about 20 seconds.
- **With both bailiffs gone the tug cuts the line at once**, and withdraws.
- **The tug jumps away 5 seconds after the line is cut, from `tick`**, as the outcome comes with the cut and `complete()` cancels every timer.
- **The tug destroyed while towing destroys the module**, so it's the module's failure, with its line, "...That was the water.". The spec had no line for it.
- **Spill is a hit on the module's hull** through `Ship.damage`, half the torpedo's amount, rounded, so shields extended over the module would take it.
- **The tug is called "Tug Lien"**, as a ship and as a speaker: "Receivership Tug Lien" is long on the target lists. The module is "Water Module", in the ring's faction, spawned in its own batch. The bailiffs are "Bailiff One" and "Bailiff Two".
- **The tug's design:** 18 bare hull cards then 2 emitters, reactor `reactorCards(2)`, 12 Slow and Steady, 2 strips in one slot, science and engineer as a fighter's, `priorities: { engineer: 0 }`. Its skill, 0.7, comes from the encounter. The water module is `inertTemplate('mining-barge', 40 bare)`.
- **Transfer Power** is an engineer card with no target, cost 4, 20 seconds, 6 units. It puts Power Received on the nearest friendly ship's hull tile (`Ship.nearestFriendlyShip`), and won't play with none in range. It's in the engineer's shop pool, as Extend Shields is, where it does nothing.
- **Elite: the coolant fails whether or not the line is attached**, until the outcome. The briefing is five sentences, about 17 seconds to read.
- **Adding Dead Weight to the pool shifts every seeded test** that starts a campaign, as the sector is generated from the same random numbers. Standing Orders' played-out test now uses seed 2: with seed 3 its platform is armed with a strip, whose arc is so wide that it never has to turn.

### Measured

From `deadWeight/DeadWeightEncounter.balance.test.ts` (`npm run test:balance`), seeds 3 and 7. The crew is a script: helm steers straight for a point behind its target every half second, and every shot lands. So these say what each plan costs, not whether a crew can carry it out.

- **A crew that does nothing:** towed away at 161 seconds on both seeds, with its shields untouched: once the tug is 30 away, the bailiffs go back to it.
- **Engines, at 1 unit a second, 7 behind the tug, a cannon hit every 8 seconds from 35:** success at 54 seconds, the tug at 10 of 20 hull, the module untouched, the crew at 90 to 120 shield.
- **The same at 0.75:** success at 54 seconds, but the crew down to 30 to 75 shield, as it's slower to leave the bailiffs behind.
- **Sitting at strip range (4) for the whole tow, shooting nothing:** half the crew's shields or more, and on one seed the ship.
- **One torpedo on a bailiff, then the cannon on the other:** a gamble, since a helm that's put out now stops its ship. On seeds 3, 11 and 13 it's a failure: the second never comes within 10, and the tug is away at 161 seconds. On seeds 7 and 17 a cannon hit lands on the second bailiff's helm, it stops where the next shots reach, gives up, and the tug lets go at 56 seconds, as quick as the engines route. A bailiff that has given up with its engines out counts as gone, though it sits there. Before the change this plan failed on every seed.
- **A torpedo on each bailiff, a minute apart, chasing them:** success at about 100 seconds, the tug untouched.
- **A torpedo on the tug at 25 seconds, then the cannon:** success inside 50 seconds, with the module at 20 of 40.
- **Elite, nothing done:** towed away with the module at 20 of 40. **One torpedo on the tug and nothing else:** the module is lost to its coolant at 160 seconds, just short of the marker. **One torpedo, then the cannon:** success at 38 seconds, the module at 16.

So engines is the faster plan, at about a third of the clock, and the bailiffs are what staying close costs.

### Still to check, by playing it

- Whether a helm holds cannon range on a tug that's speeding up, and whether its slow start reads as a chance to close.
- Whether bailiffs that come out to fight feel like escorts, and whether a crew ever goes after them, with only torpedoes that reach.
- Whether anyone shoots the module by mistake, now that it's on tactical's list.
- The viewscreen draws the module's and tug's labels over each other at 2.5 units, and the `tug-and-tow` shape may already show a tow, so the module looks doubled.
- Elite: whether the engineer finds Transfer Power's 6 units and its cost of 4 (Aux Power first), and whether anyone watches the module's hull, which costs science the tug's.
- Whether the elite briefing, at about 17 seconds, gets read.
- The tug firing its strips.
- It has been run in the game, both forms, built with dev tools, with four crew pages joined and nobody playing: the briefing, the objective "Recover the water module", the module towed astern, the bailiffs leaving the tug for an idle crew, the module on tactical's and science's target lists, and Transfer Power in the elite engineer's hand all reach their screens.

---

## 6. Last Shuttle Out

| | |
|---|---|
| **Question** | Endure, graded |
| **Class / id** | `LastShuttleOutEncounter extends Encounter` / `lastShuttleOut` |
| **Request** | Corrie Deep Station: evacuation cover. "Reactor's going, and the old defence grid is coming apart around us. Six shuttles, one every forty seconds. We can launch them. We can't cover them." |
| **Objective** | `{ type: 'protect', subject: 'the shuttles' }` |
| **Target length** | 4 minutes |
| **Pool** | Sector 1, not the first two layers |

### The idea

Six shuttles launch on a schedule the crew doesn't control, each down one of three lanes. With each comes a handful of the station's old defence grid, drifting across the lanes. Most of it is dead. Some of it still has a gun, and only science can tell which before it fires.

What the crew is enduring is its own shields. They don't recharge, covering a shuttle spends them, and there are six shuttles.

### Factions

```ts
factions = [
    { id: 'corrie', relations: { [playerFactionId]: RelationshipType.Friendly } },
    { id: 'shuttles', relations: { [playerFactionId]: RelationshipType.Friendly, grid: RelationshipType.Hostile } },
    hostileToPlayer('grid'),
];
```

The station is in a faction of its own so that nothing shoots at it.

### New engine pieces

**Groundwork K.** Three ship designs:

- **`miningStation`:** inert. Appearance `drydock-tender`. Hull of 30 bare.
- **`shuttle`:** appearance `ring-courier`. One shield emitter and 3 bare, so 15 shield over a hull of 4. Reactor `reactorCards(2)` plus two more hull cards, so hull power 4. Helm `slowAndSteady` × 4. `priorities: { tactical: 0, science: 0 }`. `fleeThreshold: 0`. Skill 1, so it flies straight.
- **`gridFragment`:** appearance `sentry-drone`. One emitter and 2 bare, so 15 shield over a hull of 3. Helm `zigZag`, `strafe`, `slowAndSteady` × 2. Tactical `phaserCannon` × 3, one slot. `fleeThreshold: 0`. Skill 0.6.

A fragment is spawned **live** or **dead**. A live one hunts: `search-and-destroy`, preferring the shuttle it arrived with. A dead one drifts: `travel-route` straight across the lane and out the other side, with `priorities: { tactical: 0 }`, so it never loads its gun. They're the same design, with the same shape and the same kind of name.

That's the clue. Scanning a fragment's tactical system shows its weapon slot: a live one has a cannon in it, charging. A dead one's is empty.

`extendShields` is kept in the engineer's hand, as in Slow Boat.

### What a hit does

A fragment's cannon does 20 and reaches 10 units.

- **A shuttle alone** survives one hit and dies to the second.
- **A shuttle under the crew's extended shields**, at their usual hull power of 3, takes nothing to its hull, and loses 3 of its own 15 shield. Each hit costs the crew 13 of their 120. That's nine covered hits across the whole evacuation, and ten with the hull at full power, which also spares the shuttle's own shields.
- **A fragment** dies to one torpedo or two cannon hits.

### Timeline

The station is 8 units to port of where the crew starts. The three lanes run 35 units from it, fanned 40 degrees apart: port, centre and starboard. A shuttle takes about 40 seconds to fly one, so the next launches as it arrives. The crew can't walk each one home.

| Time | Event |
|---|---|
| 0 s | The station's briefing |
| 5 s before each launch | The station calls the shuttle and its lane. Never the same lane twice running |
| 10, 50, 90, 130, 170, 210 s | Shuttle One to Six launches. Its fragments spawn 30 units from the middle of its lane, spread around it: `fragmentWaves[n]` of them, of which `liveInWave[n]` are live |
| 135 s | The station's question (see below) |
| A shuttle reaches the end of its lane | It jumps away, and counts as saved |
| A dead fragment reaches the end of its drift | It leaves |

A live fragment whose shuttle has gone hunts whatever's nearest, so what the crew ignores is still there for the next launch.

### Rules

1. **It's over when all six shuttles are accounted for**: saved, or destroyed.
2. **Graded.** `complete('success', saved / 6)`. With none saved, `complete('failure')`.
3. **The station counts aloud**, each shuttle as it goes or is lost. Nothing else keeps score.
4. Whatever's still live stays live until the crew warps away.

### The question

After the fourth launch the station asks:

> **Corrie Deep Station:** "Reactor's ahead of us. I can send Five and Six together, right now, and we're all gone a minute sooner. Or I hold the schedule. Your call."

**Send both** or **Hold the schedule**, 15 seconds, and silence holds the schedule.

- **Send both:** Five and Six launch together 5 seconds later, down two different lanes, each with its own fragments. One ship can't cover both.
- **Hold:** the schedule runs. That's 80 more seconds of spending shields.

### What each station has

| Station | Sees | Does |
|---|---|---|
| Science | One fragment's tactical system at a time: a gun charging, or nothing | Calls the live ones by name. There are more fragments than it has time for, so it chooses which to check |
| Tactical | Its weapons. The scanned fragment's hull | Kills what science calls. Leaves the rest: a shot at a dead one is a shot wasted |
| Helm | The flight picture | Gets to the right lane, inside 4 units of the shuttle, and decides how far down the lane to go before turning back for the next |
| Engineer | Power, their own shields, Extend Shields | Decides when a shuttle gets the shields, and whether the hull gets the power that would make them last |

**Captain's call:** the station's question. And every launch, which fragment to leave.

### Hails

| When | Speaker | Line |
|---|---|---|
| Start | Corrie Deep Station | "Six shuttles, forty seconds apart. I'll call each lane before it goes. Most of what's drifting out there is dead. Some of it still has a gun, and from here they look the same. Your sensors can tell." |
| 5 s before a launch | Corrie Deep Station | "Shuttle Two, port lane, in five." |
| A shuttle saved | Corrie Deep Station | "Two's away." |
| A shuttle lost | Corrie Deep Station | "We've lost Three." |
| All six saved | Corrie Deep Station | "All six. Every one of them. Now go, before she blows." |
| One to five saved | Corrie Deep Station | "Four away. That's four more than we'd have managed. Go." |
| None saved | none | Silence |

The launch call is a tell: urgent, and dropped if it can't be said within 3 seconds. "Away" is chatter, and waits for a gap. "Lost" queues.

### Expected talk

> **Station (viewscreen):** "Shuttle Three, starboard lane, in five."
> **Helm:** "Starboard. I'm twenty units off. I'll meet it halfway down."
> **Science:** "Fragment Seven's dead. Checking Eight."
> **Tactical:** "Nine's closing on the lane. Is it live?"
> **Science:** "I haven't done Nine. Eight's live. Eight's the one."
> **Engineer:** "We're at a third. I can cover this one or the next, not both."
> **Captain:** "Then kill Eight before it gets there and save the shields."

### Elite form

The station can't keep its schedule, and asks a different question, after the third launch:

> **Corrie Deep Station:** "She won't last the schedule. I can skip the checks and launch every twenty-five seconds. They'd go out with their shields cold."

**Launch them cold** or **Keep the checks**, 15 seconds, and silence keeps them.

- **Keep the checks:** the reactor fails at 200 seconds, ten seconds before Six was due. Six never launches. The best this can score is five.
- **Launch them cold:** Four, Five and Six launch at 115, 140 and 165 seconds with no shields, so one hit destroys one that isn't covered. Their fragments overlap.

The later question isn't asked.

**Legacy (for when legacies are built):** with four or more saved, Corrie's engineers crew a repair tender at the sector boss. With fewer, nothing.

### Tuning

| Constant | Value |
|---|---|
| `launchIntervalMs` / `firstLaunchMs` | 40 000 / 10 000 |
| `laneLength` / `laneSpread` | 35 / 40 degrees |
| `fragmentWaves` | 3, 3, 4, 4, 4, 5 |
| `liveInWave` | 1, 1, 2, 2, 2, 3 |
| `fragmentSpawnDistance` | 30 |
| `launchWarningMs` | 5 000 |
| `questionTimeoutMs` | 15 000 |
| `coldLaunchIntervalMs` / `reactorFailsAtMs` (elite) | 25 000 / 200 000 |

`launchWarningMs` is a tell, for the tell multiplier.

### Tests

- Six shuttles launch on schedule, each called 5 seconds ahead, no lane twice running.
- Each wave has the stated number of fragments and of live ones.
- A live fragment's scanned tactical slot holds a weapon. A dead one's never does, however long it drifts.
- A shuttle at the end of its lane leaves and is counted. A dead fragment at the end of its drift leaves.
- The score is the share saved. None saved is a failure with no reward. Three saved pays half.
- Each answer to the question, and silence, does what it says.
- Elite: each answer, and that Six is never launched if the checks are kept.
- Balance: a crew that does nothing saves fewer than three. A crew that only covers, and never fires, runs out of shields before Six.

### Changed from the plan

- **Fragments are ships, not debris.** There's no collision in the engine and no point defence. A fragment of a defence grid with a gun that still works is the same decision, "which one is real", and science's scan already answers it.
- **The lane shifts by being one of three**, called aloud, not by drifting.

### Check first

- That a hunter whose preferred ship has gone falls back to the nearest hostile. `updateTarget` reads that way.
- That Extend Shields covers a shuttle: it needs the two factions to be friendly, which they're declared as.
- A shuttle's real time down a lane, and whether a fragment 30 units out gives science time for two or three scans before it's in range.
- Whether nine covered hits is too few or too many across six shuttles. It's the whole difficulty.
- That a `shuttle` with tactical switched off, and a hull of 4, isn't destroyed by a single unaimed hit that lands on its hull: 2 of a cannon's 20 gets past its shields, so no.
- Whether spawning up to 24 ships over four minutes troubles anything.

### As built

Both forms are built, on `last-shuttle-out`. The schedule, the lanes, the waves and the grading are as specified. What changed is who the grid shoots, and when.

- **The grid never fires on the crew.** As specified, hostile to the crew, a live fragment whose shuttle had gone hunted the nearest hostile, which was usually the crew, and each one takes four shots a load. A crew that did nothing was destroyed at 105 to 110 seconds on seeds 3, 7 and 11, and one that covered and killed was destroyed on two seeds of three, at 100 and 170 seconds. Losing the ship ends the run, and the shields went on the crew's own defence, not on covering anyone. So the grid is a faction of its own, `{ id: 'grid' }`, and the shuttles declare it hostile: its targeting only knows what's launching from the station. The crew can still fire on it, as firing doesn't check whose a target is. Nothing in the game is hostile to the crew, so the crew's shields go only on Extend Shields, which is the spec's economy.
- **A live fragment first fires 40 to 50 seconds after it arrives**, and a shuttle takes 41 seconds to fly its lane. So it almost never reaches its own shuttle: it fires on the next one. Its gun isn't what's slow: arriving with its cannon loaded and five of its eight charge made no difference. It's the approach from 30 units, at a helm card every 13 seconds, onto a shuttle that's leaving. So Shuttle One is almost always saved for nothing, and each wave's live fragments are the threat to the shuttles after it, "still there for the next launch" as the spec says. Science has a whole lane, about seven of its cards, to find a wave's live ones before they fire.
- **A live fragment's slot holds a cannon from its first second** (it starts with one in hand, and loads it at once), and has one about 98% of the time after that. A dead one's never does. The tell works.
- **Helm can guess, science is sure.** A live fragment jinks and turns after its shuttle; a dead one drifts in straight legs. With one waypoint, every dead fragment in a wave flew the same single Zig-zag in lockstep, which gave them away at a glance. So a dead fragment's drift is five legs, each up to 4 units off a straight line at random (`driftWander`), through its crossing point and out to twice as far. Its course still settles into straight legs after about 15 seconds, while a live one's keeps turning 70 to 110 degrees.
- **The first launch is at 20 seconds, not 10**, so every time in the timeline is 10 seconds later: launches at 20, 60, 100, 140, 180 and 220, the question at 145, and in the elite form the question at 105, cold launches at 125, 150 and 175, and the reactor failing at 210. The briefing takes 13 seconds to read, and the first launch call is urgent, so at 5 seconds it would have cut it short.
- **The designs.** `shuttle`: `ring-courier`, 3 bare hull cards then one emitter (the emitter first would lose its 15 shield with the first hull damage), reactor `reactorCards(2)` plus two hull, so hull power 4, four Slow and Steady, one strip it never loads, a fighter's science and engineer, `priorities: { tactical: 0, science: 0 }`, skill 1. `gridFragment`: `sentry-drone`, 2 bare then one emitter, a fighter's reactor (`reactorCards(2, 'reactorPowerTactical')`), as the cannon costs 3 and two reactor sets give tactical 2, the spec's helm, three cannons in one slot, skill 0.6. `miningStation`: `inertTemplate('drydock-tender', 30 bare)`.
- **What a hit does, checked** (Check first): a shuttle alone keeps its hull through one cannon hit (2 of 4 cards gone if it lands on the hull) and is destroyed by the second. Under extended shields, a cannon hit costs the crew 10 to 13 of their 120 (10 while reinforced) and the shuttle at most 3 of its 15, and nothing reaches its hull. A fragment dies to one torpedo, or to two cannon hits, though one in six cannon hits that lands on its hull destroys it outright.
- **A hunter whose shuttle has gone goes after the next shuttle** (Check first): with no hostile in reach it has no target, and once the next launches it's the only one there is.
- **Extend Shields covers a shuttle** (Check first). It's kept in the engineer's hand.
- **Thirty ships** in all (six shuttles, 23 fragments, the station) play out in about half a second of computer time per four minutes of game time, in a test with nothing drawing it.
- **Lines.** The launch call is urgent with a `maxDelayMs` of 3 seconds. "Away" and "lost" both queue: the station's count is the only score, so neither is ever dropped. For two together it's "Shuttles Five and Six, port and centre lanes, in five." The shuttle that settles it gets the closing line in place of its own. With none saved nothing is said, and the last "lost" is dropped with it. The elite reactor failing, with a shuttle still unlaunched, is a line the spec didn't have: "Reactor's gone. Six won't be launching." (urgent).
- **Sending both** cancels the schedule and calls both at once, launching 5 seconds later. **Launching cold** sets each later shuttle's shields to 0 as it launches. In the elite form the reactor fails at 210 seconds whichever was answered, and anything not yet launched counts as lost.
- **Fragments are numbered across the whole encounter**, "Fragment One" to "Fragment Twenty-Three", as the expected talk has them. Shuttles are "Shuttle One" to "Shuttle Six". The station is "Corrie Deep Station", spawned with scenario id `corrieDeep`, and does nothing.
- **`Encounter.test.ts`'s standalone check** expects something hostile at the start of every request. This one has nothing hostile at all, so it checks for something there instead.

### Measured

From `LastShuttleOutEncounter.balance.test.ts` (`npm run test:balance`), seeds 3, 7, 11, 13 and 17. The crew is a script: helm keeps 1.5 behind the newest shuttle at 1 unit a second and waits by the station between launches; the engineer keeps Extend Shields up; science finds out about the nearest unscanned fragment every 12 seconds; tactical lands a cannon hit on the nearest known live fragment every 16 seconds from 30 seconds in, and a torpedo every 70 from 40, only ever on live ones, and every shot hits. So these say what each plan comes to, not whether a crew can carry it out. Five seeds is rough: one shuttle more or less on one seed moves a mean by a fifth.

- **Doing nothing:** 1 saved on every seed, Shuttle One. Over at about 225 seconds.
- **Only covering:** 2 saved on every seed, and the crew's shields at 0 before Six launches, on every seed.
- **Only killing:** 2 to 5 saved, mean 3.6, and no shields spent.
- **Covering and killing:** 3 to 5, mean 4.2, with 0 to 120 of the shields left. With the cannon twice as often, 4 to 5, mean 4.6. Nothing saved all six on the schedule.
- **Send both** (covering and killing): 3 to 6, mean 4.6, against 4.2 for holding, and over at 180 to 190 seconds against 225 to 260.
- **Elite, nothing done:** 1 saved, over at 210 seconds when the reactor fails. **Keeping the checks:** 3 to 5, mean 4.0. **Launching cold:** 2 to 5, mean 3.8. Neither dominates.
- **A live fragment's first shot** comes 40 to 50 seconds after it arrives, unless it arrived near the end of its shuttle's lane, which happened on one seed of three (seed 11, at 23 to 31 seconds). Measured on seeds 3, 7 and 11 before the dead fragments' drift had its five legs.
- **With the grid shooting the crew, as specified:** the crew was destroyed in 17 of 21 runs over seven plans and seeds 3, 7 and 11, at 80 to 220 seconds, and in every run where it did nothing, at 105 to 110.

So the encounter's central trade-off only partly holds. **The shields are a small part of it.** Covering alone spends all 120 and saves one more shuttle than doing nothing; killing alone saves two or three more and spends none; covering on top of killing adds about half a shuttle. A live fragment's load is four shots in four seconds, so the crew's shields absorb two or three loads, not nine separate hits spread across the evacuation. What decides the score is science finding the live fragments in the 40-odd seconds before they fire, and tactical killing them. The question it asks in practice is closer to Diagnose under a clock than to Endure.

### Still to check, by playing it

- Whether science reaches for fragments on the scan list fast enough. It holds five scan cards by the first launch, and the list starts with the station.
- Whether helm reads live fragments from their motion before science does, and whether that's talk or a shortcut.
- Whether the crew covers at all, given how little it buys, and whether the engineer's call ("this one or the next") ever comes up.
- Whether blue (neutral) fragments read as harmless on the viewscreen, as the grid now never fires on the crew. A briefing line may need to say "they won't fire on you".
- Whether Shuttle One being free makes the first forty seconds dull, or a useful time to scan.
- The station's and a newly launched shuttle's labels overlap at the moment of launch.
- Most fragments arrive outside the viewscreen's frame, so the first the room sees of a wave is on the phones.
- Nobody has watched a scan of a live fragment's tactical system on a phone: it has been run in the game, both forms, built with dev tools, with four crew pages joined and nobody playing. The briefing, the objective "Protect the shuttles", the station to port, Shuttle One and Two launching down different lanes, the fragments, the targets on tactical's and science's lists, Extend Shields in the engineer's hand, and the elite question at 105 seconds all reach their screens.

---

## 7. Quiet Running

| | |
|---|---|
| **Question** | Reach |
| **Class / id** | `QuietRunningEncounter extends Encounter` / `quietRunning` |
| **Request** | Keeper, Ketch Relay: parts run. "The Wardens have a cordon round my relay and I'm down to one good coupler. You've got the spare. Come in quiet. They watch for power, not for ships." |
| **Objective** | `{ type: 'reach', subject: 'Ketch Relay' }` |
| **Target length** | 3 minutes |
| **Pool** | Sector 1, not the first two layers |

### The idea

A ring of pickets surrounds the relay. They're not hostile. Each sees the ship if it's close and showing too much power, and how much is too much depends on how close, and on how hard that picket's sensors are running at that moment. Getting through the ring means the engineer taking power away from people who want it, at a moment science picks, on a line helm holds. If they're seen, it's a run.

### Factions

```ts
factions = [
    { id: 'wardens', relations: { [playerFactionId]: RelationshipType.Neutral } },
    { id: 'keepers', relations: { [playerFactionId]: RelationshipType.Friendly } },
];
```

Being seen is `setRelationship('wardens', playerFactionId, RelationshipType.Hostile)`.

### New engine pieces

**Groundwork I, J, K and L** (`reach`).

**Two ship designs.** `picket`: appearance `wedge-destroyer`, the `fighter`'s hull and decks with two weapon slots and `phaserCannon` added, `fleeThreshold: 0`, skill 0.7. `relay`: inert, appearance `ring-vessel`, hull of 30 bare.

**An engineer card, `runQuiet`.** Targets a system. Cost 1. "This system runs 2 power lower. Play it again to bring it back." It puts a `runningQuiet` effect on the system, with no time limit, which takes 2 power while it's there. Played on a system that has it, it removes it. The encounter keeps one in the engineer's hand.

**The `flare` card made real.** It exists, costs 2, and logs a line. It now puts `flareBurning` on its ship's tactical tile for 8 seconds. The encounter keeps one in tactical's hand until it has been used twice (see rule 5).

### How a picket sees

The ship's **signature** is the sum of its six systems' power: 18 as it arrives, and 6 with everything running quiet. Nothing displays it. The engineer can add it up.

Every `watchIntervalMs` (500), each picket checks each player ship. It sees one that is within `sightRange` (24) and whose signature is more than:

```
6 + distance / 2 + (3 - sensor) * 2
```

`sensor` is that picket's sensor level: 1, 3 or 5. Each picket's steps 1, 3, 5, 3, 1 and round again, one step every `sensorStepMs` (10 seconds), each starting at a random point in the cycle. The encounter mirrors it onto the picket's science power every tick, so a scan of that picket's science system reads it, and nothing the picket's own engineer does can change what the scan shows.

Six pickets sit on a ring of radius 28 around the relay, turned by a random angle each time. The middle of a gap is 14.5 units from the picket on either side:

| Both neighbours' sensors at | Signature has to be at most | Systems running quiet |
|---|---|---|
| 1 | 17 | one |
| 3 | 13 | three |
| 5 | 9 | five |

Off the middle of the gap it gets worse on one side faster than it gets better on the other.

At full power the ship is first seen about 23 units from a picket whose sensors are at 3, and stays in somebody's sight until it's within 5 units of the relay. That's 40 units or so, which is several sensor steps. So no crossing is made on one reading: the crew goes in on a good one, a sensor rises while they're in the gap, science calls it, and the engineer takes another system down.

### Ships and timeline

The relay ("Ketch Relay") is 70 units ahead. The pickets ("Warden Picket One" to "Six") are on their ring around it, each with `defend-position` on its own position, radius 30.

The keeper can hold the relay's door for `windowMs` (180 seconds), and says so at the start, with a minute left, and with 20 seconds left.

### Rules

1. **Success** when a player ship is within `arrivalRadius` (3) of the relay, seen or not.
2. **Failure** when the window closes. If they were never seen, the pickets are still neutral.
3. **Seen:** the Wardens turn hostile, every picket is given `search-and-destroy` (groundwork J), and the picket that saw them says so. The window doesn't change.
4. **Firing on a picket** is being seen, at once (`hitReceived`, with the crew as its source).
5. **A flare:** while one burns, no picket sees anything. When it goes out, every picket's sensors go to 5 for `alertMs` (20 seconds), then pick up their cycle. After the second flare, tactical isn't given another.
6. The pickets go on watching inside the ring. The allowance rises with every unit the ship puts behind it, so the gap is the worst of it, and the last 5 units are out of everyone's sight.

### What each station has

| Station | Sees | Does |
|---|---|---|
| Engineer | Every system's power. Run Quiet | Adds up the signature. Decides who goes dark and when, and gives it back |
| Science | One picket's science power at a time: 1, 3 or 5, stepping every ten seconds | Watches the two pickets either side of the gap, one at a time, and calls when both are low. Still needs 1 power to scan |
| Helm | The flight picture | Holds the middle of the gap. On 1 power that's `slowAndSteady` and `strafe` and nothing else |
| Tactical | Its weapons, and a flare | Holds fire. Keeps tactical at 2 power for the flare, which is 1 more signature than running it quiet, or gives it up |

What running quiet costs each system: helm loses every manoeuvre that costs 2. Science keeps only the basic scan. Tactical can't load anything, or light a flare. The hull's shields absorb 60% in place of 80%. The reactor deals every system its cards four times slower. The engineer can still play Run Quiet, and little else.

**Captain's call:** go now through a gap that needs five systems dark, or wait ten seconds for one that needs three, with the window running. And when to burn a flare, since it buys eight seconds and then makes the next twenty worse.

### Hails

| When | Speaker | Line |
|---|---|---|
| Start | Keeper, Ketch Relay | "They watch for power. The closer you pass, the less you can show. And their sensors breathe: up, down, up. Catch two of them low and go between. I can hold the door three minutes." |
| Seen | Warden Picket Three (whichever) | "Contact in the cordon. Unregistered. All pickets, converge." |
| After that | Keeper, Ketch Relay | "They've seen you. Run for it. The door's open." |
| A minute left | Keeper, Ketch Relay | "One minute, then I have to go dark." |
| 20 seconds left | Keeper, Ketch Relay | "Twenty seconds." |
| Success, unseen | Keeper, Ketch Relay | "I didn't see a thing, and neither did they. That's the coupler. Thank you." |
| Success, seen | Keeper, Ketch Relay | "Subtle. Still, that's the coupler. Go on, before they work out where you went." |
| Failure | Keeper, Ketch Relay | "That's my window. Going dark. Don't lead them here." |

The time warnings are urgent.

### Expected talk

> **Science:** "Picket Two's at three. Going down next."
> **Captain:** "And Four?"
> **Science:** "I can't watch both. Switching. Four's at one."
> **Engineer:** "At three and one I need us at fifteen. That's two systems. Tactical and science."
> **Science:** "Not science, I'm the one telling you when."
> **Helm:** "I need three power to make this turn."
> **Engineer:** "You can have three until we're in the gap. Then you're on one. On my mark."

### Elite form

One picket has defected, and will let them past. There are eight pickets on the ring, so a gap's middle is 11 units from each side: two systems dark with both neighbours at 1, four with both at 3, and all six at 5. The defector's sensors read 0 and never change, and it never sees anything. Passing right by it leaves the real pickets on either side 21 units off, which takes one system dark with them at 3, and none at all at 1.

The defector is in its own faction, neutral to everyone. If the crew is seen, it turns on the Wardens (hostile to them, friendly to the crew), is given `search-and-destroy`, and says: "Picket Five to the unregistered ship. Go. I'll keep them looking at me."

The keeper's opening line gains: "One of them's stopped answering roll-call. I don't know which."

**Legacy (for when legacies are built):** if the crew reached the relay, the defector is at the sector boss, on the crew's side for the last phase. On failure, nothing.

### Tuning

| Constant | Value |
|---|---|
| `relayDistance` / `ringRadius` / pickets | 70 / 28 / 6 (elite: 8) |
| `sightRange` | 24 |
| Allowance | `6 + distance / 2 + (3 - sensor) * 2` |
| `sensorStepMs` / `watchIntervalMs` | 10 000 / 500 |
| `windowMs` | 180 000 |
| `arrivalRadius` | 3 |
| Run Quiet cost / power taken | 1 / 2 |
| Flare cost / burn / `alertMs` / how many | 2 / 8 000 ms / 20 000 ms / 2 |

`sensorStepMs` is the nearest thing here to a tell.

### Tests

- A ship at full power is seen at 14.5 units from a picket whose sensors are at 3, and isn't with three systems quiet.
- The allowance at each sensor level, at the middle of a gap, matches the table.
- A picket's scanned science power is its sensor level, and stays so when its own engineer boosts it.
- Seen: Wardens hostile, pickets hunting, and reaching the relay is still a success.
- A hit on a picket from the crew counts as being seen.
- A flare stops every picket seeing for its burn, then puts them all at 5 for the alert. There's no third.
- The window closing is a failure: no reward, Warp Away offered, and pickets that never saw them are still neutral.
- Run Quiet takes 2 power from a system and gives it back when played again, including on a system already at 1.
- Elite: the defector never sees, and turns on the Wardens only if the crew is seen.
- Balance: a crew that flies straight at the relay at full power is seen. A crew that waits outside the ring for both neighbours at 1 gets that chance at least twice in the window.

### Changed from the plan

- **Science reads a sensor level, not a "scan state".** A scan shows a system's power, so that's where the picket's attention is put.
- **Being seen isn't the failure, and neither is being slow by itself.** The window is the one clock, and being seen makes it hard to beat.
- **The cordon is a ring, not a line**, so there's no way round it.

### Check first

- **What power does to a manoeuvre.** I've assumed it only decides which cards can be played. If speed scales with helm power too, running helm quiet costs more than the spec says, which is fine, but the 180 seconds needs checking against it.
- That a system's power can be pushed below what Run Quiet leaves and come back right. `adjustPowerLevel` keeps an underlying value for this. Test it with a boost and Run Quiet together.
- That mirroring the sensor level onto a picket's science power every tick doesn't fight its engineer in a way a scan can see flicker.
- That neutral ships don't shoot and aren't shot at by the AI, and how a neutral ship looks on the crew's screens. Standing Orders ends neutral. Nothing has started that way.
- That nothing else in the game raises a system's power above baseline for long without the engineer choosing it. The reactor hands the engineer `auxPower` cards. Playing one is the engineer's choice, and adds to the signature.
- Whether the engineer can really add up six numbers under pressure, or whether this needs the total shown on their screen. I'd try it without first: saying the numbers aloud is the talk.

---

## 8. The Gate That Never Closed

| | |
|---|---|
| **Questions** | Diagnose, then Coordinate, then Endure |
| **Class / id** | `QuarantineGateEncounter extends Encounter` / `quarantineGate` |
| **Request** | The Shallows: the quarantine gate. "Thirty years shut, over an outbreak nobody remembers. The relay keepers can lift it for good, if somebody gets them to the door." |
| **Objective** | `{ type: 'disable', subject: 'the Quarantine Gate' }`, then `{ type: 'protect', subject: 'the keepers\' boat' }` |
| **Target length** | 5 to 6 minutes |
| **Pool** | Sector 1's boss. Replaces `bossA` in `sectorThemes.ts` |

It has no elite form, and can't be failed except by losing the ship. It uses nothing the sector hasn't already taught: reading a shield through a scan (Toll Collectors), taking shields down and then stopping (Standing Orders), a clue only the engineer sees (Standing Orders), and covering something that flies its own course (Slow Boat).

### Factions

```ts
factions = [
    hostileToPlayer('gate'),
    { id: 'keepers', relations: { [playerFactionId]: RelationshipType.Friendly, gate: RelationshipType.Hostile } },
];
```

### New engine pieces

**Groundwork J and L** (`setObjective`).

**A ship design, `gatePylon`.** The customs platform again, with a shape of its own: appearance `outrigger-pod-cruiser`, helm of nothing but `faceTarget`, 6 emitters and 60 bare for 90 shield over a hull of 66, hull at full power, tactical `phaserCannon` × 2 and `photonTorpedo` × 2 in one slot, `fleeThreshold: 0`, skill 0.5. Its hull deck has no tuning cards, as the gate sets its tuning.

**A ship design, `keeperBoat`.** Appearance `trimaran-cutter`. *Marrow*'s hull: 5 emitters at full hull power, 75 shield, and almost nothing under it. Helm `slowAndSteady` × 4. `priorities: { tactical: 0 }`. `fleeThreshold: 0`. Skill 1.

**A status effect, `gatePulse`.** 4 seconds, does nothing. It's there to be seen by the engineer.

**Four key cards**, one per station, as every card belongs to one system: `shutdownKeyHelm`, `shutdownKeyScience`, `shutdownKeyTactical`, `shutdownKeyEngineer`. No target. Cost 4. "Turn your key. It stays turned for 5 seconds." Each puts a `keyTurned` effect, lasting `keyWindowMs`, on its own system's tile. All four are called "Shutdown Key" on the card.

### Ships

Four pylons at the corners of a square 24 units on a side, its centre 30 units ahead: "Pylon One" to "Pylon Four". Each has `defend-position` on its own position, radius 30. One, picked at random, is the **master**.

Each carries torpedoes so that it can't be shelled from outside its own reach, and the square is small enough that anywhere near one pylon is in range of two more.

### Phase 1: find the master

The master changes its shield tuning, between energy and torpedo, every 9 to 15 seconds. Each of the other three copies it `copyDelayMs` (3 seconds) later. The encounter sets each pylon's tuning every tick, so nothing its own hull cards do can change it.

Each time the master changes, a `gatePulse` lands on one crew system of each player ship.

| Part | Who has it | How |
|---|---|---|
| **When the master changed** | Engineer | The pulse, the moment it lands |
| **When this pylon changed** | Science and tactical | The scanned pylon's shield tuning. One pylon at a time |

A pylon that changes on the pulse is the master. One that changes three seconds after is a copy. Checking a pylon takes one change, so about twelve seconds each, and the master could be the last one checked.

Then the crew has to act on it: **take the master's shields down.** That's 90 shield, tuned against one weapon type or the other at every moment, so science calls the tuning and tactical loads the other type, as with the *Assize*.

- **The master's shields reach 0:** phase 2.
- **A copy's shields reach 0:** the gate reseats it. Five seconds later its shields are full again, and the gate says so. The crew has spent its own shields finding out.
- **The master is destroyed** (it has 60 hull under its shields, so two or three hits too many): the gate promotes one of the others, at random. Phase 1 starts again with one pylon fewer, and the keepers say so.
- **The last pylon is destroyed:** the gate is open, and can't be closed or kept open by anybody. `complete('success', 0.5)`.

### Phase 2: four keys

The keepers put a key in each station's hand (`keepInHand` for each role). The gate accepts them when **all four of one ship's crew systems have `keyTurned` at once**, and that ship is within `keyRange` (8) of the master.

- A key costs 4. Every station has 3. So each needs a boost from the engineer, the engineer included, and an `auxPower` lasts 30 seconds and arrives one card at a time. Getting four systems to 4 at once is a countdown the engineer runs aloud.
- Eight units from the master is inside every weapon it has, and two other pylons'.
- If the keys lapse without all four: the gate says "SEQUENCE INCOMPLETE", once per attempt. Keys come back to hand as they're played, so the crew tries again.
- If all four are turned out of range: "NO HANDSHAKE."
- The master's shields stay down. It still has to survive.

**All four, in range:** phase 3.

### Phase 3: hold the door

The keys are taken back. The objective changes to protecting the keepers' boat. The engineer is kept supplied with Extend Shields. The master stands down (`standDown()`), and the other pylons don't.

- "Keeper Boat *Tally*" arrives 30 units from the master, on the side away from the other pylons, and flies to it.
- From the handshake on, each pylon that's still fighting launches a `drone` every `droneIntervalMs` (20 seconds), up to `maxDrones` (4) at once. They hunt, preferring the boat.
- When *Tally* is within 2 units of the master, the keepers say they've docked, and `boardingMs` (90 seconds) starts.
- **If *Tally* is destroyed**, another launches 10 seconds later, and the 90 seconds start again when it docks. There's no limit, and each one costs the crew another approach under fire.
- **When the 90 seconds are up:** every pylon stands down, the drones leave, and `complete('success')`.

### What each station has

| Station | Phase 1 | Phase 2 | Phase 3 |
|---|---|---|---|
| Engineer | Sees the pulse. Calls it | Boosts four systems in turn and calls the count | Extend Shields over *Tally* |
| Science | Scans a pylon. Says whether it changed on the call or after | Its key | Calls which drone is on a run |
| Tactical | Sees the same tuning. Loads the type the master isn't tuned against. Stops at 0 | Its key. Doesn't hit the master | Drones |
| Helm | Keeps to the edge of the square while they work it out | Its key, from inside 8 units | Stays inside 4 units of *Tally* |

**Captain's calls:** which pylon to spend the ship's shields on, when the evidence is one reading. "On my mark" for the keys. And in the last phase, whether to take *Tally*'s hits or shoot what's making them.

### Hails

| When | Speaker | Line |
|---|---|---|
| Start | Keeper Team | "Four pylons, one master. The other three copy its shield setting a moment late. Find the one that changes first and take its shields down. Only its shields. We need it working." |
| After that | Quarantine Gate | "QUARANTINE IN EFFECT. DAY TEN THOUSAND NINE HUNDRED AND FIFTY-EIGHT. TURN BACK." |
| A copy's shields down | Quarantine Gate | "PYLON TWO RESEATED." |
| After that | Keeper Team | "Wrong one. It's put its shields back." |
| The master destroyed | Keeper Team | "That was the master! It'll pick another. Start again, and go easier." |
| The master's shields down | Keeper Team | "That's the master. Keys are on your consoles, one each. All four inside five seconds, and get close. It can't hear you past eight units." |
| Keys lapse | Quarantine Gate | "SEQUENCE INCOMPLETE." |
| Keys out of range | Quarantine Gate | "NO HANDSHAKE." |
| Keys accepted | Quarantine Gate | "INSPECTION OVERRIDE ACCEPTED. DEFENCES TO AUTOMATIC." |
| After that | Keeper Team | "We're in the door. Boat's launching. Ninety seconds once we dock. Keep them off us." |
| Docked | Keeper Boat *Tally* | "Docked. Ninety seconds." |
| Halfway | Keeper Boat *Tally* | "Halfway." |
| *Tally*'s shields at half, and a quarter | Keeper Boat *Tally* | "Shields at half." / "Shields nearly gone." |
| *Tally* destroyed | Keeper Team | "We've lost the boat. Second crew's launching." |
| Success | Quarantine Gate | "QUARANTINE LIFTED. DAY ONE." |
| After that | Keeper Team | "It's open. Thirty years, and it's open, and it'll stay open. Go and tell them." |
| The last pylon destroyed | Keeper Team | "Well. It's open. It won't ever close again, which isn't what we came for. But it's open." |

The gate's lines are urgent.

### Expected talk

> **Engineer:** "Pulse! On tactical."
> **Science:** "Three hasn't changed. Now it has. That's late. Three's a copy."
> **Captain:** "Two down. Science, take Four."
> **Engineer:** "Pulse."
> **Tactical:** "Four changed. Same moment. It's on torpedo."
> **Captain:** "Four's the master. Phasers, then. Helm, take us in."

> **Engineer:** "Helm's at four. Science at four. Tactical, you're next, and then me. You've got about ten seconds once I say."
> **Helm:** "Seven units. I can hold this for one pass."
> **Captain:** "Keys on my mark. Engineer?"
> **Engineer:** "I'm at four. Go."
> **Captain:** "Mark."

### Legacies

For when legacies are built. This is the list the boss reads, in one place:

| From | If | Then |
|---|---|---|
| Toll Collectors | Success | Local 12's spare emitters: the crew's shields are restored once, at the start of phase 3 |
| Slow Boat | The stores were handed over | Two Stranded harriers fight for the keepers in phase 3 |
| Slow Boat | Refused, and *Marrow* made it | *Marrow* is there: the crew's repair capacity is refilled at the start of phase 3 |
| Standing Orders | Success | Tessaly Yard's tender: the same, at the start of phase 2 |
| Fever Ship | Success | *Ostler*'s crew name one copy at the start |
| Dead Weight | Success | Halden's water tenders: repair capacity refilled once |
| Last Shuttle Out | Four or more saved | Corrie's tender: the same |
| Quiet Running | Reached the relay | The defector fights for the keepers in phase 3 |

### Tuning

| Constant | Value |
|---|---|
| Square side / distance to its centre | 24 / 30 |
| Pylon shield / hull | 90 / 66 |
| `modeIntervalMs` | 9 000 to 15 000 |
| `copyDelayMs` | 3 000 |
| `reseatDelayMs` | 5 000 |
| Key cost / `keyWindowMs` / `keyRange` | 4 / 5 000 / 8 |
| `boardingMs` | 90 000 |
| `droneIntervalMs` / `maxDrones` | 20 000 / 4 |
| `secondBoatDelayMs` | 10 000 |
| Pylon skill | 0.5 |

`copyDelayMs` is a tell, and the one that matters most at a fast clock: at 1.4× it's about two real seconds.

### Tests

- The master's tuning changes within the stated interval, and each copy's follows by the delay. A pulse lands on each player ship at each change.
- A copy's shields at 0 are restored after the delay, and nothing else changes.
- The master's shields at 0: each station has a key, and only then.
- Four keys turned in the window, in range: phase 3. Three keys: nothing, and one line from the gate. Four out of range: nothing, and the other line.
- A key comes back to hand when played, and all four are gone in phase 3.
- The objective changes at the handshake.
- The master stops firing in phase 3, and the others don't.
- *Tally* docks, and 90 seconds later it's a success: every pylon stood down, drones gone, the boss reward paid.
- *Tally* destroyed: another arrives, and the count starts again.
- The master destroyed: another pylon becomes master, and its shields have to come down in turn.
- All four destroyed: success at half the reward.
- With the real AI: a pylon turns, stays put and fires, as the platform's test checks.
- Balance: how much of the crew's 120 shield a careful crew has left at the start of each phase. If it's none by phase 3, the pylons need fewer torpedoes.

### Changed from the plan

- **Tactical doesn't see the delay alone.** The scanned hull goes to science and tactical alike. The seat that has something nobody else does is the engineer, with the pulse. So it's engineer and science, and tactical is the one who uses the answer.
- **Phase 1 ends in an action**, taking the master's shields down, because working something out doesn't change anything the game can see.
- **"In the master's arc" is "close to it".** The pylon turns to face whatever it's shooting at, so its arc is wherever the ship is.

### Check first

- **Whether a crew survives it.** Four pylons with torpedoes, 120 shield that doesn't recharge, three phases. Nothing in the first three encounters asks this much. The balance test above is the first thing to write.
- That setting a pylon's tuning every tick reads steadily through a scan. An emitter card played from its hull sets `shieldReinforced` and clears the other tunings until the next tick puts it back. If that shows as a flicker, give the pylon no hull power from its reactor, so its hull never draws, and raise its hull power directly.
- That four `auxPower` cards can be got and played inside one card's 30 seconds. The reactor only offers one while the engineer isn't holding one. If it can't be done, the keys cost 4 for three stations and 3 for the engineer.
- That `keepInHand` with four card types across four roles behaves on a second player ship.
- How a boss node is named and labelled when its definition has a request.
- That the viewscreen copes with an objective that changes: it may need to announce it.
- Whether 3 seconds between the pulse and a copy changing is long enough to say aloud and act on. It's the whole of phase 1.
