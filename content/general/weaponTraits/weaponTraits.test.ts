import { WeaponTrait } from 'common-data/features/cards/types/CardTrait';
import { areaDamagePercent, areaRadius, drainingPowerLoss, persistentDamagePerTick } from 'common-data/features/cards/utils/weaponTraitStats';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { Damage } from 'common-data/features/space/types/Damage';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { playerShipSetup } from 'engine/campaign/playerShipSetup';
import { createShipSetup } from 'engine/campaign/shipDesigns';
import { AiShip } from 'engine/state/AiShip';
import { CardState } from 'engine/state/CardState';
import { PlayerShip } from 'engine/state/PlayerShip';
import { Ship } from 'engine/state/Ship';
import { setupGameRoom } from 'engine/testUtils';
import { describe, expect, it } from 'vitest';
import { disruptedDamage, persistentDamageDuration, persistentDamageInterval, powerDrainDuration, systemDisabledDuration } from './weaponTraits.shared';

const rooms = setupGameRoom();

function createWorld() {
    const state = rooms.createState();
    state.initFactions([{ id: 'player' }], 'player');
    state.factionRegistry.setEncounterFactions([{ id: 'raiders', relations: { player: RelationshipType.Hostile } }]);

    const target = new PlayerShip(state, playerShipSetup);
    state.add(target);
    target.startEncounter();

    const addShip = (x: number) => {
        const other = new AiShip(state, createShipSetup('waterModule', 'raiders', { x, y: 0, angle: 0 }));
        state.add(other);
        return other;
    };

    const tile = (system: ShipSystem) => target.engineerState.systems.find(candidate => candidate.system === system)!;

    /** A hit that does no damage of its own, so only its traits do anything. */
    const hit = (system: ShipSystem, ...traits: WeaponTrait[]) => target.damage({ amount: 0, traits, targetSystem: system });

    /** Moves the game clock on, and lets effects run out or tick. */
    const wait = (time: number) => {
        state.currentTime += time;
        state.tick(0);
    };

    return { state, target, addShip, tile, hit, wait };
}

describe('the draining weapon trait', () => {
    it('takes power from the system hit for a while, and another hit starts that time over without taking more', () => {
        const { target, tile, hit, wait } = createWorld();
        expect(drainingPowerLoss).toBe(1);
        expect(powerDrainDuration).toBe(8_000);
        const power = target.helmState.powerLevel;

        hit('helm', 'draining');
        expect(tile('helm').getEffectLevel('powerDrain')).toBe(drainingPowerLoss);
        expect(target.helmState.powerLevel).toBe(power - drainingPowerLoss);

        wait(powerDrainDuration - 1);
        hit('helm', 'draining');
        expect(target.helmState.powerLevel).toBe(power - drainingPowerLoss);

        wait(powerDrainDuration - 1);
        expect(target.helmState.powerLevel).toBe(power - drainingPowerLoss);

        wait(1);
        expect(tile('helm').hasEffect('powerDrain')).toBe(false);
        expect(target.helmState.powerLevel).toBe(power);
    });
});

describe('the persistent weapon trait', () => {
    it('damages the system hit every 2 seconds for 8 seconds', () => {
        const { target, tile, hit, wait } = createWorld();
        expect(persistentDamagePerTick).toBe(1);
        expect(persistentDamageInterval).toBe(2_000);
        expect(persistentDamageDuration).toBe(8_000);
        const health = target.tacticalState.health;

        hit('tactical', 'persistent');
        expect(tile('tactical').getEffectLevel('persistentDamage')).toBe(persistentDamagePerTick);
        expect(target.tacticalState.health).toBe(health);

        wait(persistentDamageInterval);
        expect(target.tacticalState.health).toBe(health - 1);

        wait(persistentDamageInterval);
        wait(persistentDamageInterval);
        expect(target.tacticalState.health).toBe(health - 3);

        wait(persistentDamageInterval);
        expect(tile('tactical').hasEffect('persistentDamage')).toBe(false);

        const healthAfter = target.tacticalState.health;
        wait(persistentDamageInterval * 2);
        expect(target.tacticalState.health).toBe(healthAfter);
    });
});

describe('the disabling weapon trait', () => {
    it('makes every card in the crew system\'s hand unplayable, and any it draws, for a while', () => {
        const { target, tile, hit, wait } = createWorld();
        expect(systemDisabledDuration).toBe(4_000);
        const helm = target.helmState;
        expect(helm.hand.length).toBeGreaterThan(0);

        hit('helm', 'disabling');
        expect(tile('helm').hasEffect('systemDisabled')).toBe(true);
        expect(helm.hand.every(card => card.hasTrait('unplayable'))).toBe(true);

        const [card] = helm.hand;
        expect(helm.playCard(card.id, card.type, 'location', '')).toBeNull();

        helm.drawFromTop();
        expect(helm.hand.every(card => card.hasTrait('unplayable'))).toBe(true);

        wait(systemDisabledDuration);
        expect(tile('helm').hasEffect('systemDisabled')).toBe(false);
        expect(helm.hand.some(card => card.hasTrait('unplayable'))).toBe(false);
    });

    it('does nothing to a system that doesn\'t play cards by choice', () => {
        const { tile, hit } = createWorld();

        hit('hull', 'disabling');
        expect(tile('hull').hasEffect('systemDisabled')).toBe(false);
    });
});

describe('the disrupting weapon trait', () => {
    it('puts a Disrupted card in the crew system\'s hand, which damages that system when played, and is used up', () => {
        const { target, hit } = createWorld();
        expect(disruptedDamage).toBe(2);
        const engineer = target.engineerState;

        hit('engineer', 'disrupting');
        const disrupted = engineer.hand.find(card => card.type === 'disruptedEngineer')!;
        expect(disrupted).toBeDefined();
        expect(disrupted.hasTrait('priority')).toBe(true);
        expect(engineer.discardCard(disrupted.id)).toBe(false);

        const health = engineer.health;
        expect(engineer.playCard(disrupted.id, 'disruptedEngineer', 'no-target', '')).not.toBeNull();
        expect(engineer.health).toBe(health - disruptedDamage);
        expect(engineer.hand).not.toContain(disrupted);
        expect(engineer.deck).not.toContain(disrupted);
    });

    it('makes room for it in a full hand', () => {
        const { target, hit } = createWorld();
        const science = target.scienceState;
        while (science.hand.length < science.maxHandSize) {
            science.addCardToHand(new CardState(target.getCardId(), 'jam'));
        }

        hit('science', 'disrupting');
        expect(science.hand.length).toBe(science.maxHandSize);
        expect(science.hand.some(card => card.type === 'disruptedScience')).toBe(true);
    });

    it('does nothing to a system without a hand of its own', () => {
        const { target, hit } = createWorld();

        hit('hull', 'disrupting');
        expect(target.hullState.hand.some(card => card.type.startsWith('disrupted'))).toBe(false);
    });
});

describe('the area weapon trait', () => {
    it('hits every other ship close to the one hit, apart from the ship that fired, with half the damage', () => {
        const { target, addShip } = createWorld();
        expect(areaRadius).toBe(4);
        expect(areaDamagePercent).toBe(50);

        const shooter = addShip(2);
        const near = addShip(areaRadius - 1);
        const far = addShip(areaRadius + 1);

        const hitsOn = (ship: Ship) => {
            const hits: Damage[] = [];
            ship.hitReceived.addListener('test', ({ damage }) => hits.push({ ...damage }));
            return hits;
        };
        const shooterHits = hitsOn(shooter);
        const nearHits = hitsOn(near);
        const farHits = hitsOn(far);

        target.damage({ amount: 40, traits: ['torpedoWeapon', 'area'], targetSystem: 'helm', sourceId: shooter.id });

        // Shields tuned against torpedoes still reduce the blast, but it doesn't spread again.
        expect(nearHits).toEqual([expect.objectContaining({ amount: 20, traits: ['torpedoWeapon'], sourceId: shooter.id })]);
        expect(farHits).toEqual([]);
        expect(shooterHits).toEqual([]);
    });
});

describe('the penetrating and dampening weapon traits', () => {
    it('let more of a hit past the shields, and drain them more, as the hit is taken', () => {
        const { state } = createWorld();

        // Each hit is on a ship of its own, with full shields.
        const passedThrough = (...traits: WeaponTrait[]) => {
            const target = new PlayerShip(state, playerShipSetup);
            state.add(target);
            target.startEncounter();
            const shield = target.hullState.shield;
            const damage = target.hullState.damageShields({ amount: 40, traits, targetSystem: 'hull' });
            return { damage, drain: shield - target.hullState.shield };
        };

        const plain = passedThrough();
        expect(plain.drain).toBeGreaterThan(0);
        expect(passedThrough('penetrating').damage).toBeGreaterThan(plain.damage);
        expect(passedThrough('dampening').drain).toBeGreaterThan(plain.drain);
    });
});
