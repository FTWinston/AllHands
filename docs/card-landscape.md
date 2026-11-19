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
| Helm | Slow & Steady, Face Target, Strafe, Zig-zag × 2, Sweep, Burn, Hold Steady | Gun Platform (Hold Steady) and Slipstream (Burn) |
| Tactical | Phaser Strip × 2, Phaser Cannon, Photon Torpedo, Efficiency, High Yield, Power Cell, Acquire Lock | Gun Line (Power Cell) and Alpha Strike (Acquire Lock) |
| Science | Passive Scan, Antiproton Scan, Polaron Scan, Tetryon Scan, Coherent Beam Scan, Phased Burst Scan, Cross-reference, Graviton Scan | Analyst (Cross-reference) and Catalyst (Graviton Scan) |
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

Helm's job is deciding where the ship is and what it's showing the enemy.

| Style | Feel | Resource | Synergy tag | Risk |
|---|---|---|---|---|
| **Gun Platform** (reliable) | Slow, deliberate, and the other stations do better for it | none: posture | possibly `steadyPlatform` | Low evasion |
| **Slipstream** (risky) | Never stop moving; each manoeuvre feeds the next | **Momentum**, on helm | `momentum` | Lost when the ship stops or takes a hit |
| **Shadow** (technical) | Fly relative to another ship, not to a point | none: relative position | none yet | Needs the other ship to behave |

### Gun Platform (built)

| Card | Kind | Effect |
|---|---|---|
| Lock On | Manoeuvre | For 8s, keep turning to face the closest hostile ship, without moving. |
| Hold Steady | Posture | Stay put for 6s with no evasion. Tactical's weapons are more accurate while it lasts. |
| Broadside | Manoeuvre | Move slowly to a location while turning side-on to the direction of travel. |
| Brace | Posture | Stay put for 4s: hits on the hull do half damage. |

Existing cards that fit: Slow & Steady, Face Target, Strafe, Full Reverse. (A slow, quiet "Creep" move was considered, but it's Slow & Steady again.)

### Slipstream (built)

Momentum is gained by starting a manoeuvre within 2s of the last one ending. It's all lost when the ship has been still for longer than that, and one level is lost whenever the ship is hit. Each level makes manoeuvres a little faster.

| Card | Kind | Effect |
|---|---|---|
| Burn | Builder | A fast straight move. +2 Momentum. |
| Slingshot | Builder | A fast curve through 180 degrees. +1 Momentum, and good evasion. |
| Hard Brake | Payoff | Stop. Spend all Momentum: evasion per level for 5s. |
| Flyby | Payoff | A straight pass whose speed and evasion both grow with Momentum. Spends half of it. |
| Evasive Pattern | Posture | Jink in place for 5s: high evasion, but tactical's weapons are less accurate. |

Existing cards that fit: Zig-zag, Sweep.

### Shadow (built)

| Card | Effect |
|---|---|
| Orbit | For 10s, circle the target at the current range, keeping one side to it. |
| Match Course | For 8s, hold your position relative to the target, moving as it moves. |
| Interpose | For 8s, hold the point between a friendly ship and the hostile ship nearest it. |
| Shadow | For 8s, stay just behind the target, facing it. |
| Break Away | Turn directly away from the target and burn away from it. Builds Momentum. |

These are ship-targeted cards: dragging one over a hexagon on the helm map picks the nearest eligible ship to it (hostile, friendly or any, as the card says) and highlights it before the card is dropped, and the server checks the choice again. All of these are built. Like Lock On, they re-plan the ship's motion every moment while they last.

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

Existing cards that fit: Photonic Cannon, High Yield, tactical's Overcharge, Full Spread, High Intensity. Helm's Lock On and Hold Steady are what make this style work.

### Saboteur

| Card | Kind | Status | Effect |
|---|---|---|---|
| Tractor Beam | Weapon | built | *Energised* and *Rechargeable*: loads fully charged, and once fired holds the target while its charge runs down (about 8s from full). The target's manoeuvre is cut short and its manoeuvres heavily slowed, and yours a little. Tactical can keep it up by dropping cards on its meter. The held ship breaks free if it starts a manoeuvre while its helm has more power than the holder's tactical; every card in its helm's hand is marked *Caught* while it's held. Helm can't see whether it would break free, but science can. |
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

The particle effects are the ones scan cards leave on a system: Antiproton Residue, Tetryon Saturation, Chroniton Saturation, Polaron Bombardment and Graviton Drag.

| Card | Kind | Effect |
|---|---|---|
| Graviton Scan | Builder | A scan card: revealing a system slows the target ship's manoeuvres for 10s. |
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
| Helm: Gun Platform | Tactical: Alpha Strike | Lock On keeps the target in arc while Lock builds, and Hold Steady makes the volley land. |
| Helm: Slipstream | Tactical: Gun Line | Wide arcs and cheap shots suit a ship that never stops. |
| Engineer: Reserve | Tactical: Alpha Strike | Discharge on tactical pays for the cards the volley needs. |
| Engineer: Redline | Helm: Slipstream | Both are living on borrowed time, and Hot Start keeps manoeuvres coming. |
| Science: Catalyst | Tactical: Saboteur | Exploit counts the particles science has left behind, and Graviton Scan and Tractor Beam both slow the same ship. |
| Science: Analyst | Helm: Gun Platform | Predictive Model covers the evasion that Hold Steady gives up. |
| Science: Ghost | Engineer: Reserve | Passive Listen and Run Quiet are the same plan. |
