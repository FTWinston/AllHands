import { getHailDuration, minHailDuration } from 'common-data/features/sectors/types/HailInfo';
import { crewRoleNames, type CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { antimatterRewards } from 'common-data/features/ships/utils/antimatter';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { createShipSetup } from 'engine/campaign/shipDesigns';
import { MotionKeyframe } from 'engine/state/MotionKeyframe';
import { listenToHails, seededRandom, setupGameRoom, startCampaign } from 'engine/testUtils';
import { getHostileShips } from 'engine/utils/shipQueries';
import { describe, expect, it, vi } from 'vitest';
import { digInPower, infectedPowerBoost, ostlerScenarioId, rerouteMs, warshipDecks, type FeverShipEncounter } from './FeverShipEncounter.engine';
import type { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import type { WeaponEffect } from 'common-data/features/space/types/WeaponEffect';
import type { AiShip } from 'engine/state/AiShip';
import type { GameState } from 'engine/state/GameState';

const rooms = setupGameRoom();

const ostlerName = 'Hauler Ostler';
const ostlerCrew = 'Ostler\'s Crew';

/** A campaign running Fever Ship, with Ostler picked out. If a system is given, the encounter is loaded again until the update is in that one. */
function createFeverShip({ infected, elite = false, seed = 3 }: { infected?: CrewRoleName; elite?: boolean; seed?: number } = {}) {
    const state = rooms.createState(seededRandom(seed));
    const { campaign, ships } = startCampaign(state);

    for (let attempt = 0; attempt < 50; attempt++) {
        campaign.devLoadEncounter('feverShip', elite);
        const encounter = campaign.activeEncounter as FeverShipEncounter;

        if (!infected || encounter.infectedSystem === infected) {
            const ostler = state.getObjectByScenarioId(ostlerScenarioId) as AiShip;
            return { state, campaign, encounter, ship: ships[0], ostler };
        }
    }

    throw new Error(`Fever Ship never infected ${infected}`);
}

/** Every card of that system of hers is damaged. */
function putOut(ostler: AiShip, role: CrewRoleName) {
    const system = ostler.getCrewSystem(role);
    system.adjustHealth(-system.maxHealth);
}

function powers(ostler: AiShip) {
    return Object.fromEntries(crewRoleNames.map(role => [role, ostler.getCrewSystem(role).powerLevel]));
}

/** What's said over the next few seconds: long enough for anything urgent to have been said, and what follows it. */
function hear(state: GameState, ms = minHailDuration * 4) {
    return listenToHails(state, ms).map(({ speaker, text }) => `${speaker}: ${text}`);
}

/** What's just been said, if it's still up, and what's said after it. */
function hearFromNow(state: GameState) {
    const current = state.hail ? [`${state.hail.speaker}: ${state.hail.text}`] : [];
    return [...current, ...hear(state)];
}

/** Lets the opening lines be read, so whatever's said next is said straight away. */
function hearOpening(state: GameState) {
    hear(state, 30_000);
}

/** Plays the game on, AI and all. The room's timers aren't otherwise running, so those are moved on as well. */
function play(state: GameState, ms: number) {
    for (let elapsed = 0; elapsed < ms && state.encounter?.outcome === null; elapsed += 100) {
        state.tick(100);

        for (const delayed of [...rooms.getClock().delayed]) {
            if (delayed.active) {
                delayed.tick(100);
            }
        }
    }
}

const haulerCards = (role: CrewRoleName): readonly CardType[] => createShipSetup('hauler', 'any', { x: 0, y: 0, angle: 0 })[role].cards;

describe('FeverShipEncounter', () => {
    it('has a hostile hauler ahead of the player ship, facing it, hunting it, and the only other ship there', () => {
        const { state, ship, ostler } = createFeverShip();

        expect(state.encounter!.objective).toEqual({ type: 'disable', subject: 'Ostler' });
        expect(ostler.name).toBe(ostlerName);
        expect(state.factionRegistry.areHostile(ostler, ship)).toBe(true);
        expect(ostler.ai.blackboard.goal).toBe('search-and-destroy');
        expect(ostler.getPosition(state.currentTime)).toMatchObject({ x: 12, y: 0, angle: Math.PI });
        expect(getHostileShips(state)).toEqual([ostler]);
    });

    it('opens with her crew saying how it works, and then the ship itself', () => {
        const { state } = createFeverShip();

        expect(state.hail).toMatchObject({ speaker: ostlerCrew });
        expect(state.hail!.text).toContain('Knock that one out and she stops');

        expect(hear(state, getHailDuration(state.hail!.text) + minHailDuration)).toEqual([`${ostlerName}: FLEET DOCTRINE NINE. HOSTILE CONTACT. ENGAGING.`]);
    });

    it.each(crewRoleNames)('runs the update in %s at 5 power with a warship\'s deck, and the other three at 2 with a hauler\'s', (infected) => {
        const { ostler } = createFeverShip({ infected });

        for (const role of crewRoleNames) {
            const system = ostler.getCrewSystem(role);
            const cards = [...system.deck, ...system.hand].map(card => card.type).sort();

            expect(system.powerLevel).toBe(role === infected ? 2 + infectedPowerBoost : 2);
            expect(system.maxHealth).toBe(5);
            expect(cards).toEqual([...(role === infected ? warshipDecks[role] : haulerCards(role))].sort());
        }
    });

    it.each(crewRoleNames)('shows science a warship\'s cards in the hand of the system running the update, and none in the others (%s)', (infected) => {
        const { ship, ostler } = createFeverShip({ infected });
        const science = ship.scienceState;

        for (const role of crewRoleNames) {
            science.subscribeToSystem(ostler, role);
            expect(science.readHand(ostler, role)).toBe(true);

            const scanned = { helm: science.scannedHelm, tactical: science.scannedTactical, science: science.scannedScience, engineer: science.scannedEngineer }[role]!;
            const hand = [...scanned.hand!].map(card => card.type);

            if (role === infected) {
                expect(hand.length).toBeGreaterThan(0);
                expect(hand.every(card => warshipDecks[infected].includes(card))).toBe(true);
            } else {
                expect(hand.every(card => haulerCards(role).includes(card))).toBe(true);
                expect(hand.some(card => warshipDecks[infected].includes(card) && !haulerCards(role).includes(card))).toBe(false);
            }
        }
    });

    it('leaves her engineer unable to repair anything', () => {
        const { ostler } = createFeverShip();

        expect(ostler.engineerState.repairCapacity).toBe(0);
        expect(ostler.engineerState.maxRepairCapacity).toBe(0);
    });

    it('lets nothing be played from a system that has been put out', () => {
        const { ostler } = createFeverShip({ infected: 'helm' });
        const tactical = ostler.tacticalState;
        const [strip] = tactical.hand;

        putOut(ostler, 'tactical');

        expect(tactical.health).toBe(0);
        expect(tactical.playCard(strip.id, strip.type, 'weapon-slot', tactical.slots[0].id)).toBeNull();
    });

    describe('putting out the system running the update', () => {
        it.each(crewRoleNames)('stops her: she goes neutral, and it\'s a success (%s)', (infected) => {
            const { state, campaign, ship, ostler } = createFeverShip({ infected });
            hearOpening(state);

            putOut(ostler, infected);
            campaign.tick(0);

            expect(state.encounter!.outcome).toBe('success');
            expect(ship.antimatter).toBe(antimatterRewards.combat);
            expect(state.objects.has(ostler.id)).toBe(true);
            expect(state.factionRegistry.getRelationship(ship, ostler)).toBe(RelationshipType.Neutral);
            expect(getHostileShips(state)).toEqual([]);
        });

        it('cuts off whatever was being said, and she has her last word before her crew do', () => {
            const { state, campaign, ostler, encounter } = createFeverShip();

            putOut(ostler, encounter.infectedSystem);
            campaign.tick(0);

            expect(state.hail).toMatchObject({ speaker: ostlerName, text: 'DOCTRINE... NINE...' });
            expect(hear(state, 20_000)).toEqual([`${ostlerCrew}: She's stopped. We've got the engine room. Thank you, and sorry about your paintwork.`]);
        });
    });

    describe('putting out a healthy system', () => {
        it('makes the update dig in: every other crew system of hers gains power, and the encounter goes on', () => {
            const { state, campaign, ostler } = createFeverShip({ infected: 'helm' });
            hearOpening(state);

            putOut(ostler, 'tactical');
            campaign.tick(0);

            expect(state.encounter!.outcome).toBeNull();
            expect(powers(ostler)).toEqual({ helm: 5, tactical: 2, science: 2 + digInPower, engineer: 2 + digInPower });
            expect(hearFromNow(state)).toEqual([
                `${ostlerName}: SUBSYSTEM LOST. REALLOCATING.`,
                `${ostlerCrew}: Not that one! She's running hotter.`,
            ]);
        });

        it('only digs in the first time for each system, though each one counts', () => {
            const { state, campaign, ostler } = createFeverShip({ infected: 'helm' });
            hearOpening(state);

            putOut(ostler, 'tactical');
            campaign.tick(0);

            // The update reroutes around it, and it's back.
            state.currentTime += rerouteMs;
            campaign.tick(0);
            expect(ostler.tacticalState.health).toBe(ostler.tacticalState.maxHealth);
            hear(state);

            putOut(ostler, 'tactical');
            campaign.tick(0);
            expect(powers(ostler)).toEqual({ helm: 5, tactical: 2, science: 3, engineer: 3 });
            expect(hear(state)).toEqual([]);

            putOut(ostler, 'science');
            campaign.tick(0);
            expect(powers(ostler)).toEqual({ helm: 5, tactical: 3, science: 3, engineer: 4 });
        });

        it('has it back once the update has rerouted around it, but only the once: one put out twice stays out', () => {
            const { state, campaign, ostler } = createFeverShip({ infected: 'helm' });
            const tactical = ostler.tacticalState;

            putOut(ostler, 'tactical');
            campaign.tick(0);

            state.currentTime += rerouteMs - 100;
            campaign.tick(0);
            expect(tactical.health).toBe(0);

            state.currentTime += 100;
            campaign.tick(0);
            expect(tactical.health).toBe(tactical.maxHealth);

            putOut(ostler, 'tactical');
            campaign.tick(0);
            state.currentTime += rerouteMs;
            campaign.tick(0);
            expect(tactical.health).toBe(0);
        });
    });

    it('has her crew say they felt it once her hull is down to half, and only once', () => {
        const { state, campaign, ostler } = createFeverShip();
        hearOpening(state);

        ostler.hullState.adjustHealth(-7);
        campaign.tick(0);
        expect(hear(state)).toEqual([]);

        ostler.hullState.adjustHealth(-1);
        campaign.tick(0);
        expect(hearFromNow(state)).toEqual([`${ostlerCrew}: We felt that. She wasn't built to be shot at.`]);

        ostler.hullState.adjustHealth(-1);
        campaign.tick(0);
        expect(hear(state)).toEqual([]);
    });

    it('is a failure if she is destroyed, with nothing said, no reward, and the run carrying on', () => {
        const { state, campaign, ship, ostler } = createFeverShip();

        ostler.destroy();

        expect(state.encounter!.outcome).toBe('failure');
        expect(ship.antimatter).toBe(0);
        expect(state.hail).toBeNull();
        expect(hear(state, 20_000)).toEqual([]);

        expect(campaign.warpAway(ship)).toBe(true);
        expect(state.phase).toBe('map');
    });

    describe('elite', () => {
        it('moves the update once, when its system is put out, to one that is still working, and putting that out is a success', () => {
            const { state, campaign, encounter, ship, ostler } = createFeverShip({ infected: 'tactical', elite: true });
            hearOpening(state);

            // Two of the healthy ones are out, so there's only one it can go to.
            putOut(ostler, 'helm');
            putOut(ostler, 'science');
            campaign.tick(0);
            // Long enough for what's said about those, but not for the update to reroute around them.
            hear(state, rerouteMs - 1000);

            putOut(ostler, 'tactical');
            campaign.tick(0);

            expect(state.encounter!.outcome).toBeNull();
            expect(encounter.infectedSystem).toBe('engineer');
            // It had dug in twice, so it was over 5 underneath. It loses 3 of that, and the engineer gains 3 on top of its 2 and the two it dug in.
            expect(ostler.tacticalState.powerLevel).toBe(2 + infectedPowerBoost + 2 * digInPower - infectedPowerBoost);
            expect(ostler.engineerState.powerLevel).toBe(5);
            expect(hearFromNow(state)).toEqual([
                `${ostlerName}: DOCTRINE RESTORED FROM BACKUP.`,
                `${ostlerCrew}: It's moved. It's somewhere else now.`,
            ]);

            // Only its power has moved: its cards are still a hauler's.
            expect([...ostler.engineerState.deck, ...ostler.engineerState.hand].every(card => haulerCards('engineer').includes(card.type))).toBe(true);

            putOut(ostler, 'engineer');
            campaign.tick(0);
            expect(state.encounter!.outcome).toBe('success');
            expect(state.factionRegistry.getRelationship(ship, ostler)).toBe(RelationshipType.Neutral);
        });

        it('doesn\'t move a second time', () => {
            const { campaign, encounter, ostler, state } = createFeverShip({ infected: 'science', elite: true });

            putOut(ostler, 'science');
            campaign.tick(0);
            const second = encounter.infectedSystem;
            expect(second).not.toBe('science');

            putOut(ostler, second);
            campaign.tick(0);

            expect(encounter.infectedSystem).toBe(second);
            expect(state.encounter!.outcome).toBe('success');
        });

        it('never moves in the regular form', () => {
            const { campaign, encounter, ostler, state } = createFeverShip();

            putOut(ostler, encounter.infectedSystem);
            campaign.tick(0);

            expect(state.encounter!.outcome).toBe('success');
        });
    });

    describe('played out with the real AI', () => {
        /** What she fires at the player ship over the given time, by weapon. */
        function watchHerFire(state: GameState, ostler: AiShip, ms: number) {
            const weapons: string[] = [];
            const broadcast = vi.spyOn(state, 'broadcastWeaponEffect').mockImplementation((effect: WeaponEffect) => {
                if (effect.type === 'shot' && effect.sourceId === ostler.id) {
                    weapons.push(effect.weapon);
                }
            });

            play(state, ms);
            broadcast.mockRestore();
            return weapons;
        }

        it('fires torpedoes with the update in her tactical system', () => {
            const { state, ostler } = createFeverShip({ infected: 'tactical' });

            expect(watchHerFire(state, ostler, 60_000)).toContain('photonTorpedo');
        });

        it.each(['helm', 'science', 'engineer'] as const)('fires nothing but her strip with a healthy tactical system (%s infected)', (infected) => {
            const { state, ostler } = createFeverShip({ infected });

            const weapons = watchHerFire(state, ostler, 90_000);

            expect(weapons.length).toBeGreaterThan(0);
            expect(new Set(weapons)).toEqual(new Set(['phaserStrip']));
        });

        it('leaves marks on the crew\'s systems with the update in her science system, as it scans them', () => {
            const { state, ship } = createFeverShip({ infected: 'science' });
            const marks = new Set<string>();

            for (let elapsed = 0; elapsed < 30_000; elapsed += 1000) {
                play(state, 1000);
                for (const tile of ship.engineerState.systems) {
                    for (const effect of tile.effects) {
                        marks.add(effect.type);
                    }
                }
            }

            expect([...marks].some(mark => mark === 'antiprotonResidue' || mark === 'chronitonSaturation')).toBe(true);
        });

        it('flies like a fighter with the update in her helm, and like a hauler without', () => {
            const manoeuvres = (infected: CrewRoleName) => {
                const { state, ostler } = createFeverShip({ infected });
                const played = new Set<string>();

                for (let elapsed = 0; elapsed < 60_000; elapsed += 500) {
                    play(state, 500);
                    const card = ostler.helmState.activeManeuver?.card?.type;
                    if (card) {
                        played.add(card);
                    }
                }

                return played;
            };

            expect([...manoeuvres('helm')].some(card => card === 'zigZag' || card.startsWith('sweep'))).toBe(true);
            expect([...manoeuvres('tactical')].some(card => card === 'zigZag' || card.startsWith('sweep'))).toBe(false);
        });

        it('holds her fire once she\'s stopped, even with the crew in reach of her strip', () => {
            const { state, campaign, ship, ostler, encounter } = createFeverShip({ infected: 'engineer' });
            ship.setMotion(new MotionKeyframe(state.currentTime, 6, 0, 0));
            const shield = ship.hullState.shield;

            putOut(ostler, encounter.infectedSystem);
            campaign.tick(0);

            for (let elapsed = 0; elapsed < 30_000; elapsed += 100) {
                state.tick(100);
            }

            expect(ship.hullState.shield).toBe(shield);
        });
    });
});
