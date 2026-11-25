# Sector map plan

How to make the choice of route between encounters worth making. A companion to section 7 of `encounter-design.md` (building a sector out of encounters) and `card-rewards.md` (salvage and shops, which the route decides).

## Decided

- **Keep the Slay the Spire–style map.** Encounters are the main course. The map's job is a quick, real decision the whole crew talks through, not a second game.
- **No transit minigames,** whether a helm maze, a short hazard encounter on the way, or anything else played between nodes. One player would act while three watch, or it would need balancing as a four-player game of its own. A failed reflex test lands on one player in a way a lost card fight doesn't. It would run on every jump, 6–8 times a sector, and test reflexes on a phone in a game played with cards.
- **No FTL-style branching** ("you pick up two signals"). It removes the split between map and encounter, but loses planning ahead, which is half of what the map is for.
- **What makes the map feel cut off isn't the lack of action.** It's that nothing chosen on the map shows up later. The fixes below are about making choices visible and making them matter, in that order.

## Phase 1: every fork offers visibly different things (now)

The generator already tries hard to avoid meaningless choices (`resolveMeaninglessChoices` in `SectorGenerator.ts`), but it compares routes only by the kind of each node: regular fight, elite, or which shop. That misses what the crew actually sees.

### The problems

- **Every regular fight looks the same to the generator.** The map shows requests ("Clinic ship *Marrow*: escort request"), but the generator's futures reduce every one to `c`. A fork between two different requests counts as no choice unless something further on differs.
- **Nodes side by side can be the same encounter.** `createNode` picks each node's encounter on its own, so a node can offer two or three links to the same request. Sector 1's early pool has only four entries (three placeholders and Toll Collectors) for layers 1–3, so this is common.
- **Shops side by side can be the same kind.** `pickShopStationKind` only *prefers* a different kind from shops alongside (a cost of 10). Avoiding a repeat further along the route costs 100, so that wins.

### The fix

1. **Measure first.** Add a test that generates a few hundred sectors from each registered theme and counts forks where two of the options look the same on the map: the same encounter, or the same kind of shop. Log the share, and keep it as a regression check once it reaches zero.
2. **Pick encounters after the graph is settled,** in a pass of their own instead of inside `createNode`. For each regular or elite node, pick from its layer's pool, still weighted by how often an encounter is listed, but:
   - **never** an encounter already chosen for a node that shares a parent with it, so no fork offers the same request twice;
   - **preferably not** one already on any route through it, so a route doesn't meet the same request twice;
   - falling back to repeats only when the pool runs out. With `maxRouteChoices` at 3, any pool of three or more can always keep siblings apart.
3. **Make the sibling rule for shops a hard rule too.** Two links from one node never lead to the same kind of shop. Avoiding a repeat along the route stays a preference.
4. **Leave the kind-level dominance check as it is.** It keeps forks structurally different (an elite here, a shop there), and the new rules add on top that the options right in front of the crew always differ.

The sector 1 pool fills up as encounters land, and placeholders drop out, so this improves by itself over time. These rules make sure the pool that exists is used well.

### Later, if cheap: a choice between kinds of problem

`encounter-design.md` wants a route to be "a choice between kinds of problem". Once enough encounters exist, tag each encounter definition with its question type (Prioritise, Protect, Diagnose and so on) and prefer siblings with different types. That's a weighting in the same pass, so it can wait until the pool is big enough for it to matter.

## Phase 2: each station sees something of its own (maybe)

Science already reads the next destinations on long range sensors. The fiction carries further: the sensor data goes over the ship's network, and each console makes sense of it for its own job. But the viewscreen already shows the map to everyone, so a station's view only helps if it adds something the viewscreen doesn't show, and if it gives that player a reason to argue for a route.

Candidates, roughly in order of how much talk they'd prompt for their cost:

- **"What's in it for me":** each phone marks the routes that pass that station's shop, and how far away it is. It needs no new data, and turns every player into an advocate ("my shop's two jumps down the top route"). But it only repeats what the map shows, so it's weak if the crew already reads the map well.
- **Tactical: threat assessment.** A rough sense of what's armed and how heavily, at each destination. Encounters would need to supply a summary that doesn't spoil their twist, which is real work per encounter.
- **Engineer: system effects.** Only worth having once environments do something (phase 3): "Nebula ahead: shield recharge reduced."

**Next step:** play a few sectors after phase 1 and listen to the route discussion. If the crew already argues over routes, skip this phase. If the three non-science players are quiet on the map, start with "what's in it for me".

## Phase 3: hazards on nodes (after the encounters)

Nodes already have an `environment` (deep space, asteroid field, nebula, gas giant). Science shows it, but `Encounter.ts` notes that it's "purely informational". That's the natural place for hazards: on the node, where the crew can see them, not on the links between nodes.

Don't start until there are ideas good enough to be worth building. Each hazard should:

- **change what a station does,** not just shift a number ("tactical can't target beyond short range" over "10% less damage");
- **be readable from the map,** before the route is chosen;
- **let encounters opt out** where a hazard would break the question they ask;
- **give a reason to take it,** such as better salvage or a shortcut to a shop. Otherwise the crew will just avoid it.

This is also where helm bonuses fit cheaply: a helm card or ship trait that ignores or lessens an environment's effect ("Nebula pilot"). It feeds deck-building and ship choice without a minigame or a change to the map's structure.

## Parked: cards that change the route

Revealing the next layer, jumping two layers, or adding a link would need the generator redesigned. Every route visits one node per layer, and station and elite spacing rely on that. Not worth doing until phases 1 and 3 are in and the map is known to need more.

## Open questions

- **Should an elite and a regular form of the same encounter count as the same option?** It's a real risk-and-reward choice, but it reads as a repeat on the map. To start with, treat them as the same and keep them apart.
- **Should a route be allowed to meet the same encounter twice** when the pool is small? "Repeat visits" in `encounter-design.md` randomises answers so a repeat still needs talking through, so a preference rather than a rule seems right.
