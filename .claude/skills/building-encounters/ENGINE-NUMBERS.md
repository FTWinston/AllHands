# Engine numbers for encounter work

What a spec's numbers come to in the engine, and what each seat can really see. Every value here is tuning and will drift: the file named beside each is the truth. Read the file before leaning on a number.

## Damage and health

- **Health is a card count.** A system's health is how many of its cards are undamaged (`SystemState`). The hull's is the same, and a ship is destroyed when its hull reaches 0 (`HullState.adjustHealth`). Expendable cards, such as Aux Power, aren't counted.
- **A hit that gets through damages that many cards.** Weapons do 10 to 60 (`cardDefinitions.ts`: phaser strip 10, phaser cannon 20, photon torpedo 40, photonic cannon and quantum torpedo 60). A harrier's hull is 5 cards. So shields are the health bar, and what's under them is one or two hits.
- **Where a hit lands** (`Ship.damage`): on a system picked at random from all six, hull included. If that's the hull, all of it goes there. Otherwise 60% (rounded up) goes to the system and the rest to the hull.
- **An aimed shot lands on the system aimed at**: 60% to it, the rest to the hull. AI tactical officers aim whenever their science has identified a system, at tactical first and then helm. So anything the AI shoots at loses its weapons before its hull.
- **Seeded runs drift wherever anything aims**, because an aimed shot skips the random pick. A balance test's numbers move when aiming does.
- **To make something survive stray hits**, pad its hull with `hullBare`. The customs platform has 60, which is one or two hits after its shields go.
- **Cards are damaged in the order the design lists them**, until repairs shuffle things. A damaged emitter takes its 15 off the shield capacity, so list a hull's bare cards before its emitters if its shields are meant to outlast its first hull damage.
- **A system at 0 health can't play, load or charge anything**, but a weapon that's already loaded and charged goes on firing, and a manoeuvre under way runs to its end.

## Pace

How often things happen, which no table of amounts shows. Measure it for every armed ship: seconds to its first shot, and shield taken off an idle crew per minute.

- The reactor plays one of its cards every 8, 4, 2, 1, 0.5 or 0.25 seconds, at reactor power 0 to 5 (`ReactorState`). Each card played makes its own system draw one card. So a system draws once per pass through the reactor deck for each of its reactor cards in it.
- Adding reactor cards for a system raises its power and its draw rate together. To raise power alone, use `adjustPowerLevel` after the ship is built. Three extra tactical reactor cards made a hauler lethal inside 90 seconds.
- A weapon needs its own card, then enough other weapon cards spent on it to reach its `totalCharge`, before its first shot. A slow-drawing ship with an expensive weapon may never fire.
- The player's science gets a card about every 6 seconds on top of the one it starts with.
- The player's tactical draws at the same rate, from a 12-card deck with one phaser cannon and one photon torpedo. Its first cannon shot comes about 30 seconds in, a load is four shots, and the torpedo comes round about once a minute. A plan that needs two torpedoes needs two minutes.

## Shields

`shieldStats.ts`, `hullShields.ts`, `HullState.ts`.

- Capacity is 15 for each undamaged `hullShieldEmitter`, 45 for a `hullVolatileEmitter`. The player ship has 120.
- Shields absorb a share of each hit, set by **hull power**: 60% at power 1, rising 10 points a level to all of it at 5, and nothing at 0. The rest gets through even while the shields are up.
- What they absorb drains them: by all of it at power 1, down to 60% of it at power 5.
- A hit that leaves them under 10% of capacity collapses them.
- Tuned against the weapon's type, the hit is cut by 40% before any of that. A tuning lasts 12 seconds, set by hull cards as they're drawn, or by `hullState.tuneShields(...)`.
- **They don't recharge during an encounter.** Anything that waits for shields to reach 0 will get there.
- There's no event for shields reaching 0. Poll in `tick`.

## Power

- A system's baseline power is how many of its `reactorPower<System>` cards the reactor deck holds (`Ship` constructor). The player ship has 3 everywhere. The most is 5.
- **A card's cost is a level, not a price.** A card can be played if its system's power is at least its cost, and playing it doesn't lower the power (`SystemState.playCard`). "Costs more than the station normally has" means a cost of 4 or 5.
- Each reactor card, as it's played, makes its system draw a card, so more reactor cards of a kind also means a faster hand.
- **An AI engineer repairs for free, every second**, once a system is a fifth damaged, from a repair capacity of 50 (`EngineerOfficer`). It undoes small hits between shots. To stop repairs alone, set the ship's `engineerState.repairCapacity` and `maxRepairCapacity` to 0. `priorities: { engineer: 0 }` stops its cards as well.
- A repaired card comes back stabilised, and is damaged for good the next time. So a system put out, repaired and put out again stays out.
- **An AI engineer only plays a power card when another officer has asked for power**, which happens when that officer holds a card it can't afford. A ship of cheap cards never asks.
- Emitters, as they're drawn, set the shields to reinforced, which cuts their drain to 75%.

## Movement and space

- The player ships start each encounter at the origin, facing along the x axis. Starboard is positive y.
- **Angles are counter-clockwise with y pointing down** (`vectors.ts`: `getAngle` is `-atan2(dy, dx)`). A point at bearing `b` and distance `d` is `x + cos(b) * d, y - sin(b) * d`, and a positive turn is to port. Copy `SlowBoatEncounter.spawnHarrier` and `announceTurn`. `polarToCartesian` has the other sign.
- **A ship's speed isn't constant.** Motion between two keyframes eases in and out, peaking at about one and a half times its average. Slow and Steady averages about 0.75 units a second and has no maximum distance, so an AI ship on a route plays one card to the next waypoint however far it is: about 5 units in its first 20 seconds, 1.1 a second halfway. Zig-zag and Sweep go forward at about 1 a second. Measure any ship that matters in a played-out test.
- **A manoeuvre under way runs to its end** whatever happens to the helm. An encounter that needs a ship stopped has to stop it: see how Dead Weight halts its tug.
- Weapon ranges: phaser strip 6, phaser cannon 10, photonic cannon and quantum torpedo 15, photon torpedo 20 (25 with Extended Range). Arcs are half-angles in radians: strip 3, cannon 1, the rest 0.5.
- A ship knows of everything within 100 units (`Ship.updateKnownObjects`). There's no hiding by distance at encounter scale.

## AI ships

`Commander.ts`, `ai/types.ts`, `AiShip.ts`.

- **Goals:** `search-and-destroy` (with an optional `prefer`), `defend-position`, `guard-ship`, `travel-route`. A goal is set at spawn. Nothing changes it later except a guard whose ward dies, which hunts.
- **`defend-position`** ignores hostiles outside its radius. Use 30, which is past every weapon.
- **`guard-ship`** only goes for hostiles within 30 of its ward. Once it has one, it leaves its ward to fight, and holds off at its own weapon's range: Dead Weight's bailiffs keep 12 to 20 units from a crew that chases them, where only a torpedo reaches.
- **A ship that flees comes back** once its engineer has repaired it past twice its flee threshold. If fleeing is meant to count as gone, call `withdraw()` on it when it starts.
- **Target choice:** score is 100 minus distance, plus 30 for the preferred ship, plus noise. A ship only switches to a target scoring 1.25 times its current one, which at encounter distances is almost never.
- **Skill** (0 to 1, default 0.8): below 1, target scores get noise of up to 30 × (1 − skill), and the commander skips up to half its updates. The officers do the same with their own choices: at 0.7 each skips about one think in seven, and every card's score is off by up to 9.
- **An AI science officer scans only to reveal a system**, and stops once it has found all four of its target's. So scan cards that mark what they reveal (Antiproton, Chroniton) land in the first minute and then stop. It never looks for a vulnerability or reads a hand.
- **A modifier's evaluator doesn't check the weapon it's for.** An AI with torpedo modifiers and a cannon will try to put one on the other, and fail. Give a ship only modifiers that fit its weapons.
- **Fleeing:** below `fleeThreshold` of hull (0.25 unless the design says, 0 for never), and back once the hull recovers to twice that. `withdraw()` is permanent until `rally()`. `standFast()` stops it fleeing.
- **Leaving:** a fleeing ship departs after 3 seconds at least 30 units from every hostile it knows. Against a ship that sits still that takes about 23 seconds for a harrier and 33 for a bulwark.
- **An officer with priority 0 never acts.** `priorities: { helm: 0 }` makes a ship that can't move or turn.
- **A ship only shoots what its faction is hostile to**, and only plays cards that have an `aiEvaluator` in `getEngineCardDefinition.ts`.
- AI ships only exist within an encounter, with shields up and hands dealt from the moment they're made.

## What each seat can see

The channels a clue can travel by. If the fact isn't in one of these, the seat can't see it.

| Seat | Sees | Where |
|---|---|---|
| Science | For one system of one ship at a time, after finding which of four shuffled scan slots it is: its power level, and for helm the manoeuvre under way and its progress; for tactical each weapon slot's card, charge and modifier; for science the loaded deflector card; for engineer every system's power and health | `ScienceState.copy*Data`, `Scanned*Info` |
| Science, for a second scan card | That system's hand, live, until they scan anything else. Or a vulnerability. One card buys one | `Scanned*Info.hand` (null until read), `ScienceState.readHand` |
| Science and tactical | The scanned ship's hull: health, shield, capacity and current tuning. It follows whichever ship science last scanned | `Ship.scannedHull` |
| Tactical | Every object but its own ship as a target, friendly ones included: nothing stops the crew shooting an ally. The systems science has identified on a target, as sub-targets, which stay known. Its own weapons and whether each can fire | `TacticalState.subTargetsByTarget` |
| Engineer | Every status effect on its own ship's systems, by name. Each system's power, health, hand and deck | `EngineerSystemTile` |
| Helm | Where everything is and which way it faces | `GameObject.motion` |
| Viewscreen | The same picture, shots and who fired them, the objective line, hails, questions | `GameState` |

Nobody sees another ship's decks, its status effects, or its goal. What a ship is about to do is in its hands, which cost science a second card each, one system at a time.

An encounter that changes a ship's hand does it through `SystemState`'s methods (`addCardToHand`, `removeCard`, `discard`), so that a hand being read shows the change.

## Comms

- A hail is up for 2.5 seconds plus 55 ms a character, in real time (`HailInfo.ts`). An urgent one can cut an ordinary one short after 3 seconds.
- The same line twice in a row doesn't replay on the viewscreen.
- A question's time limit is game time, never less than its own reading time. Only one can be open.

## Rewards

Antimatter by node kind: 10, 30 for an elite, 50 for a boss, times the score (`antimatter.ts`). A failure pays nothing and the crew still warps away.
