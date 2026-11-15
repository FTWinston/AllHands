import { ShipSystem, shipSystems } from 'common-data/features/ships/types/ShipSystem';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { WeaponEffect, projectileFlightTime } from 'common-data/features/space/types/WeaponEffect';
import { IRandom } from 'common-data/types/IRandom';
import { getCardDefinition } from 'engine/cards/getEngineCardDefinition';
import { AiShip } from 'engine/state/AiShip';
import { seededRandom, setupGameRoom, shipSetup } from 'engine/testUtils';
import { describe, expect, it, vi } from 'vitest';
import type { EngineWeaponSlotCardDefinition } from 'engine/cards/EngineCardDefinition';

const rooms = setupGameRoom();

function createFight(random?: IRandom) {
    const state = rooms.createState(random);
    state.initFactions([
        { id: 'player' },
        { id: 'raiders', relations: { player: RelationshipType.Hostile } },
    ], 'player');

    const setup = { ...shipSetup('raiders'), goal: { type: 'search-and-destroy' as const }, skill: 1 };
    const ship = new AiShip(state, setup);
    // The target has no shields, so every hit gets through, and enough cards in each system to take several.
    const target = new AiShip(state, {
        ...setup,
        hull: { ...setup.hull, cards: Array(10).fill('hullBare') },
        helm: { ...setup.helm, cards: Array(10).fill('exampleNoTarget') },
        tactical: { ...setup.tactical, cards: Array(10).fill('exampleNoTarget') },
    });
    state.add(ship);
    state.add(target);

    const effects: WeaponEffect[] = [];
    vi.spyOn(state, 'broadcastWeaponEffect').mockImplementation((effect) => {
        effects.push(effect);
    });
    const damage = vi.spyOn(target, 'damage');
    const setTimeout = vi.spyOn(state, 'setTimeout');

    const fire = (weapon: string, accuracy: number, targetSystem: ShipSystem | null = null) => {
        const card = getCardDefinition(weapon as never) as EngineWeaponSlotCardDefinition;
        card.fire(state, ship, target, { cost: 0, damage: 5 }, accuracy, [], targetSystem);
    };

    const landProjectile = () => setTimeout.mock.calls[0][0]();

    return { state, ship, target, effects, damage, setTimeout, fire, landProjectile };
}

describe('firing weapons', () => {
    it('lands a beam straight away, telling clients how much got through', () => {
        const { effects, damage, fire } = createFight();

        fire('phaserCannon', 100);

        expect(damage).toHaveBeenCalledOnce();
        expect(effects[0].type).toBe('shot');
        expect(effects.map(effect => effect.type)).toContain('impact');
        expect(effects[0]).toMatchObject({ weapon: 'phaserCannon' });
        expect(effects[0]).not.toHaveProperty('missed', true);
    });

    it('holds back a projectile\'s damage for the time it takes to fly', () => {
        const { effects, damage, setTimeout, fire } = createFight();

        fire('photonTorpedo', 100);

        expect(damage).not.toHaveBeenCalled();
        expect(effects.map(effect => effect.type)).toEqual(['shot']);
        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), projectileFlightTime);
    });

    it('lands a projectile with an impact once its flight is over', () => {
        const { effects, damage, fire, landProjectile } = createFight();

        fire('photonTorpedo', 100);
        landProjectile();

        expect(damage).toHaveBeenCalledOnce();
        expect(effects[0].type).toBe('shot');
        expect(effects.map(effect => effect.type)).toContain('impact');
    });

    it('does no damage when a projectile arrives at a target that has gone', () => {
        const { target, effects, damage, fire, landProjectile } = createFight();

        fire('photonTorpedo', 100);
        target.destroy();
        landProjectile();

        expect(damage).not.toHaveBeenCalled();
        expect(effects.map(effect => effect.type)).toEqual(['shot', 'explosion']);
    });

    it('never lands a shot that missed, and says that it missed', () => {
        const { effects, damage, setTimeout, fire } = createFight();

        fire('photonTorpedo', 0);

        expect(damage).not.toHaveBeenCalled();
        expect(setTimeout).not.toHaveBeenCalled();
        expect(effects).toEqual([expect.objectContaining({ type: 'shot', missed: true })]);
    });

    it.each(['phaserCannon', 'photonTorpedo'])('lands an aimed %s on the system aimed at, with 60%% of the damage there and the rest on the hull', (weapon) => {
        const { target, fire, setTimeout } = createFight();

        fire(weapon, 100, 'tactical');
        for (const [land] of setTimeout.mock.calls) {
            land();
        }

        // 5 damage: 3 to tactical, 2 to the hull.
        expect(target.tacticalState.health).toBe(7);
        expect(target.hullState.health).toBe(8);
        expect(target.helmState.health).toBe(10);
    });

    it('leaves an unaimed shot to land on a system picked at random', () => {
        const { state, target, fire } = createFight();
        const pick = vi.spyOn(state.random, 'pick').mockReturnValueOnce('helm');

        fire('phaserCannon', 100);

        expect(pick).toHaveBeenCalledWith(shipSystems);
        expect(target.helmState.health).toBe(7);
        expect(target.hullState.health).toBe(8);
        expect(target.tacticalState.health).toBe(10);
    });

    it('uses up the same random numbers whether a shot is aimed or not, so aiming doesn\'t change what comes after it', () => {
        const nextRandomAfter = (targetSystem: ShipSystem | null) => {
            const random = seededRandom(7);
            const { fire } = createFight(random);
            fire('phaserCannon', 100, targetSystem);
            return random.getFloat();
        };

        expect(nextRandomAfter('tactical')).toBe(nextRandomAfter(null));
    });

    it('says which ship fired, aimed or not', () => {
        const { ship, damage, fire } = createFight();

        fire('phaserCannon', 100, 'helm');
        fire('phaserCannon', 100);

        expect(damage).toHaveBeenCalledTimes(2);
        for (const [hit] of damage.mock.calls) {
            expect(hit.sourceId).toBe(ship.id);
        }
    });
});
