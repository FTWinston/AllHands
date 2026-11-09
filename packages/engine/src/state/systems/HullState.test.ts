import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { PlayerShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getCardDefinition } from 'src/cards/getEngineCardDefinition';
import { PlayerShip } from 'src/state/PlayerShip';
import { shipSetup, setupGameRoom } from 'src/testUtils';
import { describe, it, expect } from 'vitest';

const rooms = setupGameRoom();

const baseSetup = shipSetup(undefined);

// Capacity 15 + 45 + 15 + 45 = 120. Health 7. The hull's power level is 3, so full shields absorb 80% of each hit.
const setup: PlayerShipSetupInfo = {
    ...baseSetup,
    hull: {
        ...baseSetup.hull,
        cards: ['hullShieldEmitter', 'hullShieldTuningEnergy', 'hullVolatileEmitter', 'hullShieldEmitter', 'hullPlating', 'hullVolatileEmitter', 'hullShieldTuningTorpedo'],
    },
};

function createShipInState(cards = setup.hull.cards) {
    const state = rooms.createState();
    const ship = new PlayerShip(state, { ...setup, hull: { ...setup.hull, cards } });
    state.add(ship);
    return { state, ship };
}

function createShip(cards = setup.hull.cards) {
    return createShipInState(cards).ship;
}

function getHullTile(ship: PlayerShip) {
    return ship.engineerState.systems.find(tile => tile.system === 'hull')!;
}

function hit(ship: PlayerShip, amount: number, weaponType?: 'energy' | 'torpedo') {
    return ship.hullState.damageShields({ amount, traits: [], weaponType, targetSystem: 'hull' });
}

describe('HullState shield capacity', () => {
    it('adds up the capacity of undamaged hull cards, including stabilised ones', () => {
        const ship = createShip();
        expect(ship.hullState.maxShield).toBe(120);

        ship.hullState.deck[0].addTrait('damaged', ExtraTraitType.Normal);
        expect(ship.hullState.maxShield).toBe(105);

        ship.hullState.deck[3].addTrait('stabilised', ExtraTraitType.Normal);
        expect(ship.hullState.maxShield).toBe(105);
    });

    it('has no shields at all when there are only plating cards', () => {
        const ship = createShip(['hullPlating', 'hullPlating', 'hullPlating']);

        ship.startEncounter();

        expect(ship.hullState.maxShield).toBe(0);
        expect(getHullTile(ship).hasEffect('shield')).toBe(false);
    });

    it('fills the shields at the start of an encounter, and they can\'t exceed their capacity', () => {
        const ship = createShip();

        ship.startEncounter();
        expect(ship.hullState.shield).toBe(120);

        getHullTile(ship).adjustEffectLevel('shield', 10);
        expect(ship.hullState.shield).toBe(120);
        expect(getHullTile(ship).effects.find(effect => effect.type === 'shield')?.maxLevel).toBe(120);
    });

    it('lowers the shields to their new capacity when an emitter is damaged', () => {
        const ship = createShip();
        ship.hullState.restoreShields();

        // Damages the first card in the deck, an emitter.
        ship.hullState.adjustHealth(-1);

        expect(ship.hullState.maxShield).toBe(105);
        expect(ship.hullState.shield).toBe(105);
    });
});

describe('HullState absorbing damage', () => {
    it('doesn\'t recharge the shields as hull cards are drawn', () => {
        const ship = createShip();
        ship.hullState.restoreShields();
        hit(ship, 50);

        const shieldAfterHit = ship.hullState.shield;
        ship.hullState.drawFromTop();
        ship.hullState.drawFromTop();

        expect(ship.hullState.shield).toBe(shieldAfterHit);
    });

    it('absorbs a share of each hit set by the hull\'s power level, and lets the rest through', () => {
        const ship = createShip();
        ship.hullState.restoreShields();

        expect(hit(ship, 20)).toBe(4);
        expect(ship.hullState.shield).toBe(104);
    });

    it('absorbs everything at full power, while the shields are full', () => {
        const ship = createShip();
        ship.hullState.restoreShields();
        ship.hullState.adjustPowerLevel(2);

        expect(hit(ship, 20)).toBe(0);
        expect(ship.hullState.shield).toBe(100);
    });

    it('absorbs less the emptier the shields are, even at full power', () => {
        const ship = createShip();
        ship.hullState.restoreShields();
        ship.hullState.adjustPowerLevel(2);
        getHullTile(ship).adjustEffectLevel('shield', -60);

        // Half full, so 1 - (1/2)² of it is absorbed.
        expect(hit(ship, 20)).toBe(5);
    });

    it('absorbs nothing while the hull is unpowered', () => {
        const ship = createShip();
        ship.hullState.restoreShields();
        ship.hullState.adjustPowerLevel(-ship.hullState.powerLevel);

        expect(hit(ship, 20)).toBe(20);
        expect(ship.hullState.shield).toBe(120);
    });

    it('can\'t absorb more than the shields have left', () => {
        const ship = createShip(['hullShieldEmitter']);
        ship.hullState.restoreShields();
        ship.hullState.adjustPowerLevel(2);

        expect(hit(ship, 50)).toBe(35);
        expect(ship.hullState.shield).toBe(0);
    });
});

describe('HullState shield tuning', () => {
    it('tunes the shields as each hull card is drawn', () => {
        const ship = createShip();

        ship.hullState.drawFromTop();
        expect(ship.hullState.shieldTuning).toBeNull();

        ship.hullState.drawFromTop();
        expect(ship.hullState.shieldTuning).toBe('energy');
        expect(getHullTile(ship).hasEffect('shieldTunedEnergy')).toBe(true);

        ship.hullState.drawFromTop();
        expect(ship.hullState.shieldTuning).toBeNull();
        expect(getHullTile(ship).hasEffect('shieldTunedEnergy')).toBe(false);
    });

    it('doesn\'t tune the shields when a damaged tuning card is drawn', () => {
        const ship = createShip();
        ship.hullState.deck[1].addTrait('damaged', ExtraTraitType.Normal);

        ship.hullState.drawFromTop();
        ship.hullState.drawFromTop();

        expect(ship.hullState.shieldTuning).toBeNull();
    });

    it.each([
        // 80% + 20%.
        ['energy', 0],
        // 80% - 10%.
        ['torpedo', 6],
        [undefined, 6],
    ] as const)('absorbs more from the weapon type the shields are tuned against, and less from anything else (%s)', (weaponType, passedThrough) => {
        const ship = createShip();
        ship.hullState.restoreShields();
        ship.hullState.drawFromTop();
        ship.hullState.drawFromTop();

        expect(hit(ship, 20, weaponType)).toBe(passedThrough);
    });

    it('knows that phasers are energy weapons', () => {
        const { state, ship } = createShipInState();
        ship.hullState.restoreShields();
        ship.hullState.drawFromTop();
        ship.hullState.drawFromTop();

        const phaser = getCardDefinition('phaserCannon');
        phaser.fire(state, ship, ship, { cost: 0, damage: 20 }, 100, []);

        // Tuned against energy weapons, so all of it is absorbed.
        expect(ship.hullState.shield).toBe(100);
    });

    it('stays untuned while scrambled, until enough hull cards are drawn', () => {
        const ship = createShip();
        const tile = getHullTile(ship);
        ship.hullState.drawFromTop();
        ship.hullState.drawFromTop();

        ship.hullState.scrambleShields(2);
        expect(ship.hullState.shieldTuning).toBeNull();
        expect(tile.getEffectLevel('shieldScrambled')).toBe(2);

        ship.hullState.drawFromTop();
        ship.hullState.drawFromTop();
        expect(tile.hasEffect('shieldScrambled')).toBe(false);

        ship.hullState.drawFromTop();
        ship.hullState.drawFromTop();
        ship.hullState.drawFromTop();
        expect(ship.hullState.shieldTuning).toBe('torpedo');
    });

    it('clears the tuning and scrambling at the start of an encounter', () => {
        const ship = createShip();
        ship.hullState.drawFromTop();
        ship.hullState.drawFromTop();
        ship.hullState.scrambleShields(2);

        ship.hullState.restoreShields();

        expect(ship.hullState.shieldTuning).toBeNull();
        expect(getHullTile(ship).hasEffect('shieldScrambled')).toBe(false);
    });
});

describe('HullState volatile emitters', () => {
    it('damages every volatile emitter when one is damaged', () => {
        const ship = createShip();
        ship.hullState.restoreShields();

        // Damages the first three cards in the deck: an emitter, a tuning card, and a volatile emitter, which takes the other with it.
        ship.hullState.adjustHealth(-3);

        expect(ship.hullState.health).toBe(3);
        expect(ship.hullState.maxShield).toBe(15);
        expect(ship.hullState.shield).toBe(15);
    });

    it('damages every volatile emitter when the shields are knocked out', () => {
        const ship = createShip();
        ship.hullState.restoreShields();
        getHullTile(ship).adjustEffectLevel('shield', -110);

        hit(ship, 100);

        expect(ship.hullState.health).toBe(5);
        expect(ship.hullState.maxShield).toBe(30);
        expect(ship.hullState.shield).toBe(0);
    });

    it('doesn\'t damage volatile emitters when hit while the shields are already down', () => {
        const ship = createShip();
        ship.hullState.restoreShields();
        getHullTile(ship).adjustEffectLevel('shield', -120);

        hit(ship, 100);

        expect(ship.hullState.health).toBe(7);
    });
});
