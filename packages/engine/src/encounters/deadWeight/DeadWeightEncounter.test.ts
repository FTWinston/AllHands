import { minHailDuration } from 'common-data/features/sectors/types/HailInfo';
import { antimatterRewards } from 'common-data/features/ships/utils/antimatter';
import { transferPowerRange } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { distance } from 'common-data/features/space/utils/vectors';
import { MotionKeyframe } from 'src/state/MotionKeyframe';
import { listenToHails, seededRandom, setupGameRoom, startCampaign } from 'src/testUtils';
import { describe, expect, it, vi } from 'vitest';
import { coolantIntervalMs, lineCutDelayMs, moduleScenarioId, towDistance, towLength, tugDistance, tugJumpDelayMs, tugScenarioId, type DeadWeightEncounter } from './DeadWeightEncounter';
import type { WeaponEffect } from 'common-data/features/space/types/WeaponEffect';
import type { AiShip } from 'src/state/AiShip';
import type { GameState } from 'src/state/GameState';

const rooms = setupGameRoom();

const tugName = 'Tug Lien';
const halden = 'Halden Ring';
const lineParted = `${halden}: Line's parted. Our own tugs are on the way. Nine hundred people say thank you.`;
const waterLost = `${halden}: ...That was the water.`;

/** A campaign running Dead Weight, with its ships picked out. */
function createDeadWeight({ elite = false, seed = 3 } = {}) {
    const state = rooms.createState(seededRandom(seed));
    const { campaign, ships } = startCampaign(state);
    campaign.devLoadEncounter('deadWeight', elite);

    const encounter = campaign.activeEncounter as DeadWeightEncounter;
    const tug = state.getObjectByScenarioId(tugScenarioId) as AiShip;
    const module = state.getObjectByScenarioId(moduleScenarioId) as AiShip;
    const bailiffs = [...state.objects.values()].filter(object => object.name.startsWith('Bailiff')) as AiShip[];

    return { state, campaign, encounter, ship: ships[0], tug, module, bailiffs };
}

/** What's said over the next few seconds: long enough for anything urgent to have been said, and what follows it. */
function hear(state: GameState, ms = minHailDuration * 4) {
    return listenToHails(state, ms).map(({ speaker, text }) => `${speaker}: ${text}`);
}

/** What's just been said, if it's still up, and what's said after it. */
function hearFromNow(state: GameState, ms?: number) {
    const current = state.hail ? [`${state.hail.speaker}: ${state.hail.text}`] : [];
    return [...current, ...hear(state, ms)];
}

/** Lets the opening lines be read, so whatever's said next is said straight away. */
function hearOpening(state: GameState) {
    hear(state, 30_000);
}

/** Plays the game on, AI and all. The room's timers aren't otherwise running, so those are moved on as well. */
function play(state: GameState, ms: number) {
    for (let elapsed = 0; elapsed < ms; elapsed += 100) {
        state.tick(100);

        for (const delayed of [...rooms.getClock().delayed]) {
            if (delayed.active) {
                delayed.tick(100);
            }
        }
    }
}

/** Puts the tug somewhere along its route, facing along it, holding still. */
function moveTug(state: GameState, tug: AiShip, x: number) {
    tug.setMotion(new MotionKeyframe(state.currentTime, x, 0, 0));
}

/** Has a ship's commander notice what's changed. It skips some updates at low skill, so give it a few. */
function letCommanderNotice(state: GameState, ship: AiShip) {
    for (let i = 0; i < 20; i++) {
        ship.ai.commander.update(ship.ai.blackboard, state.currentTime);
    }
}

function putEnginesOut(tug: AiShip) {
    tug.helmState.adjustHealth(-tug.helmState.maxHealth);
}

const isPowered = (ship: AiShip) => ship.engineerState.systems.find(tile => tile.system === 'hull')!.hasEffect('powerReceived');

describe('DeadWeightEncounter', () => {
    it('has a tug ahead of the player ship, heading away, towing the ring\'s water module, with a bailiff either side of it', () => {
        const { state, ship, tug, module, bailiffs } = createDeadWeight();

        expect(state.encounter!.objective).toEqual({ type: 'recover', subject: 'the water module' });
        expect(tug.name).toBe(tugName);
        expect(tug.getPosition(state.currentTime)).toEqual({ x: tugDistance, y: 0, angle: 0 });
        expect(module.getPosition(state.currentTime)).toEqual({ x: tugDistance - towLength, y: 0, angle: 0 });
        expect(tug.ai.blackboard.goal).toBe('travel-route');

        expect(bailiffs.map(bailiff => bailiff.name).sort()).toEqual(['Bailiff One', 'Bailiff Two']);
        expect(bailiffs.map(bailiff => bailiff.getPosition(state.currentTime).y).sort()).toEqual([-3, 3]);
        for (const bailiff of bailiffs) {
            expect(bailiff.ai.blackboard.goal).toBe('guard-ship');
        }

        const factions = state.factionRegistry;
        expect(factions.areHostile(tug, ship)).toBe(true);
        expect(factions.getRelationship(module, ship)).toBe(RelationshipType.Friendly);
        expect(factions.getRelationship(module, tug)).toBe(RelationshipType.Neutral);
    });

    it('has a tug nobody aboard can repair, with a dozen helm cards, over a module with no shields', () => {
        const { tug, module } = createDeadWeight();

        expect(tug.helmState.maxHealth).toBe(12);
        expect(tug.hullState.maxShield).toBe(30);
        expect(tug.hullState.maxHealth).toBe(20);
        expect(module.hullState.maxHealth).toBe(40);
        expect(module.hullState.maxShield).toBe(0);
    });

    it('opens with Halden Ring saying how it works, then the tug', () => {
        const { state } = createDeadWeight();

        expect(state.hail).toMatchObject({ speaker: halden });
        expect(state.hail!.text).toContain('put those out and it has to let go');
        expect(state.hail!.text).not.toContain('coolant');
        expect(hear(state, 30_000)).toEqual([`${tugName}: This asset is under lawful recovery. Interference will be invoiced.`]);
    });

    it('says when the tug is a third and two thirds of the way, once each', () => {
        const { state, campaign, tug } = createDeadWeight();
        hearOpening(state);

        moveTug(state, tug, tugDistance + towDistance / 3 - 1);
        campaign.tick(0);
        expect(hear(state)).toEqual([]);

        moveTug(state, tug, tugDistance + towDistance / 3 + 1);
        campaign.tick(0);
        expect(hearFromNow(state)).toEqual([`${halden}: They're a third of the way to the marker.`]);

        moveTug(state, tug, tugDistance + towDistance * 2 / 3 + 1);
        campaign.tick(0);
        expect(hearFromNow(state)).toEqual([`${halden}: Two thirds. Past the marker we can't follow.`]);

        campaign.tick(0);
        expect(hear(state)).toEqual([]);
    });

    it('only says the furthest, if the tug got past both at once', () => {
        const { state, campaign, tug } = createDeadWeight();
        hearOpening(state);

        moveTug(state, tug, tugDistance + towDistance * 0.7);
        campaign.tick(0);

        expect(hearFromNow(state)).toEqual([`${halden}: Two thirds. Past the marker we can't follow.`]);
    });

    describe('putting the tug\'s engines out', () => {
        it('stops it, and it cuts the line a few seconds later: a success, and the bailiffs leave', () => {
            const { state, campaign, ship, tug, module, bailiffs, encounter } = createDeadWeight();
            hearOpening(state);

            putEnginesOut(tug);
            campaign.tick(0);
            expect(state.hail).toMatchObject({ speaker: tugName, text: 'Drive\'s dead. Fine. Keep it. Cutting the line.' });
            expect(state.encounter!.outcome).toBeNull();
            expect(encounter.isTowing).toBe(true);

            state.currentTime += lineCutDelayMs;
            campaign.tick(0);

            expect(state.encounter!.outcome).toBe('success');
            expect(ship.antimatter).toBe(antimatterRewards.combat);
            expect(encounter.isTowing).toBe(false);
            expect(state.objects.has(module.id)).toBe(true);
            for (const bailiff of bailiffs) {
                expect(bailiff.ai.commander.isWithdrawing).toBe(true);
            }
            expect(hearFromNow(state, 20_000)).toContain(lineParted);
        });

        it('has the tug jump away once it has let go, with the module left behind', () => {
            const { state, campaign, tug, module } = createDeadWeight();

            putEnginesOut(tug);
            campaign.tick(0);
            state.currentTime += lineCutDelayMs;
            campaign.tick(0);

            state.currentTime += tugJumpDelayMs - 100;
            campaign.tick(0);
            expect(state.objects.has(tug.id)).toBe(true);

            state.currentTime += 100;
            campaign.tick(0);
            expect(state.objects.has(tug.id)).toBe(false);
            expect(state.objects.has(module.id)).toBe(true);
            expect(state.encounter!.outcome).toBe('success');
        });

        it('is still a failure if the tug is destroyed before it has let go', () => {
            const { state, campaign, tug, module } = createDeadWeight();

            putEnginesOut(tug);
            campaign.tick(0);
            tug.destroy();

            expect(state.objects.has(module.id)).toBe(false);
            expect(state.encounter!.outcome).toBe('failure');
        });
    });

    describe('driving both bailiffs off', () => {
        it('has the tug cut the line and leave under its own power: a success', () => {
            const { state, campaign, ship, tug, module, bailiffs, encounter } = createDeadWeight();
            hearOpening(state);

            bailiffs[0].destroy();
            campaign.tick(0);
            expect(state.encounter!.outcome).toBeNull();

            bailiffs[1].destroy();
            campaign.tick(0);

            expect(state.encounter!.outcome).toBe('success');
            expect(ship.antimatter).toBe(antimatterRewards.combat);
            expect(encounter.isTowing).toBe(false);
            expect(tug.ai.commander.isWithdrawing).toBe(true);
            expect(state.objects.has(module.id)).toBe(true);
            expect(hearFromNow(state, 20_000)).toEqual([
                `${tugName}: Escort's gone. Not worth the invoice. Cutting the line.`,
                lineParted,
            ]);
        });

        it('counts a bailiff that flees as gone for good, and the first to flee says so', () => {
            const { state, campaign, bailiffs } = createDeadWeight();
            hearOpening(state);
            const [fleeing, other] = bailiffs;

            fleeing.hullState.adjustHealth(-(fleeing.hullState.health - 1));
            letCommanderNotice(state, fleeing);
            expect(fleeing.ai.blackboard.goal).toBe('flee');
            campaign.tick(0);

            expect(fleeing.ai.commander.isWithdrawing).toBe(true);
            expect(state.encounter!.outcome).toBeNull();
            expect(hearFromNow(state)).toEqual([`${fleeing.name}: This wasn't in the contract. Out.`]);

            other.destroy();
            campaign.tick(0);
            expect(state.encounter!.outcome).toBe('success');
        });
    });

    describe('torpedoes', () => {
        it('that hit the tug hit the module for half as much, and Halden Ring says so the first time', () => {
            const { state, tug, module } = createDeadWeight();
            hearOpening(state);

            tug.damage({ amount: 40, traits: ['torpedoWeapon'], targetSystem: 'helm' });

            expect(module.hullState.health).toBe(20);
            expect(state.hail).toMatchObject({ speaker: halden, text: 'That hit the module! No more torpedoes!' });
        });

        it('that hit the tug twice destroy the module', () => {
            const { state, tug, module } = createDeadWeight();
            hearOpening(state);

            tug.damage({ amount: 40, traits: ['torpedoWeapon'], targetSystem: 'helm' });
            tug.damage({ amount: 40, traits: ['torpedoWeapon'], targetSystem: 'helm' });

            expect(state.objects.has(module.id)).toBe(false);
            expect(state.encounter!.outcome).toBe('failure');
            expect(hearFromNow(state, 20_000)).toEqual([waterLost]);
        });

        it('don\'t touch the module when they hit a bailiff, and nor does any other weapon that hits the tug', () => {
            const { tug, module, bailiffs } = createDeadWeight();

            tug.damage({ amount: 20, traits: ['energyWeapon'], targetSystem: 'helm' });
            bailiffs[0].damage({ amount: 40, traits: ['torpedoWeapon'] });

            expect(module.hullState.health).toBe(module.hullState.maxHealth);
        });

        it('don\'t touch the module once the line is cut', () => {
            const { state, campaign, tug, module } = createDeadWeight();
            putEnginesOut(tug);
            campaign.tick(0);
            state.currentTime += lineCutDelayMs;
            campaign.tick(0);

            tug.damage({ amount: 40, traits: ['torpedoWeapon'], targetSystem: 'hull' });

            expect(module.hullState.health).toBe(module.hullState.maxHealth);
        });
    });

    it('is a failure if the tug is destroyed while it\'s towing, which takes the module with it', () => {
        const { state, campaign, ship, tug, module } = createDeadWeight();
        hearOpening(state);

        tug.destroy();

        expect(state.objects.has(module.id)).toBe(false);
        expect(state.encounter!.outcome).toBe('failure');
        expect(ship.antimatter).toBe(0);
        expect(state.hail).toMatchObject({ speaker: halden, text: '...That was the water.' });
        expect(campaign.warpAway(ship)).toBe(true);
    });

    it('is still a success if the tug is destroyed after it has cut the line', () => {
        const { state, campaign, bailiffs, tug, module } = createDeadWeight();
        for (const bailiff of bailiffs) {
            bailiff.destroy();
        }
        campaign.tick(0);

        tug.destroy();

        expect(state.objects.has(module.id)).toBe(true);
        expect(state.encounter!.outcome).toBe('success');
    });

    it('is a failure if the module is destroyed: the tug and bailiffs leave, and the run carries on', () => {
        const { state, campaign, ship, tug, module, bailiffs } = createDeadWeight();
        hearOpening(state);

        module.destroy();

        expect(state.encounter!.outcome).toBe('failure');
        expect(ship.antimatter).toBe(0);
        expect(tug.ai.commander.isWithdrawing).toBe(true);
        for (const bailiff of bailiffs) {
            expect(bailiff.ai.commander.isWithdrawing).toBe(true);
        }
        expect(hearFromNow(state, 20_000)).toEqual([waterLost]);

        expect(campaign.warpAway(ship)).toBe(true);
        expect(state.phase).toBe('map');
    });

    it('is a failure if the tug reaches the marker still towing: it jumps away with the module, and the bailiffs leave', () => {
        const { state, campaign, ship, tug, module, bailiffs } = createDeadWeight();
        hearOpening(state);

        moveTug(state, tug, tugDistance + towDistance);
        letCommanderNotice(state, tug);
        expect(tug.ai.commander.isRouteComplete).toBe(true);
        campaign.tick(0);

        expect(state.encounter!.outcome).toBe('failure');
        expect(ship.antimatter).toBe(0);
        expect(state.objects.has(tug.id)).toBe(false);
        expect(state.objects.has(module.id)).toBe(false);
        for (const bailiff of bailiffs) {
            expect(bailiff.ai.commander.isWithdrawing).toBe(true);
        }
        expect(hearFromNow(state, 20_000)).toEqual([`${tugName}: Asset recovered. Good day.`]);

        expect(campaign.warpAway(ship)).toBe(true);
    });

    describe('elite', () => {
        it('has Halden Ring ask for power for the module, and keeps Transfer Power in the engineer\'s hand', () => {
            const { state, ship } = createDeadWeight({ elite: true });

            expect(state.hail!.text).toContain('If you can spare her power, she\'ll hold.');
            expect(ship.engineerState.hand.some(card => card.type === 'transferPower')).toBe(true);
        });

        it('has the module lose a hull card each interval, and none while it\'s being powered', () => {
            const { state, campaign, ship, module } = createDeadWeight({ elite: true });
            const health = module.hullState.health;

            state.currentTime += coolantIntervalMs - 100;
            campaign.tick(0);
            expect(module.hullState.health).toBe(health);

            state.currentTime += 100;
            campaign.tick(0);
            expect(module.hullState.health).toBe(health - 1);

            // The engineer powers it from close enough: Transfer Power costs one more than they normally have.
            ship.setMotion(new MotionKeyframe(state.currentTime, module.getPosition(state.currentTime).x - transferPowerRange + 1, 0, 0));
            ship.engineerState.adjustPowerLevel(1);
            const card = ship.engineerState.hand.find(held => held.type === 'transferPower')!;
            expect(ship.engineerState.playCard(card.id, 'transferPower', 'no-target', '')).not.toBeNull();
            expect(isPowered(module)).toBe(true);

            for (let i = 0; i < 2; i++) {
                state.currentTime += coolantIntervalMs;
                campaign.tick(0);
            }
            expect(module.hullState.health).toBe(health - 1);
        });

        it('loses the module to its coolant if nothing powers it for long enough', () => {
            const { state, campaign, module } = createDeadWeight({ elite: true });
            module.hullState.adjustHealth(-(module.hullState.health - 1));

            state.currentTime += coolantIntervalMs;
            campaign.tick(0);

            expect(state.objects.has(module.id)).toBe(false);
            expect(state.encounter!.outcome).toBe('failure');
        });

        it('has no failing coolant, and no Transfer Power, in the regular form', () => {
            const { state, campaign, ship, module } = createDeadWeight();

            state.currentTime += coolantIntervalMs * 3;
            campaign.tick(0);

            expect(module.hullState.health).toBe(module.hullState.maxHealth);
            expect(ship.engineerState.hand.some(card => card.type === 'transferPower')).toBe(false);
        });
    });

    describe('played out with the real AI', () => {
        it('tows the module along its route, a line\'s length astern, with the bailiffs alongside while the crew is out of reach', () => {
            const { state, ship, tug, module, bailiffs } = createDeadWeight();
            // Too far away for the bailiffs to leave the tug for.
            ship.setMotion(new MotionKeyframe(state.currentTime, -60, 0, 0));

            for (let elapsed = 0; elapsed < 60_000; elapsed += 1000) {
                play(state, 1000);
                const at = tug.getPosition(state.currentTime);

                expect(distance(at, module.getPosition(state.currentTime))).toBeCloseTo(towLength, 3);
                for (const bailiff of bailiffs) {
                    expect(distance(at, bailiff.getPosition(state.currentTime))).toBeLessThan(15);
                }
            }

            expect(tug.getPosition(state.currentTime).x).toBeGreaterThan(tugDistance + 20);
        });

        it('has the bailiffs go for the crew, and never the module or the tug', () => {
            const { state, ship, tug, module, bailiffs } = createDeadWeight();
            const targets = new Set<string>();
            const shots = vi.spyOn(state, 'broadcastWeaponEffect').mockImplementation((effect: WeaponEffect) => {
                if (effect.type === 'shot' && bailiffs.some(bailiff => bailiff.id === effect.sourceId) && effect.targetId) {
                    targets.add(effect.targetId);
                }
            });

            // The crew stays in reach, just behind the module.
            for (let elapsed = 0; elapsed < 90_000; elapsed += 1000) {
                const at = module.getPosition(state.currentTime);
                ship.setMotion(new MotionKeyframe(state.currentTime, at.x - 5, 0, 0));
                play(state, 1000);
            }
            shots.mockRestore();

            expect([...targets]).toEqual([ship.id]);
            expect(module.hullState.health).toBe(module.hullState.maxHealth);
            expect(tug.hullState.health).toBe(tug.hullState.maxHealth);
        });

        it('stops the tug where it is when its engines are put out, though it was flying for the marker', () => {
            const { state, tug, module } = createDeadWeight();
            play(state, 30_000);
            expect(tug.helmState.activeManeuver).not.toBeNull();

            putEnginesOut(tug);
            play(state, 2000);
            const stoppedAt = tug.getPosition(state.currentTime);
            const moduleAt = module.getPosition(state.currentTime);

            // Long enough for it to have let go, but not to have jumped away.
            play(state, lineCutDelayMs + tugJumpDelayMs - 3000);
            expect(state.objects.has(tug.id)).toBe(true);
            expect(distance(tug.getPosition(state.currentTime), stoppedAt)).toBeLessThan(0.01);
            expect(distance(module.getPosition(state.currentTime), moduleAt)).toBeLessThan(0.01);
            expect(state.encounter!.outcome).toBe('success');
        });
    });
});
