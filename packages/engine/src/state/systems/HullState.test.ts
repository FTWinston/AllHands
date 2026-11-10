import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { PlayerShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getCardDefinition } from 'src/cards/getEngineCardDefinition';
import { PlayerShip } from 'src/state/PlayerShip';
import { shipSetup, setupGameRoom } from 'src/testUtils';
import { describe, it, expect } from 'vitest';
import { HullSystemTile } from './engineer/HullSystemTile';

const rooms = setupGameRoom();

const baseSetup = shipSetup(undefined);

// Capacity 15 + 45 + 15 + 45 = 120. Health 7. The hull's power level is 3, so the shields absorb 80% of each hit, and are drained by 80% of that.
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

        // Absorbing 16 drains the shields by 13.
        expect(hit(ship, 20)).toBe(4);
        expect(ship.hullState.shield).toBe(107);
    });

    it('absorbs everything at full power, for less drain', () => {
        const ship = createShip();
        ship.hullState.restoreShields();
        ship.hullState.adjustPowerLevel(2);

        expect(hit(ship, 20)).toBe(0);
        expect(ship.hullState.shield).toBe(108);
    });

    it('absorbs the same share however empty the shields are', () => {
        const ship = createShip();
        ship.hullState.restoreShields();
        getHullTile(ship).adjustEffectLevel('shield', -60);

        expect(hit(ship, 20)).toBe(4);
        expect(ship.hullState.shield).toBe(47);
    });

    it('absorbs nothing while the hull is unpowered', () => {
        const ship = createShip();
        ship.hullState.restoreShields();
        ship.hullState.adjustPowerLevel(-ship.hullState.powerLevel);

        expect(hit(ship, 20)).toBe(20);
        expect(ship.hullState.shield).toBe(120);
    });

    it('can\'t absorb more than the shields have left to pay for', () => {
        const ship = createShip(['hullShieldEmitter']);
        ship.hullState.restoreShields();
        ship.hullState.adjustPowerLevel(2);

        // At full power, 15 shield pays for 25 damage.
        expect(hit(ship, 50)).toBe(25);
        expect(ship.hullState.shield).toBe(0);
    });

    it('collapses shields that a hit leaves below a tenth of their capacity', () => {
        const ship = createShip();
        ship.hullState.restoreShields();
        getHullTile(ship).adjustEffectLevel('shield', -100);

        // Drained by 13, to 7 of 120.
        expect(hit(ship, 20)).toBe(4);
        expect(ship.hullState.shield).toBe(0);
        expect(getHullTile(ship).hasEffect('shield')).toBe(false);
    });
});

function drawHullCards(ship: PlayerShip, count: number) {
    for (let i = 0; i < count; i++) {
        ship.hullState.drawFromTop();
    }
}

/** The shield mode effects on the ship's hull. */
function shieldModes(ship: PlayerShip) {
    return getHullTile(ship).effects
        .filter(effect => effect.type !== 'shield' && effect.type !== 'shieldScrambled')
        .map(effect => effect.type);
}

describe('HullState shield modes', () => {
    it('switches to the mode of each emitter or tuning card drawn, replacing the last one', () => {
        const ship = createShip();

        drawHullCards(ship, 1);
        expect(shieldModes(ship)).toEqual(['shieldReinforced']);

        drawHullCards(ship, 1);
        expect(shieldModes(ship)).toEqual(['shieldTunedEnergy']);

        // A volatile emitter.
        drawHullCards(ship, 1);
        expect(shieldModes(ship)).toEqual(['shieldReinforced']);

        // An emitter, plating and a volatile emitter, then a torpedo tuning card.
        drawHullCards(ship, 4);
        expect(shieldModes(ship)).toEqual(['shieldTunedTorpedo']);
    });

    it('keeps the current mode when plating or a damaged card is drawn', () => {
        const ship = createShip(['hullShieldTuningEnergy', 'hullPlating', 'hullShieldEmitter']);
        ship.hullState.deck[2].addTrait('damaged', ExtraTraitType.Normal);

        drawHullCards(ship, 3);

        expect(shieldModes(ship)).toEqual(['shieldTunedEnergy']);
    });

    it('lasts for a while, starting again when the same mode is drawn', () => {
        const { state, ship } = createShipInState(['hullShieldEmitter', 'hullShieldEmitter']);

        drawHullCards(ship, 1);
        const mode = getHullTile(ship).effects.find(effect => effect.type === 'shieldReinforced')!;
        expect(mode.progress!.endTime - mode.progress!.startTime).toBe(12_000);

        state.currentTime += 5_000;
        drawHullCards(ship, 1);

        expect(shieldModes(ship)).toEqual(['shieldReinforced']);
        expect(mode.progress!.startTime).toBe(state.currentTime);
    });

    it('reduces every hit of the weapon type the shields are tuned against, but not others', () => {
        const ship = createShip();
        ship.hullState.restoreShields();
        drawHullCards(ship, 2);

        // 40% less makes it a hit of 12, of which 10 is absorbed.
        expect(hit(ship, 20, 'energy')).toBe(2);
        expect(hit(ship, 20, 'energy')).toBe(2);
        expect(ship.hullState.shield).toBe(104);

        expect(hit(ship, 20, 'torpedo')).toBe(4);
        expect(shieldModes(ship)).toEqual(['shieldTunedEnergy']);
    });

    it('drains reinforced shields less', () => {
        const ship = createShip();
        ship.hullState.restoreShields();
        drawHullCards(ship, 1);

        // Absorbing 16 drains the shields by 10, rather than 13.
        expect(hit(ship, 20)).toBe(4);
        expect(ship.hullState.shield).toBe(110);
    });

    it('knows that phasers are energy weapons', () => {
        const { state, ship } = createShipInState();
        ship.hullState.restoreShields();
        ship.hullState.adjustPowerLevel(2);
        drawHullCards(ship, 2);

        const phaser = getCardDefinition('phaserCannon');
        phaser.fire(state, ship, ship, { cost: 0, damage: 20 }, 100, []);

        // Tuning makes it a hit of 12, all of which is absorbed at full power, for 60% drain.
        expect(ship.hullState.shield).toBe(113);
    });

    it('cancels the mode when scrambled, and sets none until enough hull cards are drawn', () => {
        const ship = createShip();
        const tile = getHullTile(ship);
        drawHullCards(ship, 2);

        ship.hullState.scrambleShields(2);
        expect(shieldModes(ship)).toEqual([]);
        expect(tile.getEffectLevel('shieldScrambled')).toBe(2);

        drawHullCards(ship, 2);
        expect(tile.hasEffect('shieldScrambled')).toBe(false);
        expect(shieldModes(ship)).toEqual([]);

        // Plating, then a volatile emitter.
        drawHullCards(ship, 2);
        expect(shieldModes(ship)).toEqual(['shieldReinforced']);
    });

    it('clears the mode and scrambling at the start of an encounter', () => {
        const ship = createShip();
        drawHullCards(ship, 2);
        ship.hullState.restoreShields();
        expect(shieldModes(ship)).toEqual([]);

        ship.hullState.scrambleShields(2);
        ship.hullState.restoreShields();
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
