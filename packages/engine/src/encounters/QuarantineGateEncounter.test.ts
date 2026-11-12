import { crewRoleNames, type CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { antimatterRewards } from 'common-data/features/ships/utils/antimatter';
import { distance } from 'common-data/features/space/utils/vectors';
import { sectorThemes } from 'src/campaign/sectorThemes';
import { MotionKeyframe } from 'src/state/MotionKeyframe';
import { listenToHails, seededRandom, setupGameRoom, startCampaign } from 'src/testUtils';
import { describe, expect, it, vi } from 'vitest';
import {
    boardingMs, boatLaunchDistance, boatObjective, copyDelayMs, dockRadius, droneIntervalMs, gateDistance, gateObjective, keyRange, maxDrones, modeIntervalMs,
    reseatDelayMs, secondBoatDelayMs, squareSide,
    type QuarantineGateEncounter,
} from './QuarantineGateEncounter';
import type { Position } from 'common-data/features/space/types/Position';
import type { Vector2D } from 'common-data/features/space/types/Vector2D';
import type { AiShip } from 'src/state/AiShip';
import type { GameState } from 'src/state/GameState';
import type { PlayerShip } from 'src/state/PlayerShip';
import type { HullSystemTile } from 'src/state/systems/engineer/HullSystemTile';

const rooms = setupGameRoom();

const gate = 'Quarantine Gate';
const keeperTeam = 'Keeper Team';
const briefing = 'Four pylons, one master. The other three copy its shield setting a moment late. Find the one that changes first and take its shields down. Only its shields. We need it working.';

function createRun({ seed = 3, shipCount = 1, briefed = true } = {}) {
    const state = rooms.createState(seededRandom(seed));
    const { campaign, ships } = startCampaign(state, shipCount);
    campaign.devLoadEncounter('quarantineGate');
    const encounter = campaign.activeEncounter as QuarantineGateEncounter;

    // Most tests start once the opening lines are over, so that what they listen for isn't queued behind them.
    if (briefed) {
        listenToHails(state, 30_000);
    }

    return { state, campaign, ships, ship: ships[0], encounter };
}

type Run = ReturnType<typeof createRun>;

const at = (state: GameState, object: { getPosition(time: number): Position }) => object.getPosition(state.currentTime);
const hullTile = (ship: AiShip | PlayerShip) => ship.engineerState.systems.find(tile => tile.system === 'hull') as HullSystemTile;
const copies = ({ encounter }: Run) => encounter.pylons.filter(pylon => pylon !== encounter.master);

/** Puts a ship where it's wanted, holding still. */
function place(state: GameState, ship: PlayerShip, { x, y }: Vector2D) {
    ship.setMotion(new MotionKeyframe(state.currentTime, x, y, 0));
}

/** A point this far beyond a pylon, on the line out from the middle of the square through it. */
function beyond(state: GameState, pylon: AiShip, offset: number): Vector2D {
    const p = at(state, pylon);
    const length = Math.hypot(p.x - gateDistance, p.y);
    return { x: p.x + (p.x - gateDistance) / length * offset, y: p.y + p.y / length * offset };
}

/** Moves the campaign on, without moving anything in the game. */
function wait({ state, campaign }: Run, ms: number) {
    for (let elapsed = 0; elapsed < ms; elapsed += 100) {
        state.currentTime += 100;
        campaign.tick(100);
    }
}

/** Plays the game on, AI and all. The room's timers aren't otherwise running, so those are moved on as well. */
function playOut({ state }: Run, ms: number, each?: () => void) {
    for (let elapsed = 0; elapsed < ms; elapsed += 100) {
        state.tick(100);
        for (const delayed of [...rooms.getClock().delayed]) {
            if (delayed.active) {
                delayed.tick(100);
            }
        }
        each?.();
    }
}

function takeShieldsDown(pylon: AiShip) {
    hullTile(pylon).setShield(0);
}

/** The engineer plays Key Power on each of these stations' systems, and each then turns its key. Says whether every card was played. */
function turnKeys(ship: PlayerShip, roles: readonly CrewRoleName[] = crewRoleNames): boolean {
    let played = true;
    for (const role of roles) {
        const keyPower = ship.engineerState.hand.find(card => card.type === 'keyPower');
        played &&= !!keyPower && ship.engineerState.playCard(keyPower.id, 'keyPower', 'system', role) !== null;
    }
    for (const role of roles) {
        const system = ship.getCrewSystem(role);
        const key = system.hand.find(card => card.type.startsWith('shutdownKey'));
        played &&= !!key && system.playCard(key.id, key.type, 'no-target', '') !== null;
    }
    return played;
}

/** Into the keys phase, with the ship close enough to the master for the gate to hear them. */
function toKeys(run: Run) {
    takeShieldsDown(run.encounter.master!);
    wait(run, 100);
    place(run.state, run.ship, beyond(run.state, run.encounter.master!, 5));
}

/** Through to the door, with the boat out. */
function toDoor(run: Run) {
    toKeys(run);
    turnKeys(run.ship);
    wait(run, 100);
}

/** The keys that are turned go back, as they do on their own after a few seconds of the game being played. */
function lapse(ship: PlayerShip) {
    for (const tile of ship.engineerState.systems) {
        tile.removeEffect('keyTurned', false);
    }
}

const heldKeys = (ship: PlayerShip) => crewRoleNames.flatMap(role => ship.getCrewSystem(role).hand.filter(card => card.type.startsWith('shutdownKey') || card.type === 'keyPower').map(card => card.type));

describe('QuarantineGateEncounter', () => {
    it('is Sector 1\'s boss, with no elite form, asking the crew to disable the gate', () => {
        const { state, encounter } = createRun();

        expect(sectorThemes[0].bossEncounterId).toBe('quarantineGate');
        expect(encounter.node.kind).toBe('boss');
        expect(encounter.node.elite).toBeUndefined();
        expect({ type: state.objective?.type, subject: state.objective?.subject }).toEqual(gateObjective);
    });

    it('puts four pylons at the corners of a square ahead, spawned in order round it, one of them the master', () => {
        const { state, encounter } = createRun();
        const half = squareSide / 2;

        expect(encounter.pylons.map(pylon => pylon.name)).toEqual(['Pylon One', 'Pylon Two', 'Pylon Three', 'Pylon Four']);
        expect(encounter.pylons.map(pylon => at(state, pylon)).map(({ x, y }) => ({ x, y }))).toEqual([
            { x: gateDistance - half, y: -half }, { x: gateDistance + half, y: -half }, { x: gateDistance + half, y: half }, { x: gateDistance - half, y: half },
        ]);
        expect(encounter.pylons).toContain(encounter.master);
        // The crew starts out of reach of every pylon's torpedoes.
        for (const pylon of encounter.pylons) {
            expect(distance(at(state, pylon), { x: 0, y: 0 })).toBeGreaterThan(20);
        }
    });

    it('reads the briefing first, then the gate speaks', () => {
        const run = createRun({ briefed: false });
        const heard = [run.state.hail ? { speaker: run.state.hail.speaker, text: run.state.hail.text } : null, ...listenToHails(run.state, 30_000)];

        expect(heard.slice(0, 2)).toEqual([
            { speaker: keeperTeam, text: briefing },
            { speaker: gate, text: 'QUARANTINE IN EFFECT. DAY TEN THOUSAND NINE HUNDRED AND FIFTY-EIGHT. TURN BACK.' },
        ]);
    });

    describe('finding the master', () => {
        it('the master changes its tuning within the interval, a pulse lands on each player ship as it does, and the others follow after the delay', () => {
            // From the start, as nothing but the game wears the pulse off.
            const run = createRun({ shipCount: 2, briefed: false });
            const { encounter, ships } = run;
            const master = encounter.master!;
            const before = encounter.tuningOf(master);
            const pulsed = () => ships.map(ship => ship.engineerState.systems.filter(tile => tile.hasEffect('gatePulse')).map(tile => tile.system));

            let changedAfter = 0;
            while (encounter.tuningOf(master) === before && changedAfter < modeIntervalMs.max + 1000) {
                wait(run, 100);
                changedAfter += 100;
            }

            expect(changedAfter).toBeGreaterThanOrEqual(modeIntervalMs.min);
            expect(changedAfter).toBeLessThanOrEqual(modeIntervalMs.max + 100);
            // One crew system on each ship, and only one.
            expect(pulsed().map(systems => systems.length)).toEqual([1, 1]);
            for (const [system] of pulsed()) {
                expect(crewRoleNames).toContain(system);
            }
            expect(hullTile(master).hasEffect(encounter.tuningOf(master))).toBe(true);
            for (const copy of copies(run)) {
                expect(encounter.tuningOf(copy)).toBe(before);
            }

            wait(run, copyDelayMs - 200);
            expect(copies(run).every(copy => encounter.tuningOf(copy) === before)).toBe(true);
            wait(run, 200);
            for (const copy of copies(run)) {
                expect(encounter.tuningOf(copy)).toBe(encounter.tuningOf(master));
                expect(hullTile(copy).hasEffect(encounter.tuningOf(master))).toBe(true);
            }
        });

        it('a pylon\'s tuning reads steadily through the crew\'s scan while its own hull plays its cards', () => {
            const run = createRun();
            const pylon = copies(run)[0];
            run.ship.scienceState.subscribeToSystem(pylon, 'helm');
            const readings = new Set<string | null>();

            playOut(run, 60_000, () => {
                const scanned = run.ship.scannedHull.shieldTuning;
                readings.add(scanned);
                expect(scanned).toBe(run.encounter.tuningOf(pylon));
            });

            // It did change, so this saw more than one tuning, and never anything else.
            expect([...readings].sort()).toEqual(['shieldTunedEnergy', 'shieldTunedTorpedo']);
        });

        it('a pylon that isn\'t the master has its shields put back after the delay, and nothing else changes', () => {
            const run = createRun();
            const copy = copies(run)[0];
            takeShieldsDown(copy);
            wait(run, 100);

            const heard = listenToHails(run.state, reseatDelayMs + 15_000).filter(({ text }) => text.includes('RESEATED') || text.startsWith('Wrong one'));
            expect(copy.hullState.shield).toBe(90);
            expect(run.encounter.phase).toBe('diagnose');
            expect(heldKeys(run.ship)).toEqual([]);
            expect(heard).toEqual([
                { speaker: gate, text: `${copy.name.toUpperCase()} RESEATED.` },
                { speaker: keeperTeam, text: 'Wrong one. It\'s put its shields back.' },
            ]);
        });

        it('the master\'s shields at 0 put a key in each station\'s hand, and Key Power in the engineer\'s, and only then, on every player ship', () => {
            const run = createRun({ shipCount: 2 });
            for (const ship of run.ships) {
                expect(heldKeys(ship)).toEqual([]);
            }

            takeShieldsDown(run.encounter.master!);
            wait(run, 100);

            expect(run.encounter.phase).toBe('keys');
            for (const ship of run.ships) {
                expect(heldKeys(ship).sort()).toEqual(['keyPower', 'shutdownKeyEngineer', 'shutdownKeyHelm', 'shutdownKeyScience', 'shutdownKeyTactical']);
            }
            expect(run.state.hail?.text).toBe('That\'s the master. Keys are on your consoles, one each. All four inside five seconds, and get close. It can\'t hear you past eight units.');
        });

        it('the master destroyed: another pylon becomes the master, and its shields have to come down in turn', () => {
            const run = createRun();
            const first = run.encounter.master!;
            first.destroy();

            const next = run.encounter.master!;
            expect(next).not.toBe(first);
            expect(run.encounter.pylons).toHaveLength(3);
            expect(run.encounter.phase).toBe('diagnose');
            expect(run.state.hail).toMatchObject({ speaker: keeperTeam, text: 'That was the master! It\'ll pick another. Start again, and go easier.' });

            takeShieldsDown(copies(run)[0]);
            wait(run, 100);
            expect(run.encounter.phase).toBe('diagnose');
            takeShieldsDown(next);
            wait(run, 100);
            expect(run.encounter.phase).toBe('keys');
        });

        it('every pylon destroyed: the gate is open, a success at half the reward', () => {
            const run = createRun();
            for (const pylon of [...run.encounter.pylons]) {
                pylon.destroy();
            }

            expect(run.encounter.outcome).toBe('success');
            expect(run.encounter.score).toBe(0.5);
            expect(run.ship.antimatter).toBe(antimatterRewards.boss / 2);
            expect(listenToHails(run.state, 30_000).at(-1)?.text).toBe('Well. It\'s open. It won\'t ever close again, which isn\'t what we came for. But it\'s open.');
        });
    });

    describe('the keys', () => {
        it('a key comes back to hand each time it\'s played, and so does Key Power', () => {
            const run = createRun();
            toKeys(run);
            place(run.state, run.ship, { x: 0, y: 0 });

            expect(turnKeys(run.ship, ['helm'])).toBe(true);
            expect(heldKeys(run.ship)).toContain('shutdownKeyHelm');
            expect(heldKeys(run.ship)).toContain('keyPower');
        });

        it('four keys turned inside the window, close to the master: the door opens, the keys are taken back, and the objective is the boat', () => {
            const run = createRun();
            toKeys(run);
            expect(distance(at(run.state, run.ship), at(run.state, run.encounter.master!))).toBeLessThanOrEqual(keyRange);

            expect(turnKeys(run.ship)).toBe(true);
            wait(run, 100);

            expect(run.encounter.phase).toBe('door');
            expect(heldKeys(run.ship)).toEqual([]);
            expect({ type: run.state.objective?.type, subject: run.state.objective?.subject }).toEqual(boatObjective);
            expect(run.ship.engineerState.hand.some(card => card.type === 'extendShields')).toBe(true);
            expect(run.encounter.keepersBoat).not.toBeNull();
        });

        it('three keys turned do nothing, and the gate says so once, when they lapse', () => {
            const run = createRun();
            toKeys(run);
            turnKeys(run.ship, ['helm', 'science', 'tactical']);
            wait(run, 100);
            lapse(run.ship);

            const heard = listenToHails(run.state, 15_000).filter(({ speaker }) => speaker === gate);
            expect(heard).toEqual([{ speaker: gate, text: 'SEQUENCE INCOMPLETE.' }]);
            expect(run.encounter.phase).toBe('keys');
        });

        it('four keys turned too far from the master do nothing, and the gate says it can\'t hear them, once', () => {
            const run = createRun();
            toKeys(run);
            place(run.state, run.ship, beyond(run.state, run.encounter.master!, keyRange + 1));
            turnKeys(run.ship);

            const heard = listenToHails(run.state, 15_000).filter(({ speaker }) => speaker === gate);
            expect(heard).toEqual([{ speaker: gate, text: 'NO HANDSHAKE.' }]);
            expect(run.encounter.phase).toBe('keys');
        });

        it('the master destroyed while the keys are out: they\'re taken back, and it starts again', () => {
            const run = createRun();
            toKeys(run);
            run.encounter.master!.destroy();

            expect(run.encounter.phase).toBe('diagnose');
            expect(heldKeys(run.ship)).toEqual([]);
        });
    });

    describe('the door', () => {
        it('the boat sets out on the far side of the master from the other pylons', () => {
            const run = createRun();
            toDoor(run);
            const master = at(run.state, run.encounter.master!);
            const boat = at(run.state, run.encounter.keepersBoat!);

            expect(distance(boat, master)).toBeCloseTo(boatLaunchDistance);
            for (const copy of copies(run)) {
                expect(distance(boat, at(run.state, copy))).toBeGreaterThan(boatLaunchDistance);
            }
        });

        it('docked, and ninety seconds later: the quarantine is lifted, every pylon stands down, the drones go, and the boss reward is paid', () => {
            const run = createRun();
            toDoor(run);
            wait(run, droneIntervalMs);
            expect(run.encounter.dronesOut.length).toBeGreaterThan(0);
            const drones = [...run.encounter.dronesOut];

            run.encounter.keepersBoat!.setMotion(new MotionKeyframe(run.state.currentTime, ...Object.values(beyond(run.state, run.encounter.master!, 1)) as [number, number], 0));
            wait(run, 100);
            expect(run.encounter.dockedSince).not.toBeNull();
            expect(run.state.hail?.text).toBe('Docked. Ninety seconds.');

            wait(run, boardingMs - 200);
            expect(run.encounter.outcome).toBeNull();
            wait(run, 200);

            expect(run.encounter.outcome).toBe('success');
            expect(run.ship.antimatter).toBe(antimatterRewards.boss);
            expect(run.encounter.pylons.every(pylon => pylon.ai.commander.isStandingDown)).toBe(true);
            expect(drones.every(drone => !run.state.objects.has(drone.id))).toBe(true);
            expect(run.ship.helmState.hand.some(card => card.type === 'warpAway')).toBe(true);
        });

        it('the boat destroyed: another sets out after the delay, and the count starts again', () => {
            const run = createRun();
            toDoor(run);
            const first = run.encounter.keepersBoat!;
            first.setMotion(new MotionKeyframe(run.state.currentTime, ...Object.values(beyond(run.state, run.encounter.master!, 1)) as [number, number], 0));
            wait(run, 60_000);
            expect(run.encounter.dockedSince).not.toBeNull();

            first.destroy();
            expect(run.state.hail?.text).toBe('We\'ve lost the boat. Second crew\'s launching.');
            expect(run.encounter.dockedSince).toBeNull();

            wait(run, secondBoatDelayMs - 200);
            expect(run.encounter.keepersBoat).toBeNull();
            wait(run, 200);
            const second = run.encounter.keepersBoat!;
            expect(second).not.toBeNull();
            expect(second).not.toBe(first);

            // The first one's ninety seconds are gone with it.
            wait(run, boardingMs);
            expect(run.encounter.outcome).toBeNull();
        });

        it('the boat says how its shields are holding, worst first if they fall past both at once', () => {
            const run = createRun();
            toDoor(run);
            const boat = run.encounter.keepersBoat!;

            hullTile(boat).setShield(boat.hullState.maxShield * 0.45);
            const half = listenToHails(run.state, 30_000).filter(({ speaker }) => speaker === 'Keeper Boat Tally');
            hullTile(boat).setShield(1);
            const nearly = listenToHails(run.state, 15_000).filter(({ speaker }) => speaker === 'Keeper Boat Tally');

            expect(half).toEqual([{ speaker: 'Keeper Boat Tally', text: 'Shields at half.' }]);
            expect(nearly).toEqual([{ speaker: 'Keeper Boat Tally', text: 'Shields nearly gone.' }]);
        });

        it('each pylon still fighting launches a drone every so often, never more than four at once', () => {
            const run = createRun();
            toDoor(run);

            wait(run, droneIntervalMs);
            expect(run.encounter.dronesOut).toHaveLength(3);
            wait(run, droneIntervalMs);
            expect(run.encounter.dronesOut).toHaveLength(maxDrones);
            wait(run, droneIntervalMs * 3);
            expect(run.encounter.dronesOut).toHaveLength(maxDrones);
        });

        it('the master destroyed while the boat is out: the boat goes, and the gate is the objective again', () => {
            const run = createRun();
            toDoor(run);
            const boat = run.encounter.keepersBoat!;
            run.encounter.master!.destroy();

            expect(run.encounter.phase).toBe('diagnose');
            expect(run.state.objects.has(boat.id)).toBe(false);
            expect({ type: run.state.objective?.type, subject: run.state.objective?.subject }).toEqual(gateObjective);
        });
    });

    describe('played out with the real AI', () => {
        it('a pylon stays exactly where it is, turns to face the player ship, and fires on it', () => {
            const run = createRun();
            const pylon = run.encounter.pylons[0];
            const start = at(run.state, pylon);
            const shield = run.ship.hullState.shield;
            // Off to one side of where it faces, outside the square, so only this one reaches.
            place(run.state, run.ship, { x: start.x - 2, y: start.y - 14 });

            playOut(run, 120_000);

            const end = at(run.state, pylon);
            expect(end.x).toBeCloseTo(start.x);
            expect(end.y).toBeCloseTo(start.y);
            expect(end.angle).not.toBeCloseTo(start.angle);
            expect(run.ship.hullState.shield).toBeLessThan(shield);
        });

        it('once the door\'s open, the master holds its fire and the other pylons don\'t', () => {
            const run = createRun();
            const master = run.encounter.master!;
            // Halfway along a side, in reach of the master's torpedoes and one other pylon's.
            const neighbour = copies(run).find(copy => distance(at(run.state, copy), at(run.state, master)) === squareSide)!;
            toDoor(run);
            const between = { x: (at(run.state, master).x + at(run.state, neighbour).x) / 2, y: (at(run.state, master).y + at(run.state, neighbour).y) / 2 };
            place(run.state, run.ship, between);
            const shots = vi.spyOn(run.state, 'broadcastWeaponEffect');

            playOut(run, 120_000, () => place(run.state, run.ship, between));

            const sources = shots.mock.calls.map(([effect]) => effect.sourceId);
            expect(sources).not.toContain(master.id);
            expect(sources).toContain(neighbour.id);
        });

        it('the boat flies in and docks, and the drones go after it', () => {
            const run = createRun();
            toDoor(run);
            const boat = run.encounter.keepersBoat!;
            // Where a crew covering the boat would wait for it: the drones prefer the boat, though the crew is nearer.
            const waiting = beyond(run.state, run.encounter.master!, 5);
            place(run.state, run.ship, waiting);

            playOut(run, droneIntervalMs + 2000, () => place(run.state, run.ship, waiting));
            const drones = run.encounter.dronesOut;
            expect(drones.length).toBeGreaterThan(0);
            for (const drone of drones) {
                drone.ai.commander.update(drone.ai.blackboard, run.state.currentTime);
                expect(drone.ai.blackboard.targetId).toBe(boat.id);
            }

            // Slow and Steady from 30 units out, unopposed, as the crew covers it.
            for (const drone of drones) {
                drone.destroy();
            }
            playOut(run, 60_000, () => run.encounter.dronesOut.forEach(drone => drone.destroy()));
            expect(run.state.objects.has(boat.id)).toBe(true);
            expect(distance(at(run.state, boat), at(run.state, run.encounter.master!))).toBeLessThanOrEqual(dockRadius);
            expect(run.encounter.dockedSince).not.toBeNull();
        });
    });
});
