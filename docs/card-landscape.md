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
| Coolant Flush | Release, planned | Move a system's Flux to the hull. |
| Burnout | Payoff, planned | Spend all of a system's Flux: +2 power per level for 8s, then the system resets. |

Flux at 3 damages a random card in that system and drops back to 0. The engineer's Overcharge overlaps Redline, and shares a name with tactical's Overcharge, but it stays for now: the Fever Ship encounter is built around it (three Overcharges in the infected engineer's hand are the tell). Divert All Power, Reset and Purge fit here.

### Rewire

| Card | Kind | Effect |
|---|---|---|
| Rail Feed | Payoff, built | Every system in the target's column gets +1 power for 20s. |
| Bus Link | Payoff, planned | A system and its horizontal neighbour both run at the higher of their two power levels for 20s. |
| Daisy Chain | Payoff, planned | Copy a system's positive effects to the system below it. |
| Ground Out | Release, planned | Move a system's negative effects to the hull. |

Existing cards that fit: Swap Systems, Relocate System, Shunt, Distribute Power, Draw Power, Focus Shields.

### Extreme Measures (built)

A rare, expensive choice card, outside the three styles, for when things have gone badly wrong:

| Option | Effect |
|---|---|
| Auto-destruct | A 15s countdown, with an Abort card dealt to the engineer. If it runs out, the ship explodes, badly damaging every ship nearby, and is destroyed. |
| Cannibalise | Damage every card in a system, and get a Graft card that fully repairs as many damaged cards in another system. |
| Emergency Power | Every system gets +3 power for 12s, then 2 Flux. |

### Any style

| Card | Status | Effect |
|---|---|---|
| Priority Feed | built | The target system draws a card now. |
| Jury-rig | planned | Stabilise a damaged card in the target system. |

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

### Shadow (planned)

| Card | Effect |
|---|---|
| Orbit | Circle the target at the current range, keeping one side to it. |
| Match Course | Stay alongside the target, moving as it moves. |
| Interpose | Move to, and hold, the point between a friendly ship and its attacker. |
| Shadow | Get into the target's rear arc and stay there. |
| Break Away | Leave the target at speed, directly away from it. |

These need a new card target type, a ship. On the helm map, dragging one of these cards over a hexagon would pick the nearest eligible ship to it, and show which ship that is while dragging, before it's dropped. Lock On's tracking (re-planning the motion every moment) is the engine half of the same problem.

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
| Steady Fire | Payoff, planned | A weapon modifier: each shot from this weapon makes its next one slightly more accurate. |

Existing cards that fit: Phaser Strip, Efficiency, Extended Use, Sub-Critical, Rechargeable, Rapid Fire. Bleed Off (eject a weapon and pass its charge on) was cut: with two slots, it's Hot Swap the other way round.

### Alpha Strike (built)

Lock is held against one target ship. It's lost when another ship is locked, or the target is destroyed or lost from sensors, and each level fades 8s after Lock was last gained.

| Card | Kind | Effect |
|---|---|---|
| Acquire Lock | Builder | +1 Lock on a ship. Each level makes every shot at it more accurate. |
| Alpha Strike | Payoff | Fire every weapon that can fire at the locked ship at once. Spend all Lock: each level adds damage. The weapons that fired are emptied. |
| Hold Fire | Builder, planned | For 6s, weapons can't fire. When it ends, +2 Lock on the locked ship. |
| Called Shot | Payoff, planned | Spend 3 Lock: the next shot lands on a system of your choice. Needs a way to pick any system on a target. |

Existing cards that fit: Photonic Cannon, High Yield, tactical's Overcharge, Full Spread, High Intensity. Helm's Lock On and Hold Steady are what make this style work.

### Saboteur

| Card | Kind | Status | Effect |
|---|---|---|---|
| Tractor Beam | Played on a ship | built | For 8s, while within range: the target's manoeuvre is cut short and its manoeuvres are heavily slowed. Your own ship is slowed a little too. |
| Exploit | Modifier | built | More damage for each negative effect on the system an aimed shot hits. |
| Plasma Warhead | Modifier | blocked | A torpedo gains *persistent*, and does less damage on impact. |
| Proximity Fuse | Modifier | blocked | A torpedo gains *area*, and is more accurate. |
| Phase Shift | Modifier | blocked | An energy weapon gains *penetrating*, and costs more charge per use. |
| Disabling Shot | Modifier | planned | Damages the target system's cards, but not the hull. |

The blocked cards wait on the weapon traits themselves: `persistent`, `area`, `penetrating`, `draining`, `dampening`, `disabling`, `disrupting` and `cumbersome` are declared but do nothing yet (`applyWeaponTrait.ts`). Existing cards that fit: Ionic Surge, Precision Focus, Flare.

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
| Cross-reference | Builder, planned | A scan card: +1 extra Insight for revealing a system that has been revealed before. |
| Firing Solution | Payoff, planned | Spend 2 Insight: tactical gets an expendable card that makes one weapon's next shot much more accurate. |

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

### Ghost (planned)

| Card | Kind | Effect |
|---|---|---|
| Active Ping | Loud | Reveal every system on the target at once. Every hostile ship in range learns where this ship is. |
| Passive Listen | Quiet | A scan card that's slow to reveal, but can't be noticed, and works while running quiet. |
| Jam | Loud | For 10s, scans of this ship fail. |
| Sensor Ghost | Quiet | Leave a false contact at a location for 15s. |

### The deflector (planned)

The deflector is science's finisher in every style, and none of its eighty combinations does anything yet. Rather than eighty effects, give each of its three parts a meaning:

- **Substance is what it does.** Antiproton: damage taken. Tetryon: shields and accuracy. Chroniton: card draws and cooldowns. Polaron: power. Graviton: movement.
- **Delivery is its shape.** Beam: one system, strongly. Pulse: every system of one ship, weakly. Burst: everything near this ship. Field: a zone that lingers.
- **Modifier is its twist.** Modulated: as it is. Phased: ignores shields. Coherent: lasts longer. Inverted: the opposite effect, on friendly ships.

## Across stations

A few, not many: about a third of a deck should be better when someone else acts (see `encounter-design.md`), and most of that should come from styles meeting, not from cards that name another station. None of these are built yet, apart from those that are already part of a style above.

| Card | Station | Style | Effect |
|---|---|---|---|
| Priority Feed | Engineer | any | The target system draws a card now. (built) |
| Fabricate | Engineer | Reserve | Put an expendable copy of the top card of a system's deck into that station's hand. |
| Firing Solution | Science | Analyst | Tactical gets an expendable accuracy card (above). |
| Plotted Course | Science | Analyst | Helm gets an expendable, high-evasion manoeuvre towards the scanned ship's blind side. |
| Attack Run | Helm | Slipstream | While this manoeuvre lasts, tactical's cards cost 1 less. |
| Tracer Round | Tactical | Saboteur | A weapon modifier: a hit reveals that system to science, with no scan card. |
| All Hands | everyone | none | An expendable card dealt to each station. If all four are played within 5s, something big happens. |

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
