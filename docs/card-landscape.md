# Card landscape

The deck styles each crew station can be built towards, and the cards that belong to each. A companion to section 5 of `encounter-design.md`: that says what cards are for, this says what shapes a deck can take. Names are still open to change.

## How to read this

- A **style** is a way of playing a station that a deck can lean into, not a separate deck. Cards from two styles can share a deck, but each style's payoff cards only pay when enough of its builders are there too.
- Each station has three styles: one **reliable** (steady value, few ways to go wrong), one **risky** (a bigger payoff with a way to lose it), and one **technical** (strong in the right situation, and usually the one that leans on another station).
- Most styles are built around a **resource**: a levelled status effect that builder cards raise and payoff cards spend. Resources are named so they can be said aloud ("I've got three Charge on tactical").
- Each card's **synergy tags** (its engine definition's `synergy`) follow its style: builders provide the style's tag and payoffs want it, so a work order for one offers the other. Work orders only match cards of the same station, so cross-station pairs (below) are left to the crew to find.
- **Rarity** sets how often a shop offers a card and its price (common 15, uncommon 25, rare 40 antimatter; a rare card is offered a quarter as often as a common one). Builders stay common, a style's payoffs are uncommon, and only game-changing cards are rare (Extreme Measures, Relocate System, Alpha Strike, Photonic Cannon, Coherent Chroniton Scan). Uncommon and rare cards are marked with one or two diamonds.
- Existing cards are listed under the style they already fit, so the starter deck can stay mostly neutral and the shop and rewards can pull a deck one way.
- Status: **built** cards exist in `content/systems/`; **planned** ones don't yet.

A station's starter deck should hold the neutral cards plus one builder from each of two styles, so that the first shop visit is already a choice of direction.

## Starting decks

Each station starts with 8 cards, and a system's maximum health is its card count, so this also sets each station's durability. A card can be sold back at a station for 10 antimatter, down to a floor of 6 cards (`minDeckSize`), so each station can trim 2 of its starting cards. Each deck is staples plus one builder from each of two styles.

| Station | Deck | Styles |
|---|---|---|
| Helm | Slow & Steady, Face Target, Strafe, Zig-zag × 2, Sweep, Burn, Lock On | Gun Platform (Lock On) and Slipstream (Burn) |
| Tactical | Phaser Strip × 2, Phaser Cannon, Photon Torpedo, Efficiency, High Yield, Power Cell, Acquire Lock | Gun Line (Power Cell) and Alpha Strike (Acquire Lock) |
| Science | Passive Scan, Antiproton Scan, Polaron Scan, Tetryon Scan, Coherent Beam Scan, Phased Burst Scan, Cross-reference, Phased Chroniton Scan | Analyst (Cross-reference) and Catalyst (Phased Chroniton Scan) |
| Engineer | Jury-rig, Purge, Focus Shields, Swap Systems, Priority Feed, Trickle Charge, Redline, Run Quiet | Reserve (Trickle Charge, Run Quiet) and Redline (Redline) |

## Engineer

The engineer's job is deciding which system gets to be good right now. The systems sit in a grid two wide and three tall, so a column (three systems) is a bigger deal than a row (two).

| Style | Feel | Resource | Synergy tag | Risk |
|---|---|---|---|---|
| **Reserve** (reliable) | Bank power in quiet moments, release it when it matters | **Charge**, on a system | `charge` | Low: Charge sits until it's used |
| **Redline** (risky) | Run systems past their limit and manage the consequences | **Flux**, on a system | `flux` | Three Flux damages a card in that system |
| **Rewire** (technical) | Make the layout of the systems itself do the work | none: position | none yet | Set-up time, and enemy effects that move tiles |

### Reserve (built)

| Card | Kind | Effect |
|---|---|---|
| Trickle Charge | Builder | +1 Charge on a system. |
| Bank Power | Builder | The system runs 2 power lower for 20s. When that ends, it gains 2 Charge. |
| Run Quiet (existing) | Builder | Also gains 1 Charge every 10s while the system runs quiet. |
| Discharge | Payoff | Spend all of a system's Charge: +1 power per level for 10s. |
| Surge Draw | Payoff | Spend all of a system's Charge: it draws a card per level. |
| Buffer | Payoff | The next hit that would damage one of the system's cards spends a Charge instead. |

Aux Power is not part of this style: it's a free, expendable card that the reactor deals, and it gives power now rather than storing it. Shunt moves Charge sideways along with every other effect.

### Redline (built)

| Card | Kind | Effect |
|---|---|---|
| Redline | Builder | +2 power on a system until removed, and +1 Flux every 5s. Play again to stop. |
| Hot Start | Builder | The system draws 2 cards now, and gains 1 Flux. |
| Vent | Release | Remove all Flux from every system. Shields are down for 3s. |
| Coolant Flush | Release | Move a system's Flux to the hull, where it can still overload a hull card. |
| Burnout | Payoff | Spend all of a system's Flux: +2 power per level for 8s, then the system resets. |

Flux at 3 damages a random card in that system and drops back to 0. The engineer once had an Overcharge that did the same job and shared a name with tactical's, so it's gone: the Fever Ship encounter gives its infected engineer three Redlines instead, which the AI never plays, so the hand is the tell. Divert All Power, Reset and Purge fit here.

### Rewire (built)

| Card | Kind | Effect |
|---|---|---|
| Rail Feed | Payoff, built | Every system in the target's column gets +1 power for 20s. |
| Bus Link | Payoff | For 20s, the lower of a system and its horizontal neighbour is raised to the other's power level, as it was when played. |
| Daisy Chain | Payoff | Copy a system's positive effects to the system below it (not Charge, which would make Charge from nothing). |
| Ground Out | Release | Move a system's negative effects to the hull. Any the hull can't carry are lost. |

Existing cards that fit: Swap Systems, Relocate System, Shunt, Distribute Power, Draw Power, Focus Shields.

### Extreme Measures (built)

A rare, expensive choice card, outside the three styles, for when things have gone badly wrong:

| Option | Effect |
|---|---|
| Auto-destruct | Deals a Confirm Auto-destruct card to each of the other three crew. Once two have confirmed, a 15s countdown starts, with an Abort card dealt to the engineer; if fewer than two confirm within 30s, it lapses. If the countdown runs out, the ship explodes, badly damaging every ship nearby, and is destroyed. |
| Cannibalise | Damage every card in a system, and get a Graft card that fully repairs as many damaged cards in another system. |
| Emergency Power | Every system gets +3 power for 12s, then 2 Flux. |

### Any style

| Card | Status | Effect |
|---|---|---|
| Priority Feed | built | The target system draws a card now. |
| Jury-rig | built | Stabilise a damaged card in the target system. |

## Helm

Helm's job is deciding where the ship is and what it's showing the enemy. Slow & Steady (turn, then fly straight) is the baseline: every other location card moves while turning, or takes a route of its own. Only one card offers a left/right choice (Sweep); Evasive Maneuvers offers three set patterns.

| Style | Feel | Resource | Synergy tag | Risk |
|---|---|---|---|---|
| **Gun Platform** (reliable) | Deliberate, and the other stations do better for it | none: posture | `steadyPlatform` | Low evasion |
| **Slipstream** (risky) | Never stop moving; each manoeuvre feeds the next | **Momentum**, on helm | `momentum` | Bleeds away when the ship sits still, and with each hit |
| **Shadow** (technical) | Fly relative to another ship, not to a point | none: relative position | none yet | Needs the other ship to behave |

### Gun Platform

| Card | Effect |
|---|---|
| Slow & Steady | Turn towards a point, then fly straight to it. |
| Back Away | Turn away from a point, then reverse slowly to it. |
| Face Target | Turn to face a point without moving. |
| Strafe | Move a short way without turning. |
| Lock On | Pick a hostile ship: stop, and keep facing it for 8s. Weapons are more accurate meanwhile. |
| Broadside | A brisk move that swings side-on halfway (towards the nearest hostile) and straightens up by the end, sweeping the guns across whatever is beside the path. |

### Slipstream

Momentum is gained by starting a manoeuvre soon after the last one ended. A ship sitting still loses a level every 1.5s, and a hit knocks one off. Each level makes manoeuvres faster and the ship harder to hit, and counts towards helm's power when breaking free of a tractor beam. Helm sees its Momentum on the helm screen.

| Card | Kind | Effect |
|---|---|---|
| Burn | Builder | A fast straight move. +2 Momentum. |
| Zig-Zag | Route | Wide swings from side to side towards a point, facing it. Longer moves have more legs, not wider ones. |
| Sweep | Route | Curve anticlockwise or clockwise to a point, turning early, with a short final leg. |
| Feint | Route | Set off at an angle, then cut back sharply to the point. High evasion. |
| Punch It | Payoff | A straight move whose speed and evasion grow with Momentum. Spends half of it. |
| Drift | Payoff | Cut the engines: slide on the way the ship is moving, further with more Momentum, while turning to face a point. Spends all of it. |
| Hairpin | Payoff | Uncommon. Whip round a tight half circle, away from the nearest hostile, and fly back the way the ship was facing: further, and harder to hit, with more Momentum. Spends all of it. |
| Juke | Payoff | Spend 2 Momentum on a sharp sidestep away from the nearest hostile. Every ship aiming at this one loses its aim. |
| Overdrive | Route | Rare. The fastest straight move there is, but it puts 2 Flux on the helm system for engineer to deal with. |

### Evasive Maneuvers

A choice of three set patterns, Alpha, Beta and Gamma, each about 5s long with curves and sharp turns, ending in a known place and facing. High evasion while flying them, but the ship's own weapons are less accurate. It sits outside the three styles.

### Shadow

These are ship-targeted cards: dragging one over a hexagon on the helm map picks the nearest eligible ship to it and highlights it before the card is dropped, and the server checks the choice again. They re-plan the ship's motion every moment while they last.

| Card | Effect |
|---|---|
| Orbit | For 10s, circle the target at the current range, side-on to it. Gains Momentum as it goes. |
| Circle Strafe | Rare. For 8s, circle the target while facing it. |
| Interpose | For 8s, hold the point between a friendly ship and the hostile ship nearest it. Shots at the friendly ship hit you instead while you're in the way. |
| Shadow | For 8s, stay just behind the target, facing it. While you're in its rear arc, its evasion doesn't count against your weapons. |
| Slingshot | Whip round the target at close range and back out. +2 Momentum. |
| Attack Run | Fly fast at the target and stop short of it. Tactical has extra power meanwhile. |

Brace moved to engineer, as Brace for Impact. Hard Brake, Hold Steady (merged into Lock On), Match Course, Evasive Pattern and Break Away were cut: Momentum now helps break a tractor beam instead, and Juke took Break Away's loss of aim.

## Tactical

Tactical's job is deciding what gets shot, with what, and when. Ships have two weapon slots, and holding a target in a firing arc for long takes a good helmsman, so nothing here depends on that.

| Style | Feel | Resource | Synergy tag | Risk |
|---|---|---|---|---|
| **Gun Line** (reliable) | Keep weapons loaded and firing; win on tempo | weapon charge | `weaponCharge` | Low damage per shot |
| **Alpha Strike** (risky) | Build towards one volley that ends it | **Lock**, on tactical | `lock` | Lock fades, and the volley empties both weapons |
| **Saboteur** (technical) | Shots that leave something behind on the target | effects on the target | none yet | Little damage of its own: needs someone to exploit it |

### Gun Line (built)

| Card | Kind | Effect |
|---|---|---|
| Power Cell | Builder | Does little when played (a weapon gains 1 charge), but is worth 5 when spent as charge. |
| Hot Swap | Utility | Take all the charge from the other weapon. |
| Steady Fire | Payoff | A weapon modifier: each shot from this weapon makes its next 5% more accurate, up to 20%. |

Existing cards that fit: Phaser Strip, Efficiency, Extended Use, Sub-Critical, Rechargeable, Rapid Fire. Bleed Off (eject a weapon and pass its charge on) was cut: with two slots, it's Hot Swap the other way round.

### Alpha Strike (built)

Lock is held against one target ship. It's lost when another ship is locked, or the target is destroyed or lost from sensors, and each level fades 8s after Lock was last gained.

| Card | Kind | Effect |
|---|---|---|
| Acquire Lock | Builder | +1 Lock on a ship. Each level makes every shot at it more accurate. |
| Alpha Strike | Payoff | Fire every weapon that can fire at the locked ship at once. Spend all Lock: each level adds damage. The weapons that fired are emptied. |
| Hold Fire | Builder | For 6s, weapons can't fire. When it ends, +2 Lock on the locked ship. |
| Called Shot | Payoff | Spend 3 Lock: for the next shot at the locked ship (within 10s), every one of its systems can be aimed at, whether or not science has found it. |

Existing cards that fit: Photonic Cannon, High Yield, tactical's Overcharge, Full Spread, High Intensity. Helm's Lock On is what makes this style work.

### Saboteur

| Card | Kind | Status | Effect |
|---|---|---|---|
| Tractor Beam | Weapon | built | *Energised* and *Rechargeable*: loads fully charged, and once fired holds the target while its charge runs down (about 8s from full). The target's manoeuvre is cut short and its manoeuvres heavily slowed, and yours a little. Tactical can keep it up by dropping cards on its meter. The held ship breaks free if it starts a manoeuvre while its helm's power plus its Momentum is more than the holder's tactical power; every card in its helm's hand is marked *Caught* while it's held. Helm can't see whether it would break free, but science can. |
| Exploit | Modifier | built | More damage for each negative effect on the system an aimed shot hits. |
| Plasma Warhead | Modifier | built | A torpedo gains *persistent*, and does less damage on impact. |
| Proximity Fuse | Modifier | built | A torpedo gains *area*, and is more accurate. |
| Phase Shift | Modifier | built | An energy weapon gains *penetrating*, and costs more charge per use. |
| Disabling Shot | Modifier | built | The weapon's hits damage the system they land on, but not the hull. |
| Siege Lance | Weapon | built | A rare, heavy *cumbersome* energy weapon: it must hold its aim on a target for 2s before it can fire, unless helm is holding steady. |

Every weapon trait now does something. A *cumbersome* weapon can only fire once the target has been in its arc and range for 2s, unless helm is holding steady. A weapon that's *Rechargeable* can be charged any number of times; one that's *Energised* loads fully charged and can't take a modifier. Existing cards that fit: Ionic Surge, Precision Focus, Flare.

## Science

Science's job is knowing things first, and turning what it knows into an opening.

| Style | Feel | Resource | Synergy tag | Risk |
|---|---|---|---|---|
| **Analyst** (reliable) | Every scan teaches something that can be spent later | **Insight**, on science | `insight` | Low: Insight is kept between targets |
| **Catalyst** (risky) | Soak one system in particles, then set them off | particle effects on the target | `particles` | Particles decay, and the payoff uses them all up |
| **Ghost** (technical) | Control who can see what | none: sensor posture | none yet | Loud cards draw fire; quiet ones are slow |

### Analyst (built)

Insight is gained whenever science reveals a system (+1), reads a hand (+1) or finds a vulnerability (+2), up to 5.

| Card | Kind | Effect |
|---|---|---|
| Deep Scan | Builder | A scan card: revealing a system also reads its hand. |
| Eureka | Payoff | Spend 3 Insight: find a vulnerability on the system being scanned. |
| Predictive Model | Payoff | Spend 2 Insight: the scanned ship's shots are less accurate for 8s. |
| Cross-reference | Builder | A scan card: +1 extra Insight for revealing a system that has been revealed before. |
| Firing Solution | Payoff | Spend 2 Insight: tactical gets an expendable card that makes one weapon's next shot 40% more accurate. |
| Plotted Course | Payoff | Spend 2 Insight, with a ship scanned: helm gets an expendable, fast, high-evasion manoeuvre. |

Existing cards that fit: Passive Scan, Coherent Beam Scan, Inverted Pulse Scan, Phased Burst Scan.

### Catalyst (built)

The particle effects are the ones that scan cards and the deflector leave on a system: Antiproton Residue, Tetryon Saturation, Chroniton Saturation, Polaron Bombardment, Graviton Drag and Chroniton Echo.

| Card | Kind | Effect |
|---|---|---|
| Phased Chroniton Scan | Builder | A scan card: revealing a system leaves a Chroniton Echo on it, a particle effect that starts the time over on every particle effect on the system after 5s, unless it's cut short first. |
| Half-life | Builder | For 15s, particle effects on the system being scanned don't run down. |
| Saturate | Builder | Double the level of the strongest particle effect on the system being scanned. |
| Catalyse | Payoff | Remove every particle effect from the system being scanned. It takes damage for each one removed. |
| Cross-reaction | Payoff | If the system being scanned has two different particle effects, it loses all power for 4s. |

Existing cards that fit: the four substance scans, Inverted Antiproton Scan, Coherent Tetryon Scan.

### Ghost (built)

| Card | Kind | Effect |
|---|---|---|
| Active Ping | Loud | Reveal every system on the target at once. For 10s, every hostile ship in range knows where this ship is, even beyond its sensors, and the AI chases it. |
| Passive Listen | Quiet | A scan card that reveals its system after 3s, sends nothing out, and works while running quiet. |
| Jam | Loud | For 10s, other ships' scans of this ship fail. |
| Sensor Ghost | Quiet | Leave a decoy where the ship is for 15s: hostile AI ships nearby head for it instead of the ship. It doesn't fool a human crew; a convincing ghost would need a new kind of object that can be targeted, scanned and shot. |

### The deflector (built)

The deflector is science's finisher in every style. Rather than eighty separate effects, each of its three parts has a meaning, and one resolver puts them together (the numbers are in `deflectorParts.shared.ts`):

- **Substance is what it does.** Antiproton: damage taken. Tetryon: shields and accuracy. Chroniton: card draws. Polaron: power. Graviton: movement.
- **Delivery is its shape.** Beam: one system, strongly. Pulse: every system of one ship, weakly. Burst: everything near this ship. Field: an oval zone left around the target, which keeps affecting ships inside it for a while.
- **Modifier is its twist.** Modulated: as it is. Phased: ignores shields (the others are weakened by up to half by the target's shields). Coherent: lasts longer. Inverted: the opposite effect, on friendly ships.

## Across stations

A few, not many: about a third of a deck should be better when someone else acts (see `encounter-design.md`), and most of that should come from styles meeting, not from cards that name another station. All are built except All Hands.

| Card | Station | Style | Effect |
|---|---|---|---|
| Priority Feed | Engineer | any | The target system draws a card now. |
| Fabricate | Engineer | Reserve | Put an expendable copy of the top card of a system's deck into that station's hand. |
| Firing Solution | Science | Analyst | Tactical gets an expendable accuracy card (above). |
| Plotted Course | Science | Analyst | Helm gets an expendable, fast, high-evasion manoeuvre (aimed by helm, rather than flying automatically to the scanned ship's blind side). |
| Attack Run | Helm | Slipstream | While this manoeuvre lasts, tactical's cards cost 1 less. |
| Tracer Round | Tactical | Saboteur | A weapon modifier: a hit reveals that system to science, with no scan card. |
| All Hands | everyone | none | Planned. An expendable card dealt to each station. If all four are played within 5s, something big happens. Auto-destruct's Confirm cards show cards can be dealt across stations like this. |

### Where styles meet

| One station's style | Another's | Why |
|---|---|---|
| Helm: Gun Platform | Tactical: Alpha Strike | Lock On keeps the target in arc while Lock builds, and its accuracy makes the volley land. |
| Helm: Slipstream | Tactical: Gun Line | Wide arcs and cheap shots suit a ship that never stops. |
| Engineer: Reserve | Tactical: Alpha Strike | Discharge on tactical pays for the cards the volley needs. |
| Engineer: Redline | Helm: Slipstream | Both are living on borrowed time, and Hot Start keeps manoeuvres coming. |
| Science: Catalyst | Tactical: Saboteur | Exploit counts the particles science has left behind, and Phased Chroniton Scan keeps them there for longer. |
| Science: Analyst | Helm: Gun Platform | Predictive Model covers the evasion that Lock On gives up. |
| Science: Ghost | Engineer: Reserve | Passive Listen and Run Quiet are the same plan. |
