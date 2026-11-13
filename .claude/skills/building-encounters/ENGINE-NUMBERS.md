# Engine numbers for encounter work

What a spec's numbers come to in the engine, how AI ships behave, and what each seat can see. Every value is tuning and will drift: the file named beside it is the truth, so read it before leaning on a number. One line per fact. The story of how each was found is in the specs' "As built" sections.

## Damage and health

- **Health is a card count.** A system's health is how many of its cards are undamaged, and the hull's is the same (`SystemState`). A ship is destroyed when its hull reaches 0. Expendable cards, such as Aux Power, aren't counted.
- **A hit that gets through damages that many cards.** Phaser strip 10, phaser cannon 20, photon torpedo 40, photonic cannon and quantum torpedo 60 (`cardDefinitions.ts`). A harrier's hull is 5 cards. So shields are the health bar, and what's under them is one or two hits.
- **An aimed shot** puts 60% (rounded up) on the system aimed at and the rest on the hull. **An unaimed one** picks from all six systems at random: if that's the hull, all of it goes there, and otherwise it splits the same way (`Ship.damage`). Both use up the same random number, so aiming doesn't change what a seed does after it.
- **To make something survive stray hits**, pad its hull with `hullBare`. The customs platform has 60.
- **Cards are damaged in a random order**, picked when the ship is built, whatever order the design lists them in, with cards in a slot last. A damaged emitter takes its 15 off the shield capacity, and listing bare hull first doesn't protect it: only the share of emitters does.
- **A system at 0 health does nothing.** It can't play, load or charge a card. A tactical system at 0 can't fire what it had loaded. A ship whose helm is at 0 slows to a stop within a second.
- **A damaged weapon comes out of its slot**, losing its charge and modifier, as if ejected. Slotted cards go last, so a tactical system put out has nothing left loaded but an expendable copy.
- **A repaired card is damaged for good the next time**, so a system put out, repaired and put out again stays out.
- **A torpedo kills through shields that are up.** At hull power 3 the crew's shields let 8 of its 40 through, and an unaimed one puts all of that on the 12-card hull one time in six: two such and the ship is gone.

## Shields

`shieldStats.ts`, `hullShields.ts`, `HullState.ts`.

- Capacity is 15 for each undamaged `hullShieldEmitter`, 45 for a `hullVolatileEmitter`. The player ship has 120.
- They absorb a share of each hit, set by **hull power**: 60% at 1, rising 10 points a level to all of it at 5, and nothing at 0. The rest gets through even while they're up.
- What they absorb drains them: by all of it at power 1, down to 60% of it at 5. An emitter, as it's drawn, sets them to reinforced, which cuts that by a quarter for 12 seconds.
- A hit that leaves them under 10% of capacity collapses them.
- Tuned against the weapon's type, the hit is cut by 40% first. A tuning lasts 12 seconds, set by hull cards as they're drawn, or by `hullState.tuneShields(...)`.
- **They don't recharge during an encounter**, and there's no event for them reaching 0: poll in `tick`.
- Extended shields scale what gets through by the covering ship's own copy of the system aimed at.

## Power

- A system's baseline power is how many of its `reactorPower<System>` cards the reactor deck holds. The player ship has 3 everywhere. The most is 5.
- **A card's cost is a level, not a price.** It can be played if its system's power is at least its cost, and playing it doesn't lower the power. "Costs more than the station normally has" means 4 or 5.
- **A ship stops if its helm's power falls below the cost of the manoeuvre it's flying.** Speed doesn't otherwise change with power.
- `adjustPowerLevel` keeps an underlying value, so a boost and a cut can overlap and each come off cleanly.
- **Aux Power is only ever on one system.** Playing it takes it off whichever system had it, so it can't get two systems over their usual power at once.
- **Effects are taken off when an encounter ends, and on a full repair, each undoing what it did** as if it had worn off (`EngineerSystemTile.clearEffects`): nothing moves elsewhere, and a reactor breach doesn't go off. A reactor card damaged for good takes its level off again afterwards.
- **Timed effects only wear off in the ships' own tick** (`state.tick`), never in the campaign's, and the campaign ticks after the ships in each game tick: anything an encounter sets every tick is what every phone sees.

## Pace

How often things happen, which no table of amounts shows. It can only be measured: for every armed ship, seconds to its first shot, and shield taken off an idle crew per minute.

- The reactor plays one of its cards every 8, 4, 2, 1, 0.5 or 0.25 seconds, at reactor power 0 to 5 (`ReactorState`). Each card played makes its own system draw one. So a system draws once per pass through the reactor deck for each of its cards in it.
- **Adding reactor cards raises a system's power and its draw rate together.** To raise power alone, use `adjustPowerLevel` once the ship is built.
- A weapon needs its own card, then enough other weapon cards spent on it to reach its `totalCharge`, before its first shot. A cannon's load is four shots, fired within about four seconds.
- **For a hunter, the approach sets its first shot, not the charging.** It gets a helm card about every 13 seconds, so from 30 units it first fires 40 to 50 seconds after it spawns.
- **A flare launched while one burns restarts its 8 seconds**, so two back to back burn for 16: count what a crew can do with every copy it could hold at once.
- Each of the crew's four systems gets a card about every 6 seconds. Tactical's 12-card starting deck has one phaser cannon and one photon torpedo: first cannon shot about 30 seconds in, and the torpedo about once a minute.

## Movement and space

- The player ships start each encounter at the origin, facing along the x axis. Starboard is positive y.
- **Angles are counter-clockwise with y pointing down** (`vectors.ts`: `getAngle` is `-atan2(dy, dx)`). A point at bearing `b` and distance `d` is `x + cos(b) * d, y - sin(b) * d`, and a positive turn is to port. Copy `SlowBoatEncounter.spawnHarrier`. `polarToCartesian` has the other sign.
- **A ship's speed isn't constant.** Motion between two keyframes eases in and out, peaking at about one and a half times its average. Slow and Steady averages about 0.75 units a second and has no maximum distance, so an AI ship on a route plays one card to the next waypoint however far it is: about 5 units in its first 20 seconds. Zig-zag and Sweep go forward at about 1 a second.
- Weapon ranges: phaser strip 6, phaser cannon 10, photonic cannon and quantum torpedo 15, photon torpedo 20 (25 with Extended Range). Arcs are half-angles in radians: strip 3, cannon 1, the rest 0.5.
- A ship knows of everything within 100 units. There's no hiding by distance.
- **The crew sees about 30 units.** Anything further is outside the viewscreen and helm's map, fully zoomed out.

## AI ships

`Commander.ts`, `ai/types.ts`, `AiShip.ts`, `ai/officers/`.

**Goals**

- `search-and-destroy` (with an optional `prefer`), `defend-position`, `guard-ship`, `travel-route`. `commander.setGoal(...)` gives new orders, and `standDown()` has one ship hold and stop shooting until `rally()`. To stop a whole faction, change the relationship.
- **`defend-position`** ignores hostiles outside its radius. Use 30, which is past every weapon.
- **`guard-ship`** only goes for hostiles within 30 of its ward. Once it has one, it leaves its ward and holds off at its own weapon's range.
- **A hunter whose preferred ship has gone hunts the nearest hostile**, which is usually the crew.
- **Target choice:** 100 minus distance, plus 30 for the preferred ship, plus noise. A ship only switches to a target scoring 1.25 times its current one, which at encounter distances is almost never.
- **Ships flying identical routes fly them in step**, which shows which are on a script. Vary the legs.

**Who it shoots**

- Only what its faction is hostile to. A faction that says nothing about the player is neutral: it won't shoot the crew, the crew can still shoot it, and it draws in the neutral colour.
- **On taking a target, its commander goes for the hull half the time** (`HULL_FOCUS_CHANCE`), firing plain shots, which land on a system picked at random. Otherwise its tactical officer aims at a system once its science has identified one: tactical first, then helm. It keeps to that while the target lasts, and an exposed vulnerability comes first either way.

**What it plays**

- Only cards with an `aiEvaluator` in `getEngineCardDefinition.ts`, and having one doesn't mean it works. Watch it in a test.
- **A modifier's evaluator doesn't check the weapon it's for.** Give a ship only modifiers that fit the weapons it carries.
- **It unloads a weapon it can't use**, 8 to 15 seconds after every slot is loaded and charged, none can reach the target, and one in hand could (`TacticalOfficer`). Until then a cannon holds its slot: a pylon with two cannons and two torpedoes in one slot fired at a crew 15 away about every 100 seconds, against every 45 with torpedoes alone.
- **Charging spends other weapon cards from the hand**, so a design with as many slots as weapon cards loads them all and never fires.
- **Its science officer scans only to reveal a system**, and stops once it has found all four. Scan cards that mark what they reveal land in the first minute and then stop.
- **Its engineer only plays a power card when another officer has asked for power**, which happens when that officer holds a card it can't afford.
- **Its engineer repairs for free, every second**, once a system is a fifth damaged, from a capacity of 50. To stop repairs alone, set `engineerState.repairCapacity` and `maxRepairCapacity` to 0. `priorities: { engineer: 0 }` stops its cards as well.
- **An officer with priority 0 never acts.** All four at 0 is an inert ship, which stands in for an object (`inertTemplate` in `shipDesigns.ts`).
- Read a card's effect definition as well as its card definition. Overcharge damages what it boosts.

**Skill** (0 to 1, default 0.8)

- Below 1, target scores get noise of up to 30 × (1 − skill), and the commander skips up to half its updates. Officers do the same with their own choices.

**Fleeing and leaving**

- It flees below `fleeThreshold` of hull (0.25 unless the design says, 0 for never), and **comes back** once its engineer has repaired it to twice that. `withdraw()` is permanent until `rally()`. `standFast()` stops it fleeing.
- A fleeing ship departs after 3 seconds at least 30 units from every hostile it knows: about 23 seconds for a harrier, 33 for a bulwark.
- **A ship whose helm is out can't leave.** If giving up is meant to count as gone, count `isWithdrawing`, not removal.

## What each seat can see

The channels a clue can travel by. If a fact isn't in one of these, the seat can't see it.

| Seat | Sees | Where |
|---|---|---|
| Science | One system of one ship at a time, after finding which of four shuffled scan slots it is: its power, and what it's doing now. Helm: the manoeuvre under way. Tactical: each weapon slot's card, charge and modifier. Science: the loaded deflector. **Engineer: every system's power and health at once** | `Scanned*Info` |
| Science, for a second scan card | That system's hand, live, until they scan anything else. Or a vulnerability. One card buys one | `Scanned*Info.hand` (null until read) |
| Science and tactical | The scanned ship's hull: health, shield, capacity, tuning. It follows whichever ship science scanned last | `Ship.scannedHull` |
| Tactical | Every object but its own ship as a target, friendly ones included, in the order they were spawned. The systems science has identified, as sub-targets, which stay known | `TacticalState.subTargetsByTarget` |
| Engineer | Every status effect on its own ship's systems, by name. Each system's power, health, hand and deck | `EngineerSystemTile` |
| Helm | Where everything within view is, and which way it faces | `GameObject.motion` |
| Viewscreen | The same picture, shots and who fired them, the objective line, hails, questions | `GameState` |

Nobody sees another ship's decks, its status effects, or its goal.

An encounter that changes a ship's hand does it through `SystemState`'s methods (`addCardToHand`, `removeCard`, `discard`), so that a hand being read shows the change.

## Comms

- A hail is up for 2.5 seconds plus 55 ms a character, in real time (`HailInfo.ts`): about ten seconds for three sentences. An urgent one can cut an ordinary one short after 3 seconds.
- A question's time limit is game time, never less than its own reading time. Only one can be open.
