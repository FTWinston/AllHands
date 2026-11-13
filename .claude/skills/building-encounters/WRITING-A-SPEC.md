# Writing an encounter spec

A spec has the same parts as those in `docs/encounter-specs-2.md`, in the same order: the header table, the idea, factions, new engine pieces, ships and timeline, rules, what each station has with the captain's call, hails, expected talk, the elite form with its legacy, tuning, tests, and **Check first**.

Do step 2 of the skill while writing it, all three passes. The specs written without the second pass, the cheapest win, each lost their captain's call in the build: Quiet Running to a plan that needed no reading, Last Shuttle Out to shields that soaked two loads where it had budgeted nine hits.

## What a spec has left out before

Each of these made a builder guess:

- **Every ship's whole design**, reactor included. The reactor sets how fast it draws, and so whether it's a threat at all. Give each system's deck, not only the interesting one.
- **Every ending.** For each way it can end: the moment it's decided, what each ship then does, and which line is said. Include the endings nobody intends, such as the thing being protected destroyed by the crew.
- **Where two rules meet**, which wins: a system put out twice, an answer that changes while it's being acted on, a ship that's fleeing when its side stands down.
- **Lines, one by one:** which are urgent, which queue, and what a ship is called as against what it's called when it speaks.
- **Anything "random":** from what, and whether two random things may come out the same. For a cycle, write out one whole turn of it.
- **A new card:** what it costs the ship that plays it, whether it works on another player ship, and whether shops sell it.
- **What the crew can see at the start.** Anything more than about 30 units away is on nobody's screen.

## Check first

Each thing the design depends on that was read in the code and not run. The build's step 2 starts from this list, so a thing left off it is a thing found late.

Every behaviour the spec gives a ship goes on it, unless a test has already watched the AI do it. So does every row of a table of tells. Fever Ship's list had one of its four tells on it, and three of the four were wrong.
