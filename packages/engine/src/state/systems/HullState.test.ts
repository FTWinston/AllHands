import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { PlayerShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { PlayerShip } from 'src/state/PlayerShip';
import { shipSetup, setupGameRoom } from 'src/testUtils';
import { describe, it, expect } from 'vitest';

const rooms = setupGameRoom();

const baseSetup = shipSetup(undefined);

// Capacity 3 × 15 = 45. Charge 1, plus the hull's power level (3). Delay 3 emitters - 1 = 2.
const setup: PlayerShipSetupInfo = {
    ...baseSetup,
    hull: {
        ...baseSetup.hull,
        cards: ['hullShieldEmitter', 'hullShieldRegenerator', 'hullShieldEmitter', 'hullShieldEmitter', 'hullShieldDelayReduction'],
    },
};

function createShip() {
    const state = rooms.createState();
    const ship = new PlayerShip(state, setup);
    state.add(ship);
    return ship;
}

function getHullTile(ship: PlayerShip) {
    return ship.engineerState.systems.find(tile => tile.system === 'hull')!;
}

function damageCard(ship: PlayerShip, index: number) {
    ship.hullState.deck[index].addTrait('damaged', ExtraTraitType.Normal);
}

describe('HullState shield stats', () => {
    it('adds up the capacity of every hull card, damaged or not', () => {
        const ship = createShip();
        expect(ship.hullState.maxShield).toBe(45);

        damageCard(ship, 0);
        expect(ship.hullState.maxShield).toBe(45);
    });

    it('adds up the charge of undamaged hull cards, plus the power level', () => {
        const ship = createShip();
        expect(ship.hullState.powerLevel).toBe(3);
        expect(ship.hullState.shieldCharge).toBe(4);

        damageCard(ship, 1);
        expect(ship.hullState.shieldCharge).toBe(3);
    });

    it('doesn\'t charge the shields at all while the hull is unpowered', () => {
        const ship = createShip();
        ship.hullState.adjustPowerLevel(-ship.hullState.powerLevel);

        expect(ship.hullState.shieldCharge).toBe(0);
    });

    it('takes the delay reduction of undamaged hull cards from the delay that every emitter adds', () => {
        const ship = createShip();
        expect(ship.hullState.shieldRechargeDelay).toBe(2);

        damageCard(ship, 0);
        expect(ship.hullState.shieldRechargeDelay).toBe(2);

        damageCard(ship, 4);
        expect(ship.hullState.shieldRechargeDelay).toBe(3);
    });
});

describe('HullState shields', () => {
    it('fills the shields to capacity, which they can\'t exceed', () => {
        const ship = createShip();

        ship.hullState.restoreShields();
        expect(ship.hullState.shield).toBe(45);

        getHullTile(ship).adjustEffectLevel('shield', 10);
        expect(ship.hullState.shield).toBe(45);
        expect(getHullTile(ship).effects.find(effect => effect.type === 'shield')?.maxLevel).toBe(45);
    });

    it('fills the shields at the start of an encounter', () => {
        const ship = createShip();

        ship.startEncounter();

        expect(ship.hullState.shield).toBe(45);
    });

    it('recharges the shields when an undamaged hull card is drawn, but not a damaged one', () => {
        const ship = createShip();

        ship.hullState.drawFromTop();
        expect(ship.hullState.shield).toBe(4);

        damageCard(ship, 0);
        ship.hullState.drawFromTop();
        expect(ship.hullState.shield).toBe(4);
    });

    it('waits for the recharge delay\'s worth of undamaged draws after a hit, before recharging again', () => {
        const ship = createShip();
        const tile = getHullTile(ship);
        ship.hullState.restoreShields();

        ship.damage({ amount: 20, traits: [], targetSystem: 'hull' });
        const shieldAfterHit = ship.hullState.shield;
        expect(shieldAfterHit).toBeLessThan(45);
        expect(tile.getEffectLevel('shieldRecovering')).toBe(2);

        ship.hullState.tickShieldRecharge();
        expect(tile.getEffectLevel('shieldRecovering')).toBe(1);
        ship.hullState.tickShieldRecharge();
        expect(tile.hasEffect('shieldRecovering')).toBe(false);
        expect(ship.hullState.shield).toBe(shieldAfterHit);

        ship.hullState.tickShieldRecharge();
        expect(ship.hullState.shield).toBe(shieldAfterHit + 4);
    });

    it('restarts the recharge delay when hit again', () => {
        const ship = createShip();
        const tile = getHullTile(ship);
        ship.hullState.restoreShields();

        ship.damage({ amount: 10, traits: [], targetSystem: 'hull' });
        ship.hullState.tickShieldRecharge();
        expect(tile.getEffectLevel('shieldRecovering')).toBe(1);

        ship.damage({ amount: 10, traits: [], targetSystem: 'hull' });
        expect(tile.getEffectLevel('shieldRecovering')).toBe(2);
    });

    it('adds to the recharge delay when disrupted, on top of any remaining delay', () => {
        const ship = createShip();
        const tile = getHullTile(ship);
        ship.hullState.restoreShields();

        ship.damage({ amount: 10, traits: [], targetSystem: 'hull' });
        ship.hullState.delayShieldRecovery(3);
        expect(tile.getEffectLevel('shieldRecovering')).toBe(5);
    });

    it('doesn\'t shorten a longer recharge delay when hit', () => {
        const ship = createShip();
        const tile = getHullTile(ship);
        ship.hullState.restoreShields();

        ship.hullState.delayShieldRecovery(4);
        ship.damage({ amount: 10, traits: [], targetSystem: 'hull' });

        expect(tile.getEffectLevel('shieldRecovering')).toBe(4);
    });

    it('blocks the same share of damage at full shields, whatever their capacity', () => {
        const ship = createShip();
        ship.hullState.restoreShields();

        const passedThrough = ship.damage({ amount: 20, traits: [], targetSystem: 'hull' });

        expect(passedThrough).toBe(0);
        expect(ship.hullState.shield).toBe(25);
    });

    it('lowers the shields to their new capacity, and shortens the delay, when an emitter is removed', () => {
        const ship = createShip();
        ship.hullState.restoreShields();

        ship.hullState.removeDeckCard(ship.hullState.deck[0].id);

        expect(ship.hullState.maxShield).toBe(30);
        expect(ship.hullState.shield).toBe(30);
        expect(ship.hullState.shieldRechargeDelay).toBe(1);
        expect(getHullTile(ship).effects.find(effect => effect.type === 'shield')?.maxLevel).toBe(30);
    });
});
