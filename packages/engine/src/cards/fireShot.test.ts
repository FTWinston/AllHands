import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { WeaponEffect, projectileFlightTime } from 'common-data/features/space/types/WeaponEffect';
import { AiShip } from 'src/state/AiShip';
import { setupGameRoom, shipSetup } from 'src/testUtils';
import { describe, expect, it, vi } from 'vitest';
import { getCardDefinition } from './getEngineCardDefinition';
import type { EngineWeaponSlotCardDefinition } from './EngineCardDefinition';

const rooms = setupGameRoom();

function createFight() {
    const state = rooms.createState();
    state.initFactions([
        { id: 'player' },
        { id: 'raiders', relations: { player: RelationshipType.Hostile } },
    ], 'player');

    const setup = { ...shipSetup('raiders'), goal: { type: 'search-and-destroy' as const }, skill: 1 };
    const ship = new AiShip(state, setup);
    const target = new AiShip(state, setup);
    state.add(ship);
    state.add(target);

    const effects: WeaponEffect[] = [];
    vi.spyOn(state, 'broadcastWeaponEffect').mockImplementation((effect) => {
        effects.push(effect);
    });
    const damage = vi.spyOn(target, 'damage');
    const setTimeout = vi.spyOn(state, 'setTimeout');

    const fire = (weapon: string, accuracy: number) => {
        const card = getCardDefinition(weapon as never) as EngineWeaponSlotCardDefinition;
        card.fire(state, ship, target, { cost: 0, damage: 5 }, accuracy, []);
    };

    const landProjectile = () => setTimeout.mock.calls[0][0]();

    return { target, effects, damage, setTimeout, fire, landProjectile };
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
});
