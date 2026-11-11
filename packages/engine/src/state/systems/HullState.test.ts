import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { PlayerShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { isWeaponTrait } from 'src/cards/applyWeaponTrait';
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
        cards: ['hullShieldEmitter', 'hullShieldTuningEnergy', 'hullVolatileEmitter', 'hullShieldEmitter', 'hullBare', 'hullVolatileEmitter', 'hullShieldTuningTorpedo'],
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

function hit(ship: PlayerShip, amount: number, weaponTrait?: 'energyWeapon' | 'torpedoWeapon') {
    return ship.hullState.damageShields({ amount, traits: weaponTrait ? [weaponTrait] : [], targetSystem: 'hull' });
}

function drainShields(ship: PlayerShip, amount: number) {
    const tile = getHullTile(ship);
    tile.setShield(tile.shield - amount);
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

    it('has no shields at all when there are only bare hull cards', () => {
        const ship = createShip(['hullBare', 'hullBare', 'hullBare']);

        ship.startEncounter();

        expect(ship.hullState.maxShield).toBe(0);
        expect(ship.hullState.shield).toBe(0);
    });

    it('fills the shields at the start of an encounter, and they can\'t exceed their capacity', () => {
        const ship = createShip();

        ship.startEncounter();
        expect(ship.hullState.shield).toBe(120);

        getHullTile(ship).setShield(130);
        expect(ship.hullState.shield).toBe(120);
    });

    it('keeps the hull tile\'s capacity up to date, even while the shields are down', () => {
        const ship = createShip();
        const tile = getHullTile(ship);
        expect(tile.maxShield).toBe(120);

        ship.hullState.restoreShields();
        tile.setShield(0);
        expect(tile.shield).toBe(0);
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
        drainShields(ship, 60);

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
        drainShields(ship, 100);

        // Drained by 13, to 7 of 120.
        expect(hit(ship, 20)).toBe(4);
        expect(ship.hullState.shield).toBe(0);
    });
});

function drawHullCards(ship: PlayerShip, count: number) {
    for (let i = 0; i < count; i++) {
        ship.hullState.drawFromTop();
    }
}

/** The shield tuning effects on the ship's hull. */
function shieldTunings(ship: PlayerShip) {
    return getHullTile(ship).effects
        .filter(effect => effect.type !== 'shieldScrambled')
        .map(effect => effect.type);
}

describe('HullState shield tunings', () => {
    it('switches to the tuning of each emitter or tuning card played, replacing the last one', () => {
        const ship = createShip();

        drawHullCards(ship, 1);
        expect(shieldTunings(ship)).toEqual(['shieldReinforced']);

        drawHullCards(ship, 1);
        expect(shieldTunings(ship)).toEqual(['shieldTunedEnergy']);

        // A volatile emitter.
        drawHullCards(ship, 1);
        expect(shieldTunings(ship)).toEqual(['shieldReinforced']);

        // An emitter, bare hull and a volatile emitter, then a torpedo tuning card.
        drawHullCards(ship, 4);
        expect(shieldTunings(ship)).toEqual(['shieldTunedTorpedo']);
    });

    it('keeps the current tuning when bare hull or a damaged card is drawn', () => {
        const ship = createShip(['hullShieldTuningEnergy', 'hullBare', 'hullShieldEmitter']);
        ship.hullState.deck[2].addTrait('damaged', ExtraTraitType.Normal);

        drawHullCards(ship, 3);

        expect(shieldTunings(ship)).toEqual(['shieldTunedEnergy']);
    });

    it('lasts for a while, starting again when the same tuning is played', () => {
        const { state, ship } = createShipInState(['hullShieldEmitter', 'hullShieldEmitter']);

        drawHullCards(ship, 1);
        const tuning = getHullTile(ship).effects.find(effect => effect.type === 'shieldReinforced')!;
        expect(tuning.progress!.endTime - tuning.progress!.startTime).toBe(12_000);

        state.currentTime += 5_000;
        drawHullCards(ship, 1);

        expect(shieldTunings(ship)).toEqual(['shieldReinforced']);
        expect(tuning.progress!.startTime).toBe(state.currentTime);
    });

    it('reduces every hit with the weapon trait the shields are tuned against, but not others', () => {
        const ship = createShip();
        ship.hullState.restoreShields();
        drawHullCards(ship, 2);

        // 40% less makes it a hit of 12, of which 10 is absorbed.
        expect(hit(ship, 20, 'energyWeapon')).toBe(2);
        expect(hit(ship, 20, 'energyWeapon')).toBe(2);
        expect(ship.hullState.shield).toBe(104);

        expect(hit(ship, 20, 'torpedoWeapon')).toBe(4);
        expect(shieldTunings(ship)).toEqual(['shieldTunedEnergy']);
    });

    it('drains reinforced shields less', () => {
        const ship = createShip();
        ship.hullState.restoreShields();
        drawHullCards(ship, 1);

        // Absorbing 16 drains the shields by 10, rather than 13.
        expect(hit(ship, 20)).toBe(4);
        expect(ship.hullState.shield).toBe(110);
    });

    it('reduces phaser hits, as their energy weapon trait is passed on to the damage they do', () => {
        const { state, ship } = createShipInState();
        ship.hullState.restoreShields();
        ship.hullState.adjustPowerLevel(2);
        drawHullCards(ship, 2);

        // Tactical fires a weapon with the weapon traits from its card, as here.
        const phaser = getCardDefinition('phaserCannon');
        const traits = (phaser.traits ?? []).filter(isWeaponTrait);
        expect(traits).toContain('energyWeapon');
        phaser.fire(state, ship, ship, { cost: 0, damage: 20 }, 100, traits);

        // Tuning makes it a hit of 12, all of which is absorbed at full power, for 60% drain.
        expect(ship.hullState.shield).toBe(113);
    });

    it('cancels the tuning when scrambled, and sets none until enough hull cards have tried to', () => {
        const ship = createShip();
        const tile = getHullTile(ship);
        drawHullCards(ship, 2);

        ship.hullState.scrambleShields(2);
        expect(shieldTunings(ship)).toEqual([]);
        expect(tile.getEffectLevel('shieldScrambled')).toBe(2);

        drawHullCards(ship, 2);
        expect(tile.hasEffect('shieldScrambled')).toBe(false);
        expect(shieldTunings(ship)).toEqual([]);

        // Bare hull, then a volatile emitter.
        drawHullCards(ship, 2);
        expect(shieldTunings(ship)).toEqual(['shieldReinforced']);
    });

    it('stays scrambled while bare hull cards are drawn, as they wouldn\'t tune the shields anyway', () => {
        const ship = createShip(['hullBare', 'hullShieldEmitter', 'hullShieldEmitter']);
        const tile = getHullTile(ship);
        ship.hullState.scrambleShields(1);

        drawHullCards(ship, 1);
        expect(tile.getEffectLevel('shieldScrambled')).toBe(1);

        drawHullCards(ship, 1);
        expect(tile.hasEffect('shieldScrambled')).toBe(false);
        expect(shieldTunings(ship)).toEqual([]);

        drawHullCards(ship, 1);
        expect(shieldTunings(ship)).toEqual(['shieldReinforced']);
    });

    it('clears the tuning and scrambling at the start of an encounter', () => {
        const ship = createShip();
        drawHullCards(ship, 2);
        ship.hullState.restoreShields();
        expect(shieldTunings(ship)).toEqual([]);

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
        drainShields(ship, 110);

        hit(ship, 100);

        expect(ship.hullState.health).toBe(5);
        expect(ship.hullState.maxShield).toBe(30);
        expect(ship.hullState.shield).toBe(0);
    });

    it('doesn\'t damage volatile emitters when hit while the shields are already down', () => {
        const ship = createShip();
        ship.hullState.restoreShields();
        drainShields(ship, 120);

        hit(ship, 100);

        expect(ship.hullState.health).toBe(7);
    });
});
