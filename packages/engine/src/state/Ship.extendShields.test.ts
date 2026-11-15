import { extendedShieldsDuration, extendedShieldsRange } from 'common-data/features/ships/utils/extendedShields';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { playerShipSetup } from 'src/campaign/playerShipSetup';
import { createShipSetup, type ShipDesign } from 'src/campaign/shipDesigns';
import { setupGameRoom } from 'src/testUtils';
import { describe, expect, it } from 'vitest';
import { AiShip } from './AiShip';
import { CardState } from './CardState';
import { PlayerShip } from './PlayerShip';
import type { GameState } from './GameState';
import type { Ship } from './Ship';
import type { Damage } from 'common-data/features/space/types/Damage';

const rooms = setupGameRoom();

function createState() {
    const state = rooms.createState();
    state.initFactions([{ id: 'player' }], 'player');
    state.factionRegistry.setEncounterFactions([
        { id: 'clinic', relations: { player: RelationshipType.Friendly, raiders: RelationshipType.Hostile } },
        { id: 'bystanders' },
        { id: 'raiders', relations: { player: RelationshipType.Hostile } },
    ]);
    return state;
}

/** A ship that never acts, at the given distance from the origin. */
function addShip(state: GameState, design: ShipDesign, faction: string, x: number) {
    const ship = new AiShip(state, { ...createShipSetup(design, faction, { x, y: 0, angle: 0 }), priorities: { helm: 0, tactical: 0, science: 0, engineer: 0 } });
    state.add(ship);
    return ship;
}

function extendShields(ship: Ship) {
    ship.engineerState.systems.find(tile => tile.system === 'hull')!.addEffect('shieldsExtended');
}

const hit = (amount: number): Damage => ({ amount, traits: [], targetSystem: 'hull' });

describe('extended shields', () => {
    it('take a hit meant for a friendly ship that is close enough', () => {
        const state = createState();
        // A clinic ship's shields are fully powered, so they absorb all of a hit.
        const extender = addShip(state, 'clinicShip', 'clinic', 0);
        const ward = addShip(state, 'fighter', 'clinic', extendedShieldsRange);
        const wardShield = ward.hullState.shield;
        const wardHealth = ward.hullState.health;
        extendShields(extender);

        expect(extender.hasExtendedShields).toBe(true);
        expect(ward.damage(hit(20))).toBe(0);

        expect(extender.hullState.shield).toBeLessThan(extender.hullState.maxShield);
        expect(ward.hullState.shield).toBe(wardShield);
        expect(ward.hullState.health).toBe(wardHealth);
    });

    it('leave the ship\'s own shields to deal with whatever they let through', () => {
        const state = createState();
        // A fighter's shields aren't fully powered, so some of each hit gets past them.
        const extender = addShip(state, 'fighter', 'clinic', 0);
        const ward = addShip(state, 'clinicShip', 'clinic', 1);
        extendShields(extender);

        expect(ward.damage(hit(20))).toBe(0);

        expect(extender.hullState.shield).toBeLessThan(extender.hullState.maxShield);
        // Less than it would have lost to the whole hit, but not nothing.
        const lost = ward.hullState.maxShield - ward.hullState.shield;
        expect(lost).toBeGreaterThan(0);

        const unprotected = addShip(state, 'clinicShip', 'bystanders', 50);
        unprotected.damage(hit(20));
        expect(lost).toBeLessThan(unprotected.hullState.maxShield - unprotected.hullState.shield);
    });

    it('don\'t reach a ship that is too far away', () => {
        const state = createState();
        const extender = addShip(state, 'clinicShip', 'clinic', 0);
        const ward = addShip(state, 'fighter', 'clinic', extendedShieldsRange + 0.5);
        const wardShield = ward.hullState.shield;
        extendShields(extender);

        ward.damage(hit(20));

        expect(extender.hullState.shield).toBe(extender.hullState.maxShield);
        expect(ward.hullState.shield).toBeLessThan(wardShield);
    });

    it.each(['bystanders', 'raiders'])('don\'t cover a ship of the %s, who aren\'t friends', (faction) => {
        const state = createState();
        const extender = addShip(state, 'clinicShip', 'clinic', 0);
        const other = addShip(state, 'fighter', faction, 1);
        const otherShield = other.hullState.shield;
        extendShields(extender);

        other.damage(hit(20));

        expect(extender.hullState.shield).toBe(extender.hullState.maxShield);
        expect(other.hullState.shield).toBeLessThan(otherShield);
    });

    it('do nothing unless they are extended, and don\'t protect the ship extending them from itself', () => {
        const state = createState();
        const extender = addShip(state, 'clinicShip', 'clinic', 0);
        const ward = addShip(state, 'fighter', 'clinic', 1);

        expect(extender.hasExtendedShields).toBe(false);
        ward.damage(hit(20));
        expect(extender.hullState.shield).toBe(extender.hullState.maxShield);

        // Hits on the ship itself land on its shields as they always do.
        extendShields(extender);
        extender.damage(hit(20));
        expect(extender.hullState.shield).toBeLessThan(extender.hullState.maxShield);
    });

    it('are extended by playing the card, for a while', () => {
        const state = createState();
        const ship = new PlayerShip(state, playerShipSetup);
        state.add(ship);
        ship.startEncounter();

        const card = new CardState(ship.getCardId(), 'extendShields');
        ship.engineerState.addCardToHand(card);
        expect(ship.hasExtendedShields).toBe(false);

        expect(ship.engineerState.playCard(card.id, 'extendShields', 'no-target', '')).not.toBeNull();
        expect(ship.hasExtendedShields).toBe(true);

        const hull = ship.engineerState.systems.find(tile => tile.system === 'hull')!;
        expect(hull.effects.find(effect => effect.type === 'shieldsExtended')).toBeDefined();
        expect(extendedShieldsDuration).toBeGreaterThan(0);
    });

    it('start their time over if the card is played again while they are extended', () => {
        const state = createState();
        const ship = new PlayerShip(state, playerShipSetup);
        state.add(ship);
        ship.startEncounter();
        const hull = ship.engineerState.systems.find(tile => tile.system === 'hull')!;
        const endTime = () => hull.effects.find(effect => effect.type === 'shieldsExtended')?.progress?.endTime;

        for (const delay of [0, 4000]) {
            state.currentTime += delay;
            const card = new CardState(ship.getCardId(), 'extendShields');
            ship.engineerState.addCardToHand(card);
            expect(ship.engineerState.playCard(card.id, 'extendShields', 'no-target', '')).not.toBeNull();
            expect(endTime()).toBe(state.currentTime + extendedShieldsDuration);
        }

        expect(hull.effects.filter(effect => effect.type === 'shieldsExtended')).toHaveLength(1);
    });
});
