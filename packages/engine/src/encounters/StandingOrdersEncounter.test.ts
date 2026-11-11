import { getHailDuration } from 'common-data/features/sectors/types/HailInfo';
import { isCrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { antimatterRewards } from 'common-data/features/ships/utils/antimatter';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { MotionKeyframe } from 'src/state/MotionKeyframe';
import { seededRandom, setupGameRoom, startCampaign } from 'src/testUtils';
import { getHostileShips } from 'src/utils/shipQueries';
import { describe, expect, it } from 'vitest';
import { getDefaultNode } from './EncounterRegistry';
import { canBuildSignal, getSignalCardType, type InspectionSignal } from './inspectionSignal';
import { dronesPerWrongSignal, maxDrones, pingIntervalMs, pingRange, platformScenarioId, rekeyIntervalMs, type StandingOrdersEncounter } from './StandingOrdersEncounter';
import type { CardType, EnemyTargetedCardType } from 'common-data/features/cards/utils/cardDefinitions';
import type { SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import type { Campaign } from 'src/campaign/Campaign';
import type { AiShip } from 'src/state/AiShip';
import type { GameState } from 'src/state/GameState';
import type { PlayerShip } from 'src/state/PlayerShip';
import type { Ship } from 'src/state/Ship';
import type { HullSystemTile } from 'src/state/systems/engineer/HullSystemTile';

const rooms = setupGameRoom();

const pings: SystemEffectType[] = ['phasedPing', 'coherentPing', 'invertedPing'];

/** A campaign running Standing Orders, with the platform picked out. The elite form is started through the campaign's own code, which can only load the regular one standalone. */
function createStandingOrders({ seed = 3, elite = false } = {}) {
    const state = rooms.createState(seededRandom(seed));
    const { campaign, ships } = startCampaign(state);
    state.message = null;
    (campaign as unknown as { startEncounter(node: SectorNodeInfo): void }).startEncounter({ ...getDefaultNode('standingOrders'), elite });

    const encounter = campaign.activeEncounter as StandingOrdersEncounter;
    const platform = state.getObjectByScenarioId(platformScenarioId) as AiShip;

    return { state, campaign, encounter, ship: ships[0], platform };
}

function getHullTile(ship: Ship) {
    return ship.engineerState.systems.find(tile => tile.system === 'hull') as HullSystemTile;
}

function dropShields(ship: Ship) {
    getHullTile(ship).setShield(0);
}

/** Uses a deflector on the platform, loaded as given. */
function send(platform: AiShip, ship: PlayerShip, cardType: EnemyTargetedCardType) {
    platform.deflectorReceived.triggerListeners({ source: ship, cardType });
}

/** Keys the platform to the given signal, as its own code would. */
function rekeyTo(encounter: StandingOrdersEncounter, signal: InspectionSignal, kit: CardType[] = []) {
    Object.assign(encounter as unknown as { signal: InspectionSignal; kit: CardType[] }, { signal, kit });
}

function getPings(ship: PlayerShip) {
    return [...ship.engineerState.systems].flatMap(tile => [...tile.effects].filter(effect => pings.includes(effect.type)).map(effect => ({ system: tile.system, type: effect.type })));
}

function moveShip(state: GameState, ship: PlayerShip, x: number) {
    ship.setMotion(new MotionKeyframe(state.currentTime, x, 0, 0));
}

function waitForPing(state: GameState, campaign: Campaign) {
    state.currentTime += pingIntervalMs;
    campaign.tick(0);
}

describe('StandingOrdersEncounter', () => {
    it('has a hostile platform ahead of the player ship, holding its position', () => {
        const { state, ship, platform } = createStandingOrders();

        expect(state.encounter!.objective).toEqual({ type: 'shutDown', subject: 'Customs Platform 7' });
        expect(platform.name).toBe('Customs Platform 7');
        expect(state.factionRegistry.areHostile(platform, ship)).toBe(true);
        expect(platform.ai.blackboard.goal).toBe('defend-position');
        expect(platform.getPosition(state.currentTime).x).toBeGreaterThan(ship.getPosition(state.currentTime).x);
        expect(getHostileShips(state)).toEqual([platform]);
    });

    it('opens with the clerk saying how the platform works, and then the platform itself', () => {
        const { state, campaign } = createStandingOrders();

        expect(state.hail).toMatchObject({ speaker: 'Dock Clerk, Tessaly Yard' });
        expect(state.hail!.text).toContain('three parts');

        state.currentTime += getHailDuration(state.hail!.text);
        campaign.tick(0);

        expect(state.hail).toMatchObject({ speaker: 'Customs Platform 7' });
        expect(state.hail!.text).toContain('impounded');
    });

    it.each([1, 2, 3, 4, 5, 6, 7, 8])('seed %i keys the platform to a signal that the crew can build, with every part there to be found', (seed) => {
        const { ship, platform, encounter } = createStandingOrders({ seed });
        const signal = encounter.inspectionSignal;
        const scienceCards = [...ship.scienceState.deck, ...ship.scienceState.hand].map(card => card.type);

        expect(canBuildSignal(signal, scienceCards)).toBe(true);

        // The substance is what the platform's own deflector is loaded with, and nothing else is.
        expect(platform.scienceState.deflectorCard.type).toBe(`deflectorModulated${signal.substance}Field`);

        // The delivery matches what it's armed with.
        const weapons = new Set([...platform.tacticalState.deck, ...platform.tacticalState.hand, ...[...platform.tacticalState.slots].flatMap(slot => (slot.card ? [slot.card] : []))].map(card => card.type));
        const expected = { Beam: ['phaserCannon'], Pulse: ['photonTorpedo'], Burst: ['phaserCannon', 'photonTorpedo'] }[signal.delivery as 'Beam' | 'Pulse' | 'Burst'];
        expect([...weapons].sort()).toEqual(expected);
    });

    describe('the ping', () => {
        it('leaves the mark of the modifier on one crew system of a ship that is close enough', () => {
            const { state, campaign, encounter, ship } = createStandingOrders();
            rekeyTo(encounter, { modifier: 'Inverted', substance: 'Tetryon', delivery: 'Pulse' });

            // Where it starts is too far away.
            waitForPing(state, campaign);
            expect(getPings(ship)).toEqual([]);

            moveShip(state, ship, 12 - pingRange + 1);
            waitForPing(state, campaign);

            const marks = getPings(ship);
            expect(marks).toHaveLength(1);
            expect(marks[0].type).toBe('invertedPing');
            expect(isCrewRoleName(marks[0].system)).toBe(true);
        });

        it.each([['Phased', 'phasedPing'], ['Coherent', 'coherentPing']] as const)('is a %s one when that is the modifier', (modifier, effect) => {
            const { state, campaign, encounter, ship } = createStandingOrders();
            rekeyTo(encounter, { modifier, substance: 'Tetryon', delivery: 'Pulse' });
            moveShip(state, ship, 5);

            waitForPing(state, campaign);

            expect(getPings(ship).map(mark => mark.type)).toEqual([effect]);
        });

        it('never comes when the modifier is the default, which is how the crew knows', () => {
            const { state, campaign, encounter, ship } = createStandingOrders();
            rekeyTo(encounter, { modifier: 'Modulated', substance: 'Tetryon', delivery: 'Pulse' });
            moveShip(state, ship, 5);

            waitForPing(state, campaign);
            waitForPing(state, campaign);

            expect(getPings(ship)).toEqual([]);
        });
    });

    describe('a signal', () => {
        it('is ignored while the platform\'s shields are up, right or wrong', () => {
            const { state, encounter, ship, platform } = createStandingOrders();

            send(platform, ship, getSignalCardType(encounter.inspectionSignal));
            expect(state.hail).toMatchObject({ speaker: 'Customs Platform 7', text: 'Signal not received.' });
            expect(state.encounter!.outcome).toBeNull();

            send(platform, ship, 'deflectorModulatedGravitonField');
            expect(getHostileShips(state)).toEqual([platform]);
        });

        it('stands the platform down if it is the right one, with its shields down', () => {
            const { state, campaign, encounter, ship, platform } = createStandingOrders();
            dropShields(platform);
            send(platform, ship, 'deflectorModulatedGravitonField');
            expect(getHostileShips(state)).toHaveLength(1 + dronesPerWrongSignal);

            send(platform, ship, getSignalCardType(encounter.inspectionSignal));

            expect(state.encounter!.outcome).toBe('success');
            expect(ship.antimatter).toBe(antimatterRewards.combat);

            // It's still there, which is the point, but it's no longer an enemy. Its drones have gone with it.
            expect(state.objects.has(platform.id)).toBe(true);
            expect(state.factionRegistry.getRelationship(ship, platform)).toBe(RelationshipType.Neutral);
            expect(getHostileShips(state)).toEqual([]);

            expect(state.hail).toMatchObject({ speaker: 'Customs Platform 7' });
            expect(state.hail!.text).toContain('Inspection accepted');

            // The clerk has the last word.
            state.currentTime += getHailDuration(state.hail!.text);
            campaign.tick(0);
            expect(state.hail).toMatchObject({ speaker: 'Dock Clerk, Tessaly Yard' });
        });

        it('launches drones if it is the wrong one, up to a limit, and the right one is still right', () => {
            const { state, encounter, ship, platform } = createStandingOrders();
            const signal = encounter.inspectionSignal;
            dropShields(platform);

            send(platform, ship, 'deflectorModulatedGravitonField');
            expect(state.hail).toMatchObject({ speaker: 'Customs Platform 7', text: 'Inspection signal invalid. Enforcement dispatched.' });
            expect(getHostileShips(state).filter(hostile => hostile !== platform).map(drone => drone.name)).toEqual(['Drone 1', 'Drone 2']);
            expect(state.encounter!.outcome).toBeNull();

            send(platform, ship, 'deflectorModulatedGravitonField');
            send(platform, ship, 'deflectorModulatedGravitonField');
            expect(getHostileShips(state)).toHaveLength(1 + maxDrones);

            expect(encounter.inspectionSignal).toEqual(signal);
            send(platform, ship, getSignalCardType(signal));
            expect(state.encounter!.outcome).toBe('success');
        });

        it('reaches the platform when science uses the deflector on it', () => {
            const { state, encounter, ship, platform } = createStandingOrders();
            const { modifier, substance, delivery } = encounter.inspectionSignal;
            dropShields(platform);
            ship.updateKnownObjects(state.currentTime);

            const science = ship.scienceState;
            science.presetDeflector(modifier, substance, delivery);
            Object.assign(science, { powerLevel: 5 });

            expect(science.playCard(science.deflectorCard.id, science.deflectorCard.type, 'enemy', platform.id)).not.toBeNull();
            expect(state.encounter!.outcome).toBe('success');
        });
    });

    it('is a failure if the platform is destroyed, drones and all', () => {
        const { state, campaign, ship, platform } = createStandingOrders();
        dropShields(platform);
        send(platform, ship, 'deflectorModulatedGravitonField');

        platform.destroy();

        expect(state.encounter!.outcome).toBe('failure');
        expect(ship.antimatter).toBe(0);
        expect(getHostileShips(state)).toEqual([]);
        expect(state.hail).toMatchObject({ speaker: 'Dock Clerk, Tessaly Yard' });

        // The run carries on.
        expect(campaign.warpAway(ship)).toBe(true);
        expect(state.phase).toBe('map');
    });

    it('keeps science supplied with whatever scan cards their deck lacks for the signal, and they\'re gone afterwards', () => {
        const { campaign, encounter, ship } = createStandingOrders();
        const kitInHand = () => ship.scienceState.hand.filter(card => card.type === 'coherentBeamScan');
        expect(kitInHand()).toHaveLength(0);

        // The starting deck has no beam.
        rekeyTo(encounter, { modifier: 'Inverted', substance: 'Tetryon', delivery: 'Beam' }, ['coherentBeamScan']);
        campaign.tick(0);
        campaign.tick(0);

        expect(kitInHand()).toHaveLength(1);
        expect(kitInHand()[0].hasTrait('expendable')).toBe(true);
        expect(ship.scienceState.deck.some(card => card.type === 'coherentBeamScan')).toBe(false);

        // Using it up brings another.
        ship.scienceState.hand.splice(ship.scienceState.hand.indexOf(kitInHand()[0]), 1);
        campaign.tick(0);
        expect(kitInHand()).toHaveLength(1);

        campaign.devLoadEncounter('skirmish');
        expect(kitInHand()).toHaveLength(0);
        expect(ship.scienceState.deck.some(card => card.type === 'coherentBeamScan')).toBe(false);
    });

    describe('elite', () => {
        it('changes one part of the signal every so often, once the platform\'s shields are down, and the clues with it', () => {
            const { state, campaign, encounter, platform } = createStandingOrders({ elite: true });
            const before = encounter.inspectionSignal;

            // Not while its shields are up, however long that takes.
            state.currentTime += rekeyIntervalMs * 2;
            campaign.tick(0);
            expect(encounter.inspectionSignal).toEqual(before);

            dropShields(platform);
            campaign.tick(0);
            state.currentTime += rekeyIntervalMs;
            campaign.tick(0);

            const after = encounter.inspectionSignal;
            expect(after.delivery).toBe(before.delivery);
            expect([after.modifier !== before.modifier, after.substance !== before.substance].filter(Boolean)).toHaveLength(1);

            campaign.tick(0);
            expect(platform.scienceState.deflectorCard.type).toBe(`deflectorModulated${after.substance}Field`);
        });

        it('makes the old signal wrong, and the new one right', () => {
            const { state, campaign, encounter, ship, platform } = createStandingOrders({ elite: true });
            const before = encounter.inspectionSignal;
            dropShields(platform);
            campaign.tick(0);
            state.currentTime += rekeyIntervalMs;
            campaign.tick(0);

            send(platform, ship, getSignalCardType(before));
            expect(state.encounter!.outcome).toBeNull();

            send(platform, ship, getSignalCardType(encounter.inspectionSignal));
            expect(state.encounter!.outcome).toBe('success');
        });

        it('never changes in the regular form', () => {
            const { state, campaign, encounter, platform } = createStandingOrders();
            const before = encounter.inspectionSignal;

            dropShields(platform);
            campaign.tick(0);
            state.currentTime += rekeyIntervalMs * 3;
            campaign.tick(0);

            expect(encounter.inspectionSignal).toEqual(before);
        });
    });

    describe('played out with the real AI', () => {
        it('the platform stays exactly where it is, turns to face the player ship, and fires on it', () => {
            const { state, ship, platform } = createStandingOrders();
            const start = platform.getPosition(state.currentTime);
            const ownShield = ship.hullState.shield;

            // Off to one side, so it has to turn. The room's timers aren't otherwise running, so those are moved on as well.
            ship.setMotion(new MotionKeyframe(state.currentTime, 6, 8, 0));

            for (let elapsed = 0; elapsed < 90_000; elapsed += 100) {
                state.tick(100);

                for (const delayed of [...rooms.getClock().delayed]) {
                    if (delayed.active) {
                        delayed.tick(100);
                    }
                }
            }

            const end = platform.getPosition(state.currentTime);
            expect(end.x).toBeCloseTo(start.x);
            expect(end.y).toBeCloseTo(start.y);
            expect(end.angle).not.toBeCloseTo(start.angle);
            expect(ship.hullState.shield).toBeLessThan(ownShield);
            expect(state.encounter!.outcome).toBeNull();
        });
    });
});
