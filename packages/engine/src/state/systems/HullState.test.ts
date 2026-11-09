import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { PlayerShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getCardDefinition } from 'src/cards/getEngineCardDefinition';
import { PlayerShip } from 'src/state/PlayerShip';
import { shipSetup, setupGameRoom } from 'src/testUtils';
import { describe, it, expect } from 'vitest';
import { HullSystemTile } from './engineer/HullSystemTile';

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
    return ship.engineerState.systems.find(tile => tile.system === 'hull') as HullSystemTile;
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

    it('keeps the hull tile\'s capacity up to date, even while the shields are down', () => {
        const ship = createShip();
        const tile = getHullTile(ship);
        expect(tile.maxShield).toBe(120);

        ship.hullState.restoreShields();
        tile.adjustEffectLevel('shield', -120);
        expect(tile.hasEffect('shield')).toBe(false);
        expect(tile.maxShield).toBe(120);

        // Damages the first card in the deck, an emitter.
        ship.hullState.adjustHealth(-1);
        expect(tile.maxShield).toBe(105);
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

function drawHullCards(ship: PlayerShip, count: number) {
    for (let i = 0; i < count; i++) {
        ship.hullState.drawFromTop();
    }
}

function bonusLevels(ship: PlayerShip) {
    const tile = getHullTile(ship);
    return {
        reinforced: tile.getEffectLevel('shieldReinforced'),
        braced: tile.getEffectLevel('hullBraced'),
        tunedEnergy: tile.getEffectLevel('shieldTunedEnergy'),
        tunedTorpedo: tile.getEffectLevel('shieldTunedTorpedo'),
    };
}

describe('HullState hit bonuses', () => {
    it('builds up a bonus from each hull card drawn, up to 3 levels of each', () => {
        const ship = createShip();

        drawHullCards(ship, 1);
        expect(bonusLevels(ship)).toEqual({ reinforced: 1, braced: 0, tunedEnergy: 0, tunedTorpedo: 0 });

        // An energy tuning card, then a volatile emitter, which reinforces twice.
        drawHullCards(ship, 2);
        expect(bonusLevels(ship)).toEqual({ reinforced: 3, braced: 0, tunedEnergy: 1, tunedTorpedo: 0 });

        // An emitter, plating and a volatile emitter, then a torpedo tuning card.
        drawHullCards(ship, 4);
        expect(bonusLevels(ship)).toEqual({ reinforced: 3, braced: 1, tunedEnergy: 1, tunedTorpedo: 1 });
    });

    it('adds no bonus when a damaged card is drawn', () => {
        const ship = createShip();
        ship.hullState.deck[0].addTrait('damaged', ExtraTraitType.Normal);

        drawHullCards(ship, 1);

        expect(bonusLevels(ship).reinforced).toBe(0);
    });

    it('uses up the bonuses that reduce a hit, and keeps the rest', () => {
        const ship = createShip();
        ship.hullState.restoreShields();
        drawHullCards(ship, 2);

        // Of 20, the shields absorb 16, and being reinforced makes that drain them by 11.
        expect(hit(ship, 20, 'torpedo')).toBe(4);
        expect(ship.hullState.shield).toBe(109);
        expect(bonusLevels(ship)).toEqual({ reinforced: 0, braced: 0, tunedEnergy: 1, tunedTorpedo: 0 });
    });

    it('knows that phasers are energy weapons', () => {
        const { state, ship } = createShipInState();
        ship.hullState.restoreShields();
        ship.hullState.adjustPowerLevel(2);
        drawHullCards(ship, 2);

        const phaser = getCardDefinition('phaserCannon');
        phaser.fire(state, ship, ship, { cost: 0, damage: 20 }, 100, []);

        // Tuning prevents 10, which is half of the hit, so reinforcement doesn't apply, and isn't used up.
        expect(ship.hullState.shield).toBe(110);
        expect(bonusLevels(ship)).toEqual({ reinforced: 1, braced: 0, tunedEnergy: 0, tunedTorpedo: 0 });
    });

    it('strips the bonuses when scrambled, and adds none until enough hull cards are drawn', () => {
        const ship = createShip();
        const tile = getHullTile(ship);
        drawHullCards(ship, 2);

        ship.hullState.scrambleShields(2);
        expect(bonusLevels(ship)).toEqual({ reinforced: 0, braced: 0, tunedEnergy: 0, tunedTorpedo: 0 });
        expect(tile.getEffectLevel('shieldScrambled')).toBe(2);

        drawHullCards(ship, 2);
        expect(tile.hasEffect('shieldScrambled')).toBe(false);
        expect(bonusLevels(ship).reinforced).toBe(0);

        // Plating.
        drawHullCards(ship, 1);
        expect(bonusLevels(ship).braced).toBe(1);
    });

    it('clears the bonuses and scrambling at the start of an encounter', () => {
        const ship = createShip();
        drawHullCards(ship, 2);
        ship.hullState.scrambleShields(2);
        drawHullCards(ship, 2);
        drawHullCards(ship, 1);

        ship.hullState.restoreShields();

        expect(bonusLevels(ship)).toEqual({ reinforced: 0, braced: 0, tunedEnergy: 0, tunedTorpedo: 0 });
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
