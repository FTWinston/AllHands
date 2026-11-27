import { cardDefinitions, type CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { getShopCardTypes } from 'common-data/features/cards/utils/getShopCardTypes';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { getAffectedShips } from 'content/systems/science/deflectors/applyDeflector.engine';
import { getDeflectorOutcome } from 'content/systems/science/deflectors/deflectorParts.shared';
import { AiShip } from 'engine/state/AiShip';
import { CardState } from 'engine/state/CardState';
import { MotionKeyframe } from 'engine/state/MotionKeyframe';
import { SensorGhost } from 'engine/state/SensorGhost';
import { setupGameRoom, shipSetup } from 'engine/testUtils';
import { getHostileShips } from 'engine/utils/shipQueries';
import { describe, expect, it, vi } from 'vitest';
import type { CrewRoleName } from 'common-data/features/ships/types/CrewRole';

const rooms = setupGameRoom();

/**
 * A ship of the player's faction at (5, 0), which leaves the ghosts, a friend of it, and a raider hostile to it at the origin, facing it,
 * with weapons, scans and helm cards for it to use on the ghost. Nothing is ticked, so no ship's AI acts.
 */
function createGhostFight() {
    const state = rooms.createState();
    state.initFactions([
        { id: 'player' },
        { id: 'raiders', relations: { player: RelationshipType.Hostile } },
    ], 'player');

    const addShip = (faction: string, x: number, y: number, customise: (setup: ReturnType<typeof shipSetup>) => void = () => {}) => {
        const setup = { ...shipSetup(faction, x, y), goal: { type: 'search-and-destroy' as const }, skill: 1 };
        customise(setup);
        const ship = new AiShip(state, setup);
        state.add(ship);
        return ship;
    };

    const owner = addShip('player', 5, 0);
    const friend = addShip('player', 6, 3);
    const raider = addShip('raiders', 0, 0, (setup) => {
        setup.tactical = { ...setup.tactical, numSlots: 2, cards: ['phaserCannon', 'tractorBeam'], initialHandSize: 2 };
        setup.science = { ...setup.science, cards: ['passiveScan'], initialHandSize: 0 };
        setup.helm = { ...setup.helm, cards: ['orbit'], initialHandSize: 0 };
    });

    const updateKnown = () => {
        for (const ship of [owner, friend, raider]) {
            ship.updateKnownObjects(state.currentTime);
        }
    };
    updateKnown();

    for (const ship of [owner, raider]) {
        ship.scienceState.adjustPowerLevel(5);
        ship.helmState.adjustPowerLevel(5);
        ship.tacticalState.adjustPowerLevel(5);
    }

    /** Puts a card of the given type into the ship's system's hand, unless one is there, and plays it. Says whether it was played. */
    const play = (ship: AiShip, system: CrewRoleName, type: CardType, targetId = '', targetType = cardDefinitions[type].targetType as string) => {
        const systemState = ship.getCrewSystem(system);
        const card = systemState.hand.find(candidate => candidate.type === type) ?? new CardState(ship.getCardId(), type);
        if (!systemState.hand.includes(card)) {
            systemState.addCardToHand(card);
        }
        const played = systemState.playCard(card.id, type, targetType as Parameters<typeof systemState.playCard>[2], targetId) !== null;
        return { card, played };
    };

    /** The owner plays Sensor Ghost, and everyone looks around. Gives the ghost it leaves. */
    const leaveGhost = () => {
        const before = new Set(state.objects.keys());
        const { played } = play(owner, 'science', 'sensorGhost');
        expect(played).toBe(true);
        updateKnown();
        const ghost = [...state.objects.values()].find((object): object is SensorGhost => !before.has(object.id) && object instanceof SensorGhost)!;
        expect(ghost).toBeDefined();
        return ghost;
    };

    return { state, owner, friend, raider, play, leaveGhost, updateKnown };
}

describe('Sensor Ghost', () => {
    it('is an uncommon science card for 2 power that lasts 15 seconds', () => {
        expect(cardDefinitions.sensorGhost).toMatchObject({ targetType: 'no-target', rarity: 'uncommon', system: 'science', parameters: { cost: 2, duration: 15 } });
        expect(getShopCardTypes('science')).toContain('sensorGhost');
    });

    it('leaves an object where the ship is, which looks like the ship', () => {
        const { state, owner, leaveGhost } = createGhostFight();
        owner.setMotion(new MotionKeyframe(state.currentTime, 5, 0, 1.25));

        const ghost = leaveGhost();

        expect(state.objects.get(ghost.id)).toBe(ghost);
        expect(ghost.name).toBe(owner.name);
        expect(ghost.appearance).toBe(owner.appearance);
        expect(ghost.faction).toBe(owner.faction);
        expect(ghost.id).not.toBe(owner.id);
        expect(ghost.getPosition(state.currentTime)).toEqual({ x: 5, y: 0, angle: 1.25 });
    });

    it('stays put, with the ship\'s facing, if the ship is still', () => {
        const { state, owner, leaveGhost } = createGhostFight();
        owner.setMotion(new MotionKeyframe(state.currentTime, 5, 0, 0.5));

        const ghost = leaveGhost();

        expect(ghost.getPosition(state.currentTime + 9000)).toEqual({ x: 5, y: 0, angle: 0.5 });
    });

    it('flies on the way the ship was going when it was left, at the same speed, and keeps its facing', () => {
        const { state, owner, leaveGhost } = createGhostFight();
        const start = state.currentTime;
        // 3 units a second towards the top right (1.5 right and 2 up each second), with the ship's nose pointing elsewhere. A keyframe every 100ms keeps its speed steady.
        owner.setMotion(...Array.from({ length: 41 }, (_, step) => new MotionKeyframe(start + step * 100, 5 + 0.15 * step, 0.2 * step, 0.5)));

        const ghost = leaveGhost();

        // The ship then turns away, which makes no difference to the ghost.
        owner.setMotion(new MotionKeyframe(start, 5, 0, 0.5), new MotionKeyframe(start + 1000, -50, 0, 0.5));

        const later = ghost.getPosition(start + 10_000);
        // It's at the ship's speed, within 15%: the ship's motion curves a little as it starts.
        expect(later.x).toBeGreaterThan(5 + 1.5 * 10 - 3.5);
        expect(later.x).toBeLessThan(5 + 1.5 * 10 + 3.5);
        expect(later.y).toBeGreaterThan(2 * 10 - 3.5);
        expect(later.y).toBeLessThan(2 * 10 + 3.5);
        expect(later.angle).toBeCloseTo(0.5, 5);
    });

    it('is taken for a ship, by the ships hostile to it, and known to be a ghost by everyone else', () => {
        const { owner, friend, raider, leaveGhost } = createGhostFight();

        const ghost = leaveGhost();

        expect(ghost.isTakenForShipBy(raider)).toBe(true);
        expect(ghost.isTakenForShipBy(owner)).toBe(false);
        expect(ghost.isTakenForShipBy(friend)).toBe(false);
    });

    it('is among the objects that a hostile ship knows of, as the ship is', () => {
        const { owner, raider, leaveGhost } = createGhostFight();

        const ghost = leaveGhost();

        expect(raider.knownObjects.has(owner.id)).toBe(true);
        expect(raider.knownObjects.has(ghost.id)).toBe(true);
    });

    it('vanishes after 15 seconds', () => {
        const { state, leaveGhost } = createGhostFight();
        const ghost = leaveGhost();

        state.currentTime += 14_900;
        ghost.tick(0, state.currentTime);
        expect(state.objects.get(ghost.id)).toBe(ghost);

        state.currentTime += 200;
        ghost.tick(0, state.currentTime);
        expect(state.objects.has(ghost.id)).toBe(false);
    });

    it('vanishes if the ship that left it is destroyed', () => {
        const { state, owner, leaveGhost } = createGhostFight();
        const ghost = leaveGhost();

        owner.destroy();
        state.tick(100);

        expect(state.objects.has(ghost.id)).toBe(false);
    });

    it('is a target for a hostile AI ship, which goes for it when it is nearer than the ship', () => {
        const { state, owner, raider, leaveGhost, updateKnown } = createGhostFight();
        const ghost = leaveGhost();

        // The ship flies off, leaving the ghost nearer to the raider.
        owner.setMotion(new MotionKeyframe(state.currentTime, 60, 0, 0));
        updateKnown();
        raider.ai.commander.update(raider.ai.blackboard, state.currentTime);

        expect(raider.ai.blackboard.targetId).toBe(ghost.id);
    });

    it('is never a hostile ship, a ship near anything, or the target of an area effect', () => {
        const { state, owner, raider, leaveGhost } = createGhostFight();
        const ghost = leaveGhost();

        expect(getHostileShips(state)).toEqual([raider]);
        expect(owner.shipsWithin(50)).not.toContain(ghost);
        expect(raider.shipsWithin(50)).not.toContain(ghost);
        expect(raider.nearestFriendlyShip(50)).toBeUndefined();

        const burst = getAffectedShips(state, owner, null, getDeflectorOutcome({ modifier: 'Modulated', substance: 'Antiproton', delivery: 'Burst' }));
        expect(burst).toEqual([raider]);

        // A hit with the area trait on the raider hurts nothing but ships, so the ghost, which is beside it, is left.
        raider.damage({ amount: 4, traits: ['area'], sourceId: owner.id, targetSystem: 'hull' });
        expect(state.objects.has(ghost.id)).toBe(true);
    });

    describe('when it is scanned', () => {
        it('vanishes, spending the scan card, and finds nothing to scan', () => {
            const { state, raider, play, leaveGhost } = createGhostFight();
            const ghost = leaveGhost();
            const science = raider.scienceState;

            const { card, played } = play(raider, 'science', 'passiveScan', `target/${ghost.id}/0`, 'enemy');

            expect(played).toBe(true);
            expect(state.objects.has(ghost.id)).toBe(false);
            expect(science.hand.includes(card)).toBe(false);
            expect(science.scannedShipId).toBeNull();
            expect(science.insight).toBe(0);
            expect(science.ghostExposedTime).toBe(state.currentTime);
        });

        it('vanishes when any other kind of scan is made of it', () => {
            for (const targetKind of ['vuln', 'hand']) {
                const { state, raider, play, leaveGhost } = createGhostFight();
                const ghost = leaveGhost();

                expect(play(raider, 'science', 'passiveScan', `${targetKind}/${ghost.id}/helm`, 'scan').played).toBe(true);

                expect(state.objects.has(ghost.id)).toBe(false);
                expect(raider.scienceState.scannedShipId).toBeNull();
            }
        });

        it('vanishes when the deflector is used on it, which is used as usual', () => {
            const { state, raider, leaveGhost } = createGhostFight();
            const ghost = leaveGhost();
            const science = raider.scienceState;
            const deflector = science.deflectorCard;
            const power = science.powerLevel;

            expect(science.playCard(deflector.id, deflector.type, 'enemy', ghost.id)).not.toBeNull();

            expect(state.objects.has(ghost.id)).toBe(false);
            expect(science.ghostExposedTime).toBe(state.currentTime);
            expect(science.powerLevel).toBeLessThanOrEqual(power);
        });
    });

    describe('when it is shot at', () => {
        it('uses the shot, which does no damage, and vanishes', () => {
            const { state, owner, friend, raider, play, leaveGhost } = createGhostFight();
            const ghost = leaveGhost();
            const tactical = raider.tacticalState;
            const slot = tactical.slots[0];
            play(raider, 'tactical', 'phaserCannon', slot.id);
            slot.addCharge(slot.getParameter('totalCharge'), state.currentTime);
            const chargeBefore = slot.charge;
            const damage = vi.spyOn(owner, 'damage');
            const friendDamage = vi.spyOn(friend, 'damage');
            const effects = vi.spyOn(state, 'broadcastWeaponEffect');
            const hull = owner.hullState.health;

            expect(tactical.playWeapon(slot, 'phaserCannon', ghost.id)).not.toBeNull();

            expect(state.objects.has(ghost.id)).toBe(false);
            expect(slot.charge).toBeLessThan(chargeBefore);
            expect(damage).not.toHaveBeenCalled();
            expect(friendDamage).not.toHaveBeenCalled();
            expect(owner.hullState.health).toBe(hull);
            expect(effects).toHaveBeenCalledWith(expect.objectContaining({ type: 'shot', weapon: 'phaserCannon', targetId: ghost.id, missed: true }));
        });

        it('spends a tractor beam, which holds nothing', () => {
            const { state, owner, raider, play, leaveGhost } = createGhostFight();
            const ghost = leaveGhost();
            const tactical = raider.tacticalState;
            const slot = tactical.slots[0];
            play(raider, 'tactical', 'tractorBeam', slot.id);
            slot.addCharge(slot.getParameter('totalCharge'), state.currentTime);

            expect(tactical.playWeapon(slot, 'tractorBeam', ghost.id)).not.toBeNull();

            expect(state.objects.has(ghost.id)).toBe(false);
            expect(owner.helmState.hasEffect('heldByTractorBeam')).toBe(false);
            expect(raider.helmState.hasEffect('tractorBeamEngaged')).toBe(false);
        });
    });

    describe('when another card is played on it', () => {
        it('spends Acquire Lock, which locks nothing, and vanishes', () => {
            const { state, raider, play, leaveGhost } = createGhostFight();
            const ghost = leaveGhost();

            const { card, played } = play(raider, 'tactical', 'acquireLock', ghost.id);

            expect(played).toBe(true);
            expect(state.objects.has(ghost.id)).toBe(false);
            expect(raider.tacticalState.hand.includes(card)).toBe(false);
            expect(raider.tacticalState.lockLevel).toBe(0);
        });

        it('is a ship to fly relative to for the helm of a ship it fools, until it vanishes', () => {
            const { state, raider, play, leaveGhost } = createGhostFight();
            const ghost = leaveGhost();
            const helm = raider.helmState;

            expect(helm.resolveShipTarget(ghost.id)).toBe(ghost);
            expect(play(raider, 'helm', 'orbit', ghost.id).played).toBe(true);
            expect(helm.activeManeuver).not.toBeNull();

            ghost.expose();
            // The helm notices the target has gone, calls the manoeuvre off, and the next update ends it.
            helm.update(state.currentTime + 100);
            helm.update(state.currentTime + 200);

            expect(helm.activeManeuver).toBeNull();
        });

        it('is not a ship to fly relative to for the helm of its own side', () => {
            const { friend, owner, play, leaveGhost } = createGhostFight();
            const ghost = leaveGhost();

            expect(owner.helmState.resolveShipTarget(ghost.id)).toBeNull();
            expect(friend.helmState.resolveShipTarget(ghost.id)).toBeNull();
            expect(play(owner, 'helm', 'orbit', ghost.id).played).toBe(false);
        });
    });
});
