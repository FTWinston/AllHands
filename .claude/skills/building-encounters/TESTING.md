# Testing an encounter

Three kinds of test, then a run in the real game. Run npm scripts through Bash: under PowerShell `npm run test:unit -- --run` loses its `--`.

## Unit tests

`<Name>Encounter.test.ts`, beside the class. Copy the setup from `SlowBoatEncounter.test.ts`: `setupGameRoom()`, a seeded random, `startCampaign`, then `campaign.devLoadEncounter(id, elite)`.

Only the campaign is ticked (`state.currentTime += n; campaign.tick(0)`), so nothing moves or shoots by itself. The test puts things where it needs them:

- Move a ship by rewriting its motion.
- Set shields through the hull tile.
- When the AI has to notice something, call `commander.update` thirty times, as a commander below skill 1 skips some. If the thing it's to notice has only just spawned, give it one `state.tick` first: that's what updates what each ship knows of.
- `listenToHails` returns what was said over a stretch of time. It misses a line that goes up on the very tick that caused it: read `state.hail` for those. Lines queue behind the briefing, so let the opening lines be heard in the setup, or `state.hail` will still be showing one of them.
- Timed effects only wear off in `state.tick`. In a test that only ticks the campaign, take them off by hand.
- To get one particular random answer, give the encounter a public method that sets it (Standing Orders has `keyTo`), or reload until it comes up.

## Behaviour tests

With the unit tests, but run with `state.tick`, so the real AI plays. One for each thing the spec says a ship does. Standing Orders' "the platform turns, stays put and fires" is the pattern.

## Measurements

`<Name>Encounter.balance.test.ts`, run with `npm run test:balance -- --run`. A scripted crew follows one plan, the real AI plays everything else, and the test asserts how it comes out. `deadWeight/DeadWeightEncounter.balance.test.ts` has a harness worth copying: `follow`, `shoot` and `torpedoOnce` behaviours passed to a `run`. `QuietRunningEncounter.balance.test.ts` adds a log of every hit, and reaches the running encounter through `campaign.activeEncounter`.

The traps, each of which has cost a build a quarter of an hour or produced a false finding:

- **One campaign per test.** `rooms.createState()` returns the same room for the whole test, so a second campaign adds a second player ship and the numbers go quietly wrong. Play each plan and seed as its own `it.each` case. To compare plans, have each case put its result in a shared map and assert on the map in a later test. Calling `campaign.devLoadEncounter` again within one test is safe.
- **Build a crew's behaviours fresh for each run.** They keep counters. One made at module level and reused never fires after its first run.
- **Move the crew at the speed its cards give**, a keyframe at a time. A crew jumped to a new position every tick is never where the AI aimed.
- **Five seeds at least.** Three have given opposite answers about the same choice, and a "usually" measured on three is a coin toss.
- **A destroyed crew makes `state.encounter` null.** Check for that before reading its outcome.
- **Vitest hides console output from passing tests.** Write to a file: `process.env.ENCOUNTER_LOG ?? path.join(os.tmpdir(), '<name>.log')`.
- **The scripted crew always hits, and always knows where to look.** Say so in "Measured": the numbers are a ceiling.

## In the real game

Nothing is served until Start is pressed in the app's own window, so there's a script beside this file. From the repository root:

```bash
npm run build:devtools
```

```bash
node .claude/skills/building-encounters/run-encounter.cjs "Dead Weight" --out <an empty folder in the scratchpad>
```

Add `--elite` for the elite form. It starts a game, joins four crew pages, loads the encounter from the dev tools by the name they list it under, and saves a screenshot of the viewscreen and of each phone, with each screen's text. Set `--at` to the seconds when this encounter's own events happen (`--at 3,22,108`): the default of 3, 12 and 40 misses anything later.

Read the screenshots and the text files:

- the briefing, and the objective line;
- each kept card, in the hand it's meant for;
- each ship where the spec puts it, in the colour the crew should read it as, with a label that doesn't sit on another's;
- the order ships come in on tactical's and science's target lists, which is the order they were spawned. One spawned apart from the rest stands out.

Nobody plays it, so it shows that things arrive, not that they work, and it shows nothing past whatever the crew has to do first: for a boss, only its first phase. It doesn't move the ship or zoom, so anything more than about 30 units from where the crew starts is out of every view: say so under "Still to check". It closes the app when it's done. If it's interrupted, kill the process tree whose pid is in the output folder (`taskkill /T /F /PID <pid>`).
