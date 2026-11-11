# Encounter design plan

How to design All Hands' encounters, the opposition in them, and the player cards that go with them. Every name in here is a placeholder to react to.

## 1. What's settled

- **Objective first.** Each encounter has one goal that isn't "destroy everything". Hostiles are pressure. Destroying them is optional, and sometimes a way to make the goal easier.
- **Fail forward.** Failing the objective with the ship intact continues the run with no reward. Only losing the ship ends it. A few rare encounters are graded instead of pass/fail.
- **Always four stations, sometimes a captain.** Four people, one per station, so encounters can require something from every station and split information four ways. A fifth player can be captain, with no screen of their own: they see the viewscreen and hear the crew. Nothing in the game changes for them, so no encounter may need one, but every encounter should leave one a job (see section 3).
- **No global factions.** Who is hostile to whom is declared by each encounter. The same group can be an opponent in one encounter and an ally in the next.
- **One concrete class per encounter**, extending a base class.
- **Two to five minutes per encounter**, and about half an hour per sector.
- **Tactical answers hails; helm moves the ship.** Any decision the crew is asked for is answered on tactical's phone. Leaving is always helm's Warp Away.
- **Only elites carry forward.** An elite's outcome changes something later in the sector. Ordinary encounters are self-contained.
- **Difficulty is mostly time.** Higher levels run the game clock faster, with a few rule changes layered on that don't need encounters written per level (see section 8).
- **The real aim is talk.** The setting, encounters and cards exist to make the crew speak to each other, without the game saying so.

## 2. Setting

### Premise

The Concordance ran this part of the galaxy for centuries, then stopped: no final war, the centre simply ceased answering. What's left is its infrastructure (gates, relays, defence platforms, debt ledgers) and the people who lived under it, getting on with things.

The crew work for a small mutual-aid outfit (name undecided; see open questions). It has one decent ship, a Concordance cutter that somebody "forgot to hand back", and it goes where it's asked. Its skill is making old imperial technology do something useful for once.

That last point carries the theme. Most of the harm in this setting comes from the empire's machinery still running, and the crew's ship is part of that machinery. They aren't outsiders bringing order. They're cleaning up a mess their own ship belongs to.

### House rules that keep it out of saviour territory

1. **Invited, never self-appointed.** Every encounter starts with someone asking for a specific thing. The briefing names who asked and what for.
2. **Locals have the plan; the crew have a ship.** The people being helped supply the knowledge and the solution. The crew supply a capability that's missing: speed, shields, a deflector dish. Mechanically, the ally always does something essential on its own (the station's engineers fix the reactor, you buy them four minutes).
3. **Villains are defined by what they do, not who they are.** Opposition is institutions, interests and machines. No species or culture is an enemy, and no group is hostile in every encounter it appears in.
4. **Nobody is primitive.** Nobody needs civilising, teaching or uplifting. People lack parts, power, time or safe passage.
5. **Locals own the ending.** Outro text has the people you helped deciding what happens next. The crew leave.
6. **Jokes point at the crew and the dead empire.** The ship is held together with tape, the Concordance's bureaucracy outlived it, and the crew are slightly out of their depth. Never at the people being helped.

### The cast

Groups an encounter can draw on. None is a global faction: each encounter says how the groups present relate to each other and to the crew.

| Group | What it is | How it behaves | How it stops being a problem |
|---|---|---|---|
| **Standing Orders** | Concordance automation still executing its last instruction: customs gates, quarantine blockades, minefields, debt-collection drones | Rule-bound and predictable. Never malicious. Its rules can be learned | Shut down, satisfied, or redirected. Locals often want the hardware intact |
| **The Wardens** | Remnant garrison officers who believe they're keeping order in "protectorates" | Disciplined, formations, strong shields, by the book | Withdraw when the cost exceeds their orders. Some defect, and turn up later as allies |
| **The Receivership** | A firm legally "liquidating" imperial assets, including the water plants and relays that communities depend on | Tugs and cutters with hired escorts. Ignores you until you threaten the invoice | Leaves when the job stops being profitable |
| **The Stranded** | Unpaid conscripts and haulers stuck out here in patched-up ships, raiding to eat | Hit and run. Flee early | Driven off, or given a better option. Frequent allies |
| **Locals** | Settlements, hauler unions, clinic ships, relay keepers. Many groups, never one bloc | Busy, competent, sometimes at odds with each other | Not a problem. Usually the client, sometimes a bystander |
| **The neighbourhood** | Storms, debris cascades, failing reactors, gravity wells | Indifferent | Outlasted or routed around. Some encounters have no hostiles at all |

### Arc across three sectors

- **Sector 1, the Shallows.** The periphery. Problems are mostly Standing Orders: a gate that never reopened, a quarantine nobody lifted. Teaches the game. Thread: someone is sending the machines fresh instructions.
- **Sector 2, the Works.** The industrial belt. The Receivership is stripping it, and using its legal access to the old command network to do so. Thread: the Wardens are paying them for that access.
- **Sector 3, the Seat.** The old capital region. The Wardens mean to restart the Concordance's command network, which would wake every dormant platform at once. A coalition of locals has a way to switch it off for good. The crew's job is to hold the door while they do it.

The finale is decided by the coalition, not the crew.

### Tone

Earnest adventure with a wink: Star Trek's competence, Galaxy Quest's affection, the A-Team's plan-that-comes-together. Text is short and readable from across a room, since the briefing is on a shared viewscreen.

## 3. The method: every encounter asks a question

Design each encounter as one question put to the crew. The question decides the objective, the opposition and what failure looks like.

### Question types

| Question | The crew must | Failure looks like | Stations that carry it |
|---|---|---|---|
| **Endure** | Stay functional under sustained pressure for a set time | Ship lost, or the thing you're covering is | Engineer, helm |
| **Diagnose** | Work out a hidden rule from partial evidence, then act on it | Time runs out, or the wrong fix makes it worse | Science, then tactical |
| **Coordinate** | Land actions from several stations in the right order or window | The window closes | All four |
| **Prioritise** | Choose between demands that can't all be met | The wrong thing is lost | Tactical, engineer |
| **Reach** | Get the ship somewhere it isn't meant to be | Detected, blocked, or too slow | Helm, engineer |
| **Protect** | Keep something else alive that has its own agenda | It's destroyed or captured | Helm, tactical |
| **Restrain** | Stop something without destroying it | It dies, or it gets away | Tactical, science |

An encounter asks **one** primary question. A boss asks two or three in sequence. If you can't say which question an encounter asks, it's a slugfest in disguise.

### Talk levers

These are what actually make people speak. Every encounter should use at least two.

1. **Split information.** Each phone shows something the others can't see. The game already does this: science sees a scanned ship's systems, power and hands; tactical sees sub-targets and their aspect; engineer sees power and status effects; helm sees the flight picture. Put the pieces of an answer on different phones.
2. **Handoffs.** One station's output is another's input. Science finds a vulnerability, tactical targets it, helm holds the facing that exposes it, engineer keeps the power up for all three.
3. **Shared scarcity.** Power is one pool the engineer divides. When two stations both need 4 power, somebody has to ask, and somebody has to argue.
4. **Timing windows.** Things that only work together or in sequence within a few seconds. Countdowns get said out loud.
5. **Real trade-offs.** Two defensible options and no dominant one. Crews debate these; they execute dominant strategies in silence.
6. **A changed plan.** A mid-encounter twist that invalidates the plan and forces a second conversation.

Real time plus hidden hands already protects against one player directing everyone, since nobody can see enough to do it. Don't undermine that by putting the whole picture on the viewscreen. The viewscreen shows the situation; the phones hold the answers.

### The captain

A captain has the viewscreen and their ears, and nothing else. That makes the captain the one person at the table who can only act by talking, and it changes the shape of the conversation from four peers negotiating to reports going up and decisions coming down. Both have to work, so:

- **No encounter needs a captain.** With four players the stations make the same decisions between themselves. Never put a decision somewhere only a captain could make it.
- **Every encounter has a captain's call.** At least one decision that no single station has the information to make alone: which target first, whether to take the offer, when to give up on the objective and leave. With five players the captain makes it. With four it's the argument. These are the "real trade-offs" lever, so it costs nothing extra.
- **The viewscreen is the captain's console.** It shows the situation and the stakes: where everything is, what's been asked, what the other side just said. It never shows an answer. A captain who can read the solution off the viewscreen stops asking the crew for it.
- **Hails are addressed to the captain, answered by tactical.** The offer appears on the viewscreen, the captain decides, tactical presses the button. An order followed by an action is a handoff.
- **A captain can't quarterback**, because they hold no information. Everything they know, somebody chose to tell them. That's the healthy version of one person coordinating, so encounters can lean on it.
- **Status should be heard, not read.** If an ally's condition matters, have the ally say so in a hail ("*Marrow*: we're venting on deck two") or make science scan for it. A health bar on the viewscreen answers the captain's question before they can ask it.

### The talk test

Before building an encounter, write the lines you expect to hear across the table. Write them once for four players:

> **Science:** "Its port emitter's live. Fifteen seconds."
> **Helm:** "I need two more power to get round there."
> **Engineer:** "Taking it from tactical. Tactical, you're dark for ten."
> **Tactical:** "Fine, but I've a torpedo half-loaded, so make it quick."

and check that a captain would have something to add:

> **Captain:** "Science, what's it tuned against?"
> **Science:** "Torpedoes, for another ten seconds."
> **Captain:** "Tactical, phasers only. Helm, keep us out of its forward arc until that drops."

If you can't write four lines involving at least three stations, the encounter isn't asking a question yet. If the captain's lines are only repeating what a station already said, the encounter has no captain's call.

Then run the **silent test** in playtesting: if four people can beat the encounter without speaking, it has failed, however good the fight was.

### Encounter sheet

One of these per encounter, before any code.

```
Name:
Question:            (one of the seven)
Request line:        (what the map shows: who's calling, and about what)
Who asked, and for what:
What they're doing themselves:
Cast and relationships:   (who is hostile / neutral / friendly to whom)
Objective:           (what the viewscreen says)
Success / failure:   (or the grading scale)
Ways hostiles leave: (flee, stand down, shut down, destroyed)
Each station:        helm sees / does
                     tactical sees / does
                     science sees / does
                     engineer sees / does
Talk levers used:    (at least two)
Captain's call:      (the decision no single station can make alone)
Expected table talk: (four lines, plus the captain's)
Hails:               (what each side says on arrival and on leaving)
Twist:               (optional)
Elite version:       (a harder form of the same question)
Elite legacy:        (what success and failure change later in the sector)
Timings:             (all in game time, so the difficulty clock scales them)
Cards it wishes existed:
Needs from the engine:
```

### Checklist

- Does every station have something only it can do?
- Is some piece of the answer visible to exactly one station?
- Can it be won without destroying every hostile? Does every hostile have a way to leave other than exploding?
- Does the ally do something essential itself?
- Does failure leave the ship alive and the run going?
- Would a crew that's seen it before still have to talk? (Randomise the answer, never the question.)
- Does it work with four, and is there a captain's call for five?
- Does the viewscreen show the situation without showing the answer?
- Is it two to five minutes long at normal speed, and still physically playable at the fastest clock?

## 4. Designing the opposition

### An enemy is a behaviour, a tell and a two-station counter

AI ships play the same card system the crew does, so **an enemy's decks are its personality**, and a science scan reads them. That makes every enemy a small diagnosis puzzle for free. Design each one as:

- **Behaviour:** what it wants and how it moves.
- **Tell:** how the crew can know what it's about to do, and which station sees it.
- **Counter:** needs two stations, never one.
- **Exit:** how it leaves the fight short of destruction.

Replace the current scout / fighter / heavy / flagship roles (which differ mainly in size) with named designs that differ in behaviour:

| Design | Behaviour | Tell | Counter | Exit |
|---|---|---|---|---|
| **Harrier** | Fast passes at the weakest target, then away | Scan shows its helm hand: a run-in card means a pass is coming | Helm interposes, tactical fires as it commits | Flees at 40% hull (today's scout) |
| **Picket** | Holds a position, engages inside a radius | Doesn't move. Its arc is visible | Helm finds the blind side, engineer runs quiet | Ignores anything outside its radius |
| **Tug** | Tows the objective away, doesn't fight | A tow line, and engines at full power | Science paints engines, tactical disables them precisely | Cuts the line and leaves once crippled |
| **Bulwark** | Slow, cycles shield modes, hits hard | Scan shows the next hull cards, so the next shield mode | Science calls the mode, tactical loads the weapon type it isn't tuned for | Withdraws once shields are stripped |
| **Jammer** | Stays at range, puts status effects on your systems | Engineer sees the effects arrive. Science sees which scan card it's holding | Engineer purges, helm closes the range | Runs when anything gets close |
| **Drone cloud** | Many flimsy units from a controller | Controller's reactor spikes before each launch | Area weapons for the drones, or go for the controller | Controller shut down ends all of them |
| **Platform** | Static, heavily shielded, rule-following | Its rule is discoverable (see "Standing Orders" below) | Whatever the rule is | Shut down, not destroyed |

### Rules of thumb

- **No damage sponges.** If the only thing between the crew and success is a hit-point total, cut the total and add a rule.
- **Two or three enemy designs per encounter at most**, and introduce each on its own before combining it.
- **Elite means a twist on the question**, not an extra heavy cruiser. The elite escort has a second convoy ship going the other way. The elite platform changes its rule halfway.
- **Skill belongs to the encounter**, not a faction. The per-faction skill multiplier goes; each encounter sets how sharp its opposition is.
- **Appearance means behaviour.** A ship's shape should tell the crew what design it is, whoever is flying it. That's worth more than a shape per faction.
- **Opposition gets a voice.** One line on the viewscreen when it arrives and one when it leaves ("Not worth the invoice. Cutting the line."). It's the cheapest way to make stand-downs feel like wins.

### Things that aren't ships

Objective-first encounters need objects to be objectives: platforms, gates, relays, mines, shuttles, a module under tow, a zone to reach or hold. Several examples below need one, and it's the biggest content gap after non-hostile ships.

## 5. Player cards

### Principles

1. **A starter deck should make the job legible.** Ten or so cards that teach what the station is for, with the placeholder cards gone.
2. **About a third of each deck should be better when someone else acts.** Setups and payoffs that cross stations are the card-level version of a handoff. A card that's strongest alone teaches silence.
3. **Cards should create information for another station**, not just effects. "Reveals the target's next hull card to tactical" starts a conversation. "+10% damage" doesn't.
4. **Objectives need verbs that aren't damage.** If the only things the crew can do are move, shoot, scan and reroute power, every objective collapses back into a fight. Each station needs two or three objective verbs.
5. **Names you can shout.** "Zig-zag!" works. Card names are the crew's shared vocabulary, so keep them short and distinct across stations. Two cards called Overcharge (tactical's and engineer's, today) will cause a wrong call at the worst moment.
6. **Costs are a conversation.** A card costing more power than its station normally has is a request to the engineer. Make the best cards slightly unaffordable.

### Cross-station pairs

Build these deliberately. Some exist already.

| Setup | Payoff |
|---|---|
| Science: scan that raises hit chance on a system (Coherent Tetryon Scan) | Tactical: Precision Focus on that system |
| Science: finds a vulnerability | Tactical: targets it. Helm: holds the aspect that exposes it |
| Helm: steady broadside pass | Tactical: slow, cumbersome weapons that need held aim |
| Engineer: Divert Tactical | Tactical: Overcharge volley |
| Tactical: suppressing fire (new) | Helm: a close pass that would otherwise be too dangerous |
| Engineer: Focus Shields on one system | Helm: presents that side to the enemy |
| Science: calls the enemy's shield mode | Tactical: loads the other weapon type |

### New verbs, by station

| Station | Verbs to add | Used by |
|---|---|---|
| **Helm** | Interpose (hold position between two things), Match Course (stay alongside a moving ally), Dock, Tow, Run Silent approach | Protect, Reach |
| **Tactical** | Warning Shot (forces a flee check), Disabling Shot (system damage, no hull damage), Point Defence (shoot down torpedoes aimed at someone else), Cut Line | Restrain, Protect |
| **Science** | Scan Object (non-ship), Trace Signal, Decode, Jam, Hail | Diagnose, Reach |
| **Engineer** | Extend Shields over an ally, Transfer Power to an ally, Run Quiet (cap total power, lower signature), Jury-rig (repair someone else) | Protect, Endure, Reach |

The deflector cards deserve a special mention. A three-part combination (modifier, substance, delivery) is a ready-made answer format for Diagnose questions: an encounter can require one specific combination and hand each part's clue to a different station.

### Encounter cards

The card system already has `priority`, `unplayable` and `expendable` traits, and effects that add cards to a hand. Let encounters put cards into the crew's hands as part of the objective:

- A **priority** "Evacuees Aboard" card that clogs the engineer's hand until the ship reaches the drop point.
- An **expendable** "Shutdown Key" dealt to each station, which only works if all four are played within five seconds.
- An **unplayable** "Tow Strain" card in helm's hand for as long as the line is attached.

This puts the objective on the phones, where the crew's attention already is. `Encounter.keepInHand` already keeps a card in one station's hand for a whole encounter (Slow Boat's Extend Shields, Standing Orders' scan kit). A card that only works alongside other stations' cards, like the Shutdown Key, would be new.

### Rewards

Succeeding should pay in something from the people helped: a card for the station that mattered most, on top of antimatter. Failing pays nothing. Each encounter sheet's "cards it wishes existed" line feeds the reward and shop pools, so the card set grows out of encounter design instead of in isolation.

## 6. Worked examples

Eight encounters, covering every question type, one graded encounter, one boss, and one honest slugfest.

### Toll Collectors (Prioritise): the slugfest that still asks something

- **Who asked:** A hauler union. A Warden cruiser and two escorts are charging "transit duty" at a jump point.
- **Objective:** Clear the jump point. Destroy or drive off all three.
- **The question:** Which first? Break the cruiser's shields and it withdraws, taking its escorts with it, but that means sitting under its guns with two escorts on you. Peel the escorts first and it's safer and slower. Destroy the cruiser outright and the escorts stop guarding and hunt you with nothing to lose.
- **Stations:** Science scans the cruiser's hull and calls what its shields are tuned against. Tactical loads the other weapon type and chooses the target. Helm keeps the cruiser's heavy arc off the ship. Engineer feeds whoever's turn it is.
- **Talk:** "Kill the escorts first or they'll swarm us." / "It's tuned for torpedoes. Phasers, now, while it lasts."
- **Exits:** Escorts flee at 40%. The cruiser withdraws once its shields are stripped.
- **Elite:** A second cruiser arrives two minutes in, unless the first has already left.
- **Engine:** Today's `EscortEncounter` plus ships that can leave. Specced in full in [encounter-specs.md](encounter-specs.md).

### Slow Boat (Protect)

- **Who asked:** The clinic ship *Marrow*, crossing an asteroid field with a full ward. Stranded harriers want its medical stores.
- **What they're doing themselves:** Flying it, and running their own point defence, which works on one side at a time.
- **Objective:** *Marrow* reaches the far jump point.
- **Stations:** Helm matches course and interposes. Tactical drives harriers off (they flee at 40%, so finishing them is a waste of shots). Science reads harrier helm hands to call which one is about to make a run. Engineer extends shields over *Marrow* and has to choose between that and the ship's own.
- **Talk:** "Second one's lining up on her stern." / "*Marrow*'s covering port, so we take starboard."
- **Twist:** *Marrow* calls its own turns to dodge rocks. Helm has to follow, not lead.
- **Fail:** *Marrow* is lost or boarded. No reward.
- **Elite:** The harriers' leader hails with an offer: a third of *Marrow*'s stores and they leave. Tactical answers it, against a timer.
- **Engine:** A friendly AI ship with a travel goal; a protect objective; Extend Shields.

### Standing Orders (Diagnose)

- **Who asked:** A settlement whose supply run has sat at a Concordance customs platform for three weeks. It impounds anything that crosses the line and shoots anything that objects.
- **What they're doing themselves:** A dock clerk has found the platform's manual, and reads out its rule in the briefing: the platform stands down for a correctly formatted inspection signal.
- **Objective:** Shut the platform down. Destroying it fails, since the settlement wants the dock.
- **The rule (randomised each run):** The signal is one deflector combination, and the platform only listens once its shields are down. Scanning the platform's science system gives the substance. The modifier shows as a status effect that lands on the ship's own systems whenever the platform pings it, and only the engineer sees that. The delivery is whatever the platform is firing, which anyone watching the viewscreen can see, so with a captain aboard it's the captain's clue.
- **Stations:** Three seats each hold one third of the answer. Tactical strips the shields without going on to wreck the platform. Helm has to hold the ship inside the platform's ping range (which is inside its firing range) long enough to collect everything. Science assembles and fires the combination.
- **Talk:** "I've got tetryon." / "It's only firing torpedoes, so that's pulse?" / "Something called Inverted Ping just landed on helm."
- **Wrong answer:** The platform escalates and launches a drone cloud.
- **Elite:** The rule changes after the first correct part.
- **Engine:** Static platform object; a shutdown objective; ping effect.

### Dead Weight (Restrain)

- **Who asked:** A habitat ring. The Receivership has "repossessed" its water reclamation module and a tug is hauling it out, with two hired escorts.
- **Objective:** Stop the tow with the module intact.
- **Stations:** Science paints the tug's engines. Tactical disables them with precise, low-yield shots: area weapons and torpedoes spill onto the module. Helm sits in the tug's stern arc, which is exactly where the escorts are guarding. Engineer keeps shields focused aft.
- **Talk:** "Don't fire the spread, the module's right there." / "I can't hold this angle with two of them on me."
- **Exits:** With its engines out, or both escorts gone, the tug cuts the line and leaves.
- **Fail:** Module destroyed, or towed past the edge.
- **Elite:** The module's coolant is failing. The engineer must transfer power to it while everything else is going on.
- **Engine:** Tow link between two objects; a restrain objective with a "this must survive" condition; `guard-ship` already exists.

### Last Shuttle Out (Endure, graded)

- **Who asked:** A mining station whose reactor is going. Six shuttles, one launch every forty seconds, through a debris cascade that used to be the station's own defence grid.
- **What they're doing themselves:** The whole evacuation. The station's engineers are holding the reactor together long enough to launch.
- **Objective:** Cover the shuttles. Graded on how many of the six get clear.
- **Stations:** Helm holds the ship between the debris and the launch lane, which shifts with each shuttle. Engineer extends shields and survives the drain. Tactical runs point defence on the big fragments. Science tracks which fragment is on a collision course, which nobody else can tell.
- **Talk:** "Fragment four's the real one, ignore the rest." / "Shields at a third, I need science's power."
- **Twist:** The station hails to ask whether to launch the fifth and sixth together, early. Riskier for the shuttles, but the ship can leave sooner. Tactical answers.
- **Reward:** Scales with shuttles saved. Zero saved pays nothing.
- **Engine:** Graded objective; timed launches (`SurviveEncounter` is most of the way there); debris objects.

### Quiet Running (Reach)

- **Who asked:** A relay keeper behind a Warden picket line, who needs a part. The Wardens aren't letting traffic through.
- **Objective:** Reach the relay undetected, or at least intact.
- **The mechanic:** Pickets hold position and react to power signature. Above a total power threshold, they see you. The threshold is lower the closer you pass.
- **Stations:** Engineer runs the ship under the threshold, which means telling everyone they can't have what they want. Helm plots a route through the gaps on low power. Science reads each picket's scan state to call when it's looking elsewhere. Tactical holds fire and keeps a flare ready as a decoy.
- **Talk:** "I need three to make this turn." / "You can have three for five seconds, on my mark, then it goes back."
- **Twist:** Getting spotted doesn't fail it. It turns the encounter into a run for the relay with pickets converging.
- **Elite:** One picket has defected and will cover you, but only science can work out which.
- **Engine:** Reach objective and zone; detection by power signature; `defend-position` already exists.

### Fever Ship (Diagnose and Restrain)

- **Who asked:** The hauler *Ostler*'s own crew, on a failing comm link. Their ship has taken a Standing Orders update meant for a warship. It's locked them out and is firing on everything nearby.
- **What they're doing themselves:** Cutting through to their own engine room. They need the ship to stop fighting them for two minutes.
- **Objective:** Disable *Ostler*'s corrupted system without destroying the ship.
- **The puzzle:** One of *Ostler*'s four crew systems is the infected one. Scanning each shows its hand, and the infected one holds cards the others don't. Disabling the wrong system makes the ship more erratic. Disabling the right one stops it.
- **Stations:** Science diagnoses. Tactical takes one system down without holing the hull. Helm stays in close, in the firing arc, because disabling shots are short-ranged. Engineer absorbs it.
- **Talk:** "It's not tactical, tactical looks normal. Check its science." / "Tell me which one before I shoot anything."
- **Fail:** *Ostler* destroyed.
- **Elite:** The infection moves to another system once, after the first disable.
- **Engine:** A ship that acts hostile but must survive; system-disable as a win condition.

### The Gate That Never Closed (Sector 1 boss: Diagnose, Coordinate, Endure)

- **Who asked:** Everyone in the Shallows. A Concordance quarantine gate has been sealing the sector for thirty years over an outbreak nobody remembers.
- **What they're doing themselves:** A crew of relay keepers will board the gate's control spire and lift the quarantine properly, so it stays lifted.
- **Phase 1, Diagnose:** Find which of the gate's four pylons is the master. The slaves copy its shield mode a beat late: science sees the modes, tactical sees the delay.
- **Phase 2, Coordinate:** Four expendable Shutdown Key cards, one dealt to each station, must be played within five seconds of each other while helm holds the ship in the master pylon's arc. Each key costs more power than its station normally has.
- **Phase 3, Endure:** The gate's defences wake up. Cover the boarding party's shuttle for ninety seconds while they finish.
- **Why it's the boss:** It examines the three questions Sector 1 taught, in order, with no new mechanics.
- **Engine:** Phased objectives; everything the earlier examples needed.

## 7. Building a sector out of encounters

- **Pacing.** The map has ten layers: a start station, seven in the middle with two or three shops on any route, a repair station, and the boss. So one route is four or five encounters and a boss. At two to five minutes each, with the boss at the long end, that's about twenty minutes of encounters plus stations and route choices, which lands on half an hour without changing the generator.
- **Mix.** Of a sector's non-station nodes, aim for roughly one honest fight in four. The rest each ask a different question, so a route through the map is a choice between kinds of problem.
- **The map shows requests, not question types.** Each node shows who is calling and about what: "Clinic ship *Marrow*: escort request", "Hauler Local 12: toll dispute", "Dock clerk, Tessaly Yard: impounded cargo". That's a fiction for science's long-range sensors picking up calls for help, and it tells an experienced crew the question type without the map ever naming one. Elites are **priority calls**. It also replaces the "Combat" label, which objective-first encounters have outgrown.
- **Teach, then combine.** A question type first appears alone and gently in a sector's early layers. Later layers pair it with a second pressure. The boss chains the sector's questions.
- **A sector is a pool of encounters and a thread**, not a faction. `SectorTheme` should list the encounters that can appear, and its intro and outro carry the thread.
- **Elites carry forward, and only to the boss.** Each elite defines a legacy: one thing that's different at the sector's boss if it succeeded, and optionally one if it failed. The people you helped turn up to help. The ones you failed aren't there, or the problem you left behind is. Keeping the destination fixed (the boss) keeps the content bounded: one or two lines per elite and a list for the boss to read, with no branching anywhere else.
- **Repeat visits.** Randomise each encounter's answer (which emitter, which system, which combination) so a crew that's seen it still has to talk it through.

## 8. Difficulty

### The clock

The first difficulty knob is the game clock: run everything faster and there's less real time to talk. This suits the game unusually well.

- **It attacks the right thing.** A faster clock is symmetric: the crew's cards and power arrive faster too, and enemies die as quickly as they shoot. The only thing that shrinks is real seconds per decision, which is exactly the resource the game is about.
- **It needs no content.** `GameState.timeScale` already exists and already scales the tick and `state.setTimeout`. As long as every encounter timing is written in game time, every encounter gets harder for free.
- **A captain makes it worth more.** Routing a decision through a fifth person costs real seconds, so a faster clock presses hardest on exactly the crews with the most coordination to lose.

It has two limits:

- **Hands don't scale.** Dragging a card or aiming a manoeuvre takes the same real time at any speed. Past some point the game stops testing communication and starts testing thumbs. Where that is needs playtesting; a guess is somewhere around 1.4×. `maxTimeScale` is 2 today, which is probably beyond it.
- **So it runs out of rungs.** At steps of 0.1 that's four or five levels, not twenty.

One detail: anything the crew has to read (hails, prompts) needs a minimum time on screen in real seconds, or a fast clock makes text unreadable instead of making decisions harder. The `Encounter` base class does this for every encounter: hails are timed in real seconds, and a prompt never closes before its question could be read.

### Other rungs that don't need encounters written per level

- **More nodes use their elite form.** Every encounter is already designed twice, standard and elite, and the elite is a twist on the question. A difficulty level that turns more nodes elite adds "more demands" without any new encounters. This is the answer to wanting harder content without authoring it per level.
- **Sharper opposition.** AI ships already take a `skill` from 0 to 1. A level can add to it everywhere.
- **Shorter tells.** One global multiplier on warning times, which encounters read wherever they announce something in advance.
- **A leaner economy.** Less antimatter, dearer work orders, a pre-boss repair that only half repairs.
- **Less to go on.** At high levels the map stops marking priority calls, or shows a caller without the subject.

### A ladder

Alternate clock steps with rule steps, so each level feels different from the last and the clock isn't used up early. Illustrative only:

| Level | Change |
|---|---|
| 0 | Clock 1.0× |
| 1 | Clock 1.1× |
| 2 | One more priority call per sector |
| 3 | Clock 1.2× |
| 4 | Opposition skill up |
| 5 | Tells 25% shorter |
| 6 | Clock 1.3× |
| 7 | Priority calls aren't marked on the map |
| 8 | Pre-boss station repairs half |
| 9 | Clock 1.4× |
| 10 | Every call is a priority call |

Whether the clock alone is enough for a full ascension ladder: no, but with elite forms doing the "more demands" work it doesn't have to be, and none of the above needs a dedicated encounter. Encounters written per level can wait until there's evidence the ladder needs them.

## 9. What the engine needs

In dependency order. Each step unlocks specific examples, so content and engine work can alternate.

1. **Per-encounter cast.** Remove the global `factionConfigs`, `factionId` on nodes and themes, and the per-faction appearance and skill tables. Each encounter declares its sides and their relationships and registers them when it starts. The relationship registry and the AI's "attack whatever is hostile to me" targeting already work per game, so this is mostly moving where the data lives. Enemy templates become named ship designs any encounter can use.

   ```ts
   // Sketch only
   export class SlowBoatEncounter extends Encounter {
       protected readonly sides = {
           clinic: { relations: { player: Friendly, stranded: Hostile } },
           stranded: { relations: { player: Hostile } },
       };
   }
   ```

2. **Outcomes.** `Encounter.complete()` reports success, failure or a score. `Campaign` gives no reward on failure and carries on. *Unlocks: nothing alone, but everything below depends on it.*
3. **Objectives beyond destroy and survive.** Protect, reach, restrain, shut down, graded. `ObjectiveInfo` grows to match, so the viewscreen and map can describe them. Keep the logic in each encounter class and add shared helpers only when a third encounter needs the same thing.
4. **Non-hostile ships.** Friendly and neutral AI ships with a travel goal. *Unlocks: Slow Boat.*
5. **Non-kill exits.** Withdraw and stand-down conditions alongside the existing flee. *Unlocks: Toll Collectors as written.*
6. **Objects and zones.** Static platforms, a reach or hold zone, simple debris. *Unlocks: Standing Orders, Quiet Running, Last Shuttle Out.*
7. **Links between objects.** Tow lines and "must survive" conditions. *Unlocks: Dead Weight, Fever Ship.*
8. **Encounter cards and phases.** Encounters dealing cards into hands; objectives that run in sequence. *Unlocks: the boss.*
9. **The new verb cards**, added alongside whichever encounter first needs each one.

Steps 1 to 6 are specified in detail, as far as the first three encounters need them, in [encounter-specs.md](encounter-specs.md). The other five worked examples, and what they need of steps 6 to 9, are specified in [encounter-specs-2.md](encounter-specs-2.md). Some of them changed in the speccing, where the engine doesn't do what section 6 assumed: each spec says how.

## 10. How to go about it

1. **Agree the vocabulary.** The seven questions and six levers in section 3. Change them now if they're wrong; everything else hangs off them.
2. **Pitch wide, on paper.** Twelve or so one-line pitches per sector, each naming its question. Fill in a sheet only for the ones that pass the talk test. Expect to throw half away.
3. **Build a vertical slice of three.** Toll Collectors, Slow Boat and Standing Orders: three different questions, engine steps 1 to 6, and the cheapest route to finding out whether objective-first is fun. These are specced in [encounter-specs.md](encounter-specs.md).
4. **Playtest in a room, with four and with five.** Record it and note what was said aloud and by whom. A station that stayed quiet had nothing to contribute. Run the silent test. With a captain, note every time they asked for something the viewscreen could have told them (good) and every time they didn't need to ask (the viewscreen is showing too much).
5. **Extract shared pieces after the third use**, not before. The second escort encounter can copy from the first. The third earns a helper.
6. **Grow cards out of encounters.** Each sheet names one or two cards it wishes existed. Those become rewards and shop stock.
7. **Then fill out Sector 1**: around eight encounters and the boss, before starting on Sector 2. One complete sector says more about the game than three thin ones.

The dev tools' encounter launcher already starts any registered encounter standalone, in its elite form too, which keeps the iteration loop short. The first three encounters' shared pieces are now on the `Encounter` base class (section G of [encounter-specs.md](encounter-specs.md)), so the fourth starts from there.

## 11. Open questions

- **The crew's outfit needs a name.** The Loose Ends and Second Shift didn't land. Other directions, in case one sparks something: a name that sounds like a service you ring (**the Callout**, **Roadside**), one that sounds like a co-op (**Fair Winds Mutual**, **the Common Yard**), or a nickname other people gave them (**the Tinkers**, **the Odd-Jobbers**). The ship could also carry the joke: an old Concordance recovery tender, the empire's tow truck, would explain why its best equipment is a deflector dish and a tractor beam.
- **The other names** (the Concordance, the Receivership, the Wardens, the Stranded) stay as placeholders.
- **Where's the ceiling on the clock?** Section 8 guesses 1.4×. It needs a playtest at 1.2×, 1.4× and 1.6× to find where it turns into a dexterity test.
- **How much does the viewscreen show during an encounter?** The specs assume one objective line and hails, and nothing else beyond the tactical picture. That's the captain's whole console, so it's worth deciding deliberately.
