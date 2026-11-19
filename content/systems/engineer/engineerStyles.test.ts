import { cardDefinitions, type CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { getShopCardTypes } from 'common-data/features/cards/utils/getShopCardTypes';
import { systemEffectDefinitions } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { playerShipSetup } from 'engine/campaign/playerShipSetup';
import { createShipSetup } from 'engine/campaign/shipDesigns';
import { getCardSynergy, getSynergyCardTypes } from 'engine/cards/cardSynergies';
import { AiShip } from 'engine/state/AiShip';
import { CardState } from 'engine/state/CardState';
import { PlayerShip } from 'engine/state/PlayerShip';
import { setupGameRoom } from 'engine/testUtils';
import { describe, expect, it } from 'vitest';
import {
    autoDestructConfirmationsNeeded, autoDestructConfirmWindow, autoDestructDamage, autoDestructDuration, autoDestructRange, bankPowerCharge, bankPowerDuration, bankPowerLoss,
    burnoutDuration, burnoutPowerPerLevel, busLinkDuration, chargeMaxLevel, dischargeDuration,
    emergencyPowerDuration, emergencyPowerFlux, emergencyPowerGain, fluxLimit, railFeedDuration, redlineFluxInterval, redlinePowerGain, runQuietChargeInterval,
    ventShieldsDownDuration,
} from './engineer.shared';
import type { ShipSystem } from 'common-data/features/ships/types/ShipSystem';

const rooms = setupGameRoom();

function createShip() {
    const state = rooms.createState();
    const ship = new PlayerShip(state, playerShipSetup);
    state.add(ship);
    ship.startEncounter();

    const tile = (system: ShipSystem) => ship.engineerState.systems.find(candidate => candidate.system === system)!;

    /** Plays a new card of the given type from the engineer's hand, on a system if one is given, and says whether it was played. */
    const play = (type: CardType, system?: ShipSystem) => {
        const card = new CardState(ship.getCardId(), type);
        ship.engineerState.addCardToHand(card);
        const played = ship.engineerState.playCard(card.id, type, system ? 'system' : 'no-target', system ?? '') !== null;
        ship.engineerState.removeCard(card.id);
        return played;
    };

    /** Plays one of a choice card's options, from a new card of that choice type in the engineer's hand, and says whether it was played. */
    const playChoice = (choiceType: CardType, type: CardType, system?: ShipSystem) => {
        const card = new CardState(ship.getCardId(), choiceType);
        ship.engineerState.addCardToHand(card);
        const played = ship.engineerState.playCard(card.id, type, system ? 'system' : 'no-target', system ?? '') !== null;
        ship.engineerState.removeCard(card.id);
        return played;
    };

    /** Moves the game clock on, and lets effects run out or tick. */
    const wait = (time: number) => {
        state.currentTime += time;
        state.tick(0);
    };

    return { state, ship, tile, play, playChoice, wait };
}

describe('Charge', () => {
    it('stays on a system for as long as it likes, up to a limit', () => {
        const { tile, wait } = createShip();

        tile('helm').adjustEffectLevel('charge', 2);
        expect(tile('helm').effects.find(effect => effect.type === 'charge')!.progress).toBeNull();

        wait(600_000);
        expect(tile('helm').getEffectLevel('charge')).toBe(2);

        tile('helm').adjustEffectLevel('charge', 10);
        expect(tile('helm').getEffectLevel('charge')).toBe(chargeMaxLevel);
        expect(chargeMaxLevel).toBe(5);
    });
});

describe('Trickle Charge', () => {
    it('costs 1, and adds 1 Charge to a system each time', () => {
        const { tile, play } = createShip();
        expect(cardDefinitions.trickleCharge).toMatchObject({ targetType: 'system', system: 'engineer', parameters: { cost: 1, charge: 1 } });

        expect(play('trickleCharge', 'tactical')).toBe(true);
        expect(play('trickleCharge', 'tactical')).toBe(true);

        expect(tile('tactical').getEffectLevel('charge')).toBe(2);
        expect(tile('helm').getEffectLevel('charge')).toBe(0);
    });

    it('can\'t be played on a system that is full of Charge', () => {
        const { tile, play } = createShip();
        tile('tactical').adjustEffectLevel('charge', chargeMaxLevel);

        expect(play('trickleCharge', 'tactical')).toBe(false);
    });
});

describe('Bank Power', () => {
    it('takes 2 power from a system for 20 seconds, then gives it back with 2 Charge', () => {
        const { ship, tile, play, wait } = createShip();
        expect(bankPowerLoss).toBe(2);
        expect(bankPowerDuration).toBe(20_000);
        expect(bankPowerCharge).toBe(2);

        expect(play('bankPower', 'science')).toBe(true);
        expect(ship.scienceState.powerLevel).toBe(1);
        expect(tile('science').getEffectLevel('charge')).toBe(0);

        wait(bankPowerDuration - 1);
        expect(ship.scienceState.powerLevel).toBe(1);
        expect(tile('science').getEffectLevel('charge')).toBe(0);

        wait(1);
        expect(ship.scienceState.powerLevel).toBe(3);
        expect(tile('science').hasEffect('bankingPower')).toBe(false);
        expect(tile('science').getEffectLevel('charge')).toBe(2);
    });

    it('can\'t be played on a system that is already banking', () => {
        const { play } = createShip();

        expect(play('bankPower', 'science')).toBe(true);
        expect(play('bankPower', 'science')).toBe(false);
    });

    it('gives no Charge if it is cut short, and isn\'t moved by a Shunt', () => {
        const { ship, tile, play } = createShip();

        play('bankPower', 'science');
        const neighbor = ship.engineerState.systems[ship.engineerState.systems.indexOf(tile('science')) ^ 1];
        expect(play('shunt', 'science')).toBe(true);
        expect(tile('science').hasEffect('bankingPower')).toBe(true);
        expect(neighbor.hasEffect('bankingPower')).toBe(false);
        expect(tile('science').getEffectLevel('charge')).toBe(0);

        tile('science').removeEffect('bankingPower', 'early');
        expect(ship.scienceState.powerLevel).toBe(3);
        expect(tile('science').getEffectLevel('charge')).toBe(0);
    });
});

describe('Discharge', () => {
    it('spends all of a system\'s Charge, for 1 power per Charge for 10 seconds', () => {
        const { ship, tile, play, wait } = createShip();
        expect(dischargeDuration).toBe(10_000);
        tile('tactical').adjustEffectLevel('charge', 2);

        expect(play('discharge', 'tactical')).toBe(true);
        expect(tile('tactical').hasEffect('charge')).toBe(false);
        expect(ship.tacticalState.powerLevel).toBe(5);

        wait(dischargeDuration - 1);
        expect(ship.tacticalState.powerLevel).toBe(5);

        wait(1);
        expect(ship.tacticalState.powerLevel).toBe(3);
        expect(tile('tactical').hasEffect('discharging')).toBe(false);
    });

    it('can\'t be played on a system with no Charge', () => {
        const { ship, play } = createShip();

        expect(play('discharge', 'tactical')).toBe(false);
        expect(ship.tacticalState.powerLevel).toBe(3);
    });

    it('adds to a discharge that is already running, and starts its time over', () => {
        const { state, ship, tile, play, wait } = createShip();
        tile('helm').adjustEffectLevel('charge', 1);
        play('discharge', 'helm');

        wait(4000);
        tile('helm').adjustEffectLevel('charge', 1);
        expect(play('discharge', 'helm')).toBe(true);

        expect(ship.helmState.powerLevel).toBe(5);
        expect(tile('helm').effects.find(effect => effect.type === 'discharging')!.progress?.endTime).toBe(state.currentTime + dischargeDuration);

        wait(dischargeDuration);
        expect(ship.helmState.powerLevel).toBe(3);
    });
});

describe('Surge Draw', () => {
    it('spends all of a system\'s Charge, and the system draws a card for each', () => {
        const { ship, tile, play } = createShip();
        tile('helm').adjustEffectLevel('charge', 2);
        const handSize = ship.helmState.hand.length;
        const expected = Math.min(handSize + 2, ship.helmState.maxHandSize);
        expect(expected).toBeGreaterThan(handSize);

        expect(play('surgeDraw', 'helm')).toBe(true);

        expect(ship.helmState.hand.length).toBe(expected);
        expect(tile('helm').hasEffect('charge')).toBe(false);
    });

    it('can\'t be played on a system with no Charge', () => {
        const { ship, play } = createShip();
        const handSize = ship.helmState.hand.length;

        expect(play('surgeDraw', 'helm')).toBe(false);
        expect(ship.helmState.hand.length).toBe(handSize);
    });
});

describe('Flux', () => {
    it('is the plasma flux effect, which replaced Heat', () => {
        expect(systemEffectDefinitions).toHaveProperty('flux');
        expect(systemEffectDefinitions).not.toHaveProperty('heat');
        expect(systemEffectDefinitions.flux).toMatchObject({ usesLevels: true, maxLevel: fluxLimit });
    });

    it('damages one of the system\'s cards on reaching 3, and goes back to nothing', () => {
        const { ship, tile, wait } = createShip();
        expect(fluxLimit).toBe(3);
        const health = ship.helmState.health;

        tile('helm').adjustEffectLevel('flux', 2);
        wait(600_000);
        expect(tile('helm').getEffectLevel('flux')).toBe(2);
        expect(ship.helmState.health).toBe(health);

        tile('helm').adjustEffectLevel('flux', 1);
        expect(tile('helm').hasEffect('flux')).toBe(false);
        expect(ship.helmState.health).toBe(health - 1);

        // And builds up again from nothing.
        tile('helm').adjustEffectLevel('flux', 1);
        expect(tile('helm').getEffectLevel('flux')).toBe(1);
        expect(ship.helmState.health).toBe(health - 1);
    });

    it('does the same when 3 arrive at once', () => {
        const { ship, tile } = createShip();
        const health = ship.scienceState.health;

        tile('science').adjustEffectLevel('flux', fluxLimit);

        expect(tile('science').hasEffect('flux')).toBe(false);
        expect(ship.scienceState.health).toBe(health - 1);
    });
});

describe('Redline', () => {
    it('adds 2 power to a system, and 1 Flux every 5 seconds, until it is played on it again', () => {
        const { ship, tile, play, wait } = createShip();
        expect(cardDefinitions.redline.parameters).toMatchObject({ cost: 1, powerGain: redlinePowerGain, flux: 1, interval: redlineFluxInterval / 1000 });
        expect(redlinePowerGain).toBe(2);
        expect(redlineFluxInterval).toBe(5000);
        const health = ship.helmState.health;

        expect(play('redline', 'helm')).toBe(true);
        expect(ship.helmState.powerLevel).toBe(5);
        expect(tile('helm').effects.find(effect => effect.type === 'redlining')!.progress).toBeNull();

        wait(redlineFluxInterval - 1);
        expect(tile('helm').getEffectLevel('flux')).toBe(0);
        wait(1);
        expect(tile('helm').getEffectLevel('flux')).toBe(1);
        wait(redlineFluxInterval);
        expect(tile('helm').getEffectLevel('flux')).toBe(2);
        expect(ship.helmState.health).toBe(health);

        // The third Flux damages a card, and the system keeps redlining.
        wait(redlineFluxInterval);
        expect(tile('helm').getEffectLevel('flux')).toBe(0);
        expect(ship.helmState.health).toBe(health - 1);
        expect(ship.helmState.powerLevel).toBe(5);

        wait(redlineFluxInterval);
        expect(tile('helm').getEffectLevel('flux')).toBe(1);

        expect(play('redline', 'helm')).toBe(true);
        expect(ship.helmState.powerLevel).toBe(3);
        expect(tile('helm').hasEffect('redlining')).toBe(false);

        // The Flux it left stays, but no more is added.
        wait(redlineFluxInterval * 4);
        expect(tile('helm').getEffectLevel('flux')).toBe(1);
    });
});

describe('Vent', () => {
    it('removes all Flux from every system, and leaves the hull unpowered for 3 seconds', () => {
        const { ship, tile, play, wait } = createShip();
        expect(ventShieldsDownDuration).toBe(3000);
        tile('helm').adjustEffectLevel('flux', 2);
        tile('tactical').adjustEffectLevel('flux', 1);
        const health = ship.helmState.health;

        expect(play('vent')).toBe(true);

        expect(tile('helm').hasEffect('flux')).toBe(false);
        expect(tile('tactical').hasEffect('flux')).toBe(false);
        expect(ship.helmState.health).toBe(health);
        expect(tile('hull').hasEffect('shieldsVented')).toBe(true);
        expect(ship.hullState.powerLevel).toBe(0);

        wait(ventShieldsDownDuration - 1);
        expect(ship.hullState.powerLevel).toBe(0);

        wait(1);
        expect(tile('hull').hasEffect('shieldsVented')).toBe(false);
        expect(ship.hullState.powerLevel).toBe(3);
    });

    it('lets a hit past the shields while they are down', () => {
        const { ship, tile, play, wait } = createShip();
        const hit = () => ship.hullState.damageShields({ amount: 10, traits: [], targetSystem: 'hull' });
        const shield = ship.hullState.shield;
        expect(shield).toBeGreaterThan(0);

        tile('helm').adjustEffectLevel('flux', 1);
        play('vent');
        expect(hit()).toBe(10);
        expect(ship.hullState.shield).toBe(shield);

        wait(ventShieldsDownDuration);
        expect(hit()).toBeLessThan(10);
        expect(ship.hullState.shield).toBeLessThan(shield);
    });

    it('can\'t be played when no system has Flux', () => {
        const { ship, tile, play } = createShip();

        expect(play('vent')).toBe(false);
        expect(tile('hull').hasEffect('shieldsVented')).toBe(false);
        expect(ship.hullState.powerLevel).toBe(3);
    });
});

describe('Rail Feed', () => {
    it('costs 3, and adds 1 power to all three systems in the target\'s column for 20 seconds', () => {
        const { ship, play, wait } = createShip();
        expect(cardDefinitions.railFeed.parameters).toMatchObject({ cost: 3, powerGain: 1, duration: 20 });
        expect(railFeedDuration).toBe(20_000);
        const systems = ship.engineerState.systems;

        // The right-hand column, played on its middle system.
        expect(play('railFeed', systems[3].system)).toBe(true);

        expect(systems.map(system => system.power)).toEqual([3, 4, 3, 4, 3, 4]);

        wait(railFeedDuration - 1);
        expect(systems.map(system => system.power)).toEqual([3, 4, 3, 4, 3, 4]);

        wait(1);
        expect(systems.map(system => system.power)).toEqual([3, 3, 3, 3, 3, 3]);
    });

    it('feeds the left-hand column from any system in it', () => {
        const { ship, play } = createShip();
        const systems = ship.engineerState.systems;

        expect(play('railFeed', systems[4].system)).toBe(true);

        expect(systems.map(system => system.power)).toEqual([4, 3, 4, 3, 4, 3]);
    });

    it('feeds whichever systems are in the column when it is played', () => {
        const { ship, play } = createShip();
        const systems = ship.engineerState.systems;
        const [first, second] = systems.map(system => system.system);

        // Moves the first system across, into the right-hand column.
        expect(play('swapHorizontal', first)).toBe(true);
        expect(play('railFeed', first)).toBe(true);

        expect(systems[1].system).toBe(first);
        expect(systems[0].system).toBe(second);
        expect(systems.map(system => system.power)).toEqual([3, 4, 3, 4, 3, 4]);
    });
});

describe('Coolant Flush', () => {
    it('moves all of a system\'s Flux to the hull', () => {
        const { tile, play } = createShip();
        expect(cardDefinitions.coolantFlush).toMatchObject({ targetType: 'system', system: 'engineer', parameters: { cost: 2 } });
        tile('helm').adjustEffectLevel('flux', 1);

        expect(play('coolantFlush', 'helm')).toBe(true);

        expect(tile('helm').hasEffect('flux')).toBe(false);
        expect(tile('hull').getEffectLevel('flux')).toBe(1);
    });

    it('overloads the hull as it does any other system, if that takes its Flux to the limit', () => {
        const { ship, tile, play } = createShip();
        tile('helm').adjustEffectLevel('flux', 2);
        tile('hull').adjustEffectLevel('flux', 1);
        const hullHealth = ship.hullState.health;
        const helmHealth = ship.helmState.health;

        expect(play('coolantFlush', 'helm')).toBe(true);

        expect(tile('helm').hasEffect('flux')).toBe(false);
        expect(ship.helmState.health).toBe(helmHealth);
        expect(tile('hull').hasEffect('flux')).toBe(false);
        expect(ship.hullState.health).toBe(hullHealth - 1);
    });

    it('leaves Flux that doesn\'t reach the limit on the hull', () => {
        const { ship, tile, play } = createShip();
        tile('science').adjustEffectLevel('flux', 2);
        const hullHealth = ship.hullState.health;

        expect(play('coolantFlush', 'science')).toBe(true);

        expect(tile('science').hasEffect('flux')).toBe(false);
        expect(tile('hull').getEffectLevel('flux')).toBe(2);
        expect(ship.hullState.health).toBe(hullHealth);
    });

    it('can\'t be played on a system with no Flux, or on the hull', () => {
        const { tile, play } = createShip();
        expect(play('coolantFlush', 'helm')).toBe(false);

        tile('hull').adjustEffectLevel('flux', 1);
        expect(play('coolantFlush', 'hull')).toBe(false);
        expect(tile('hull').getEffectLevel('flux')).toBe(1);
    });
});

describe('Burnout', () => {
    it('spends all of a system\'s Flux, for 2 power per Flux for 8 seconds, then resets the system', () => {
        const { ship, tile, play, wait } = createShip();
        expect(cardDefinitions.burnout).toMatchObject({ rarity: 'uncommon', parameters: { cost: 2, powerGain: 2, duration: 8 } });
        expect(burnoutPowerPerLevel).toBe(2);
        expect(burnoutDuration).toBe(8000);
        tile('tactical').adjustEffectLevel('flux', 1);
        tile('helm').adjustSystemPowerLevel(-2);
        tile('helm').adjustEffectLevel('flux', 2);

        expect(play('burnout', 'tactical')).toBe(true);
        expect(tile('tactical').hasEffect('flux')).toBe(false);
        expect(ship.tacticalState.powerLevel).toBe(5);

        expect(play('burnout', 'helm')).toBe(true);
        expect(ship.helmState.powerLevel).toBe(5);

        wait(burnoutDuration - 1);
        expect(ship.tacticalState.powerLevel).toBe(5);

        // The system loses all its power while it resets, and everything on it.
        wait(1);
        expect(tile('tactical').hasEffect('burningOut')).toBe(false);
        expect(tile('tactical').hasEffect('resetting')).toBe(true);
        expect(ship.tacticalState.powerLevel).toBe(0);

        wait(3000);
        expect(tile('tactical').effects.length).toBe(0);
        expect(ship.tacticalState.powerLevel).toBe(3);
        expect(ship.helmState.powerLevel).toBe(1);
    });

    it('doesn\'t reset the system if it is cut short', () => {
        const { ship, tile, play } = createShip();
        tile('science').adjustEffectLevel('flux', 1);
        play('burnout', 'science');

        tile('science').removeEffect('burningOut', 'early');

        expect(ship.scienceState.powerLevel).toBe(3);
        expect(tile('science').hasEffect('resetting')).toBe(false);
    });

    it('can\'t be played on a system with no Flux, and isn\'t moved by a Shunt', () => {
        const { ship, tile, play } = createShip();
        expect(play('burnout', 'science')).toBe(false);
        expect(ship.scienceState.powerLevel).toBe(3);

        tile('science').adjustEffectLevel('flux', 1);
        play('burnout', 'science');
        const neighbor = ship.engineerState.systems[ship.engineerState.systems.indexOf(tile('science')) ^ 1];
        expect(play('shunt', 'science')).toBe(true);
        expect(tile('science').hasEffect('burningOut')).toBe(true);
        expect(neighbor.hasEffect('burningOut')).toBe(false);
    });
});

describe('Bus Link', () => {
    it('gives the lower-powered of a system and its horizontal neighbour the power to match the higher, for 20 seconds', () => {
        const { ship, tile, play, wait } = createShip();
        expect(cardDefinitions.busLink).toMatchObject({ rarity: 'uncommon', parameters: { cost: 3, duration: 20 } });
        expect(busLinkDuration).toBe(20_000);
        const systems = ship.engineerState.systems;
        const neighbor = systems[systems.indexOf(tile('science')) ^ 1];
        tile('science').adjustSystemPowerLevel(-2);
        neighbor.adjustSystemPowerLevel(1);
        expect(tile('science').power).toBe(1);
        expect(neighbor.power).toBe(4);

        // It can be played on either of the two.
        expect(play('busLink', neighbor.system)).toBe(true);

        expect(tile('science').power).toBe(4);
        expect(neighbor.power).toBe(4);

        wait(busLinkDuration);
        expect(tile('science').hasEffect('busLinked')).toBe(false);
        expect(tile('science').power).toBe(1);
        expect(neighbor.power).toBe(4);
    });

    it('can\'t be played when the two already run at the same power', () => {
        const { tile, play } = createShip();

        expect(play('busLink', 'science')).toBe(false);
        expect(tile('science').hasEffect('busLinked')).toBe(false);
    });

    it('adds to the power it gave, and starts its time over, if played again after the power changes', () => {
        const { state, ship, tile, play, wait } = createShip();
        const systems = ship.engineerState.systems;
        const neighbor = systems[systems.indexOf(tile('helm')) ^ 1];
        tile('helm').adjustSystemPowerLevel(-1);
        play('busLink', 'helm');
        expect(tile('helm').power).toBe(3);

        wait(5000);
        neighbor.adjustSystemPowerLevel(2);
        expect(play('busLink', 'helm')).toBe(true);

        expect(tile('helm').power).toBe(5);
        expect(tile('helm').effects.find(effect => effect.type === 'busLinked')!.progress?.endTime).toBe(state.currentTime + busLinkDuration);
    });
});

describe('Daisy Chain', () => {
    it('copies a system\'s positive effects to the system below it, which end when the originals do', () => {
        const { ship, play, wait } = createShip();
        expect(cardDefinitions.daisyChain).toMatchObject({ rarity: 'uncommon', parameters: { cost: 3 } });
        const [top, , below] = ship.engineerState.systems;
        top.addEffect('railFeed');
        top.adjustEffectLevel('discharging', 2);
        wait(4000);
        top.adjustEffectLevel('flux', 1);

        expect(play('daisyChain', top.system)).toBe(true);

        expect(below.effects.map(effect => effect.type).sort()).toEqual(['discharging', 'railFeed']);
        expect(below.getEffectLevel('discharging')).toBe(2);
        expect(below.power).toBe(5);
        expect(top.hasEffect('railFeed')).toBe(true);
        const original = top.effects.find(effect => effect.type === 'railFeed')!;
        const copy = below.effects.find(effect => effect.type === 'railFeed')!;
        expect(copy.progress).not.toBe(original.progress);
        expect(copy.progress?.endTime).toBe(original.progress?.endTime);

        // The negative Flux stays where it was.
        expect(below.hasEffect('flux')).toBe(false);

        wait(railFeedDuration);
        expect(top.hasEffect('railFeed')).toBe(false);
        expect(below.hasEffect('railFeed')).toBe(false);
    });

    it('adds a copied level to one that the lower system already has', () => {
        const { ship, play } = createShip();
        const [top, , below] = ship.engineerState.systems;
        top.adjustEffectLevel('discharging', 1);
        below.adjustEffectLevel('discharging', 1);

        expect(play('daisyChain', top.system)).toBe(true);

        expect(below.getEffectLevel('discharging')).toBe(2);
        expect(top.getEffectLevel('discharging')).toBe(1);
    });

    it('doesn\'t copy Charge, Aux Power or anything that moves power from another system, or one that does something when it ends', () => {
        const { ship, play } = createShip();
        const [top, , below] = ship.engineerState.systems;
        top.adjustEffectLevel('charge', 2);
        top.addEffect('auxPower');
        top.adjustEffectLevel('drawPowerGain', 1);
        top.addEffect('bankingPower');

        expect(play('daisyChain', top.system)).toBe(false);
        expect(below.effects.length).toBe(0);
    });

    it('can\'t be played on a system with no positive effects, or on the bottom row', () => {
        const { ship, play } = createShip();
        const systems = ship.engineerState.systems;
        expect(play('daisyChain', systems[0].system)).toBe(false);

        for (const index of [4, 5]) {
            systems[index].addEffect('railFeed');
            expect(play('daisyChain', systems[index].system)).toBe(false);
        }
    });

    it('goes one row down from the middle row, and follows the systems as they are laid out', () => {
        const { ship, play } = createShip();
        const systems = ship.engineerState.systems;
        const first = systems[0].system;
        play('swapDown', first);
        expect(systems[2].system).toBe(first);

        systems[2].addEffect('railFeed');
        expect(play('daisyChain', first)).toBe(true);

        expect(systems[4].hasEffect('railFeed')).toBe(true);
        expect(systems[3].hasEffect('railFeed')).toBe(false);
    });
});

describe('Ground Out', () => {
    it('moves a system\'s negative effects to the hull, leaving the positive ones', () => {
        const { ship, tile, play } = createShip();
        expect(cardDefinitions.groundOut).toMatchObject({ targetType: 'system', system: 'engineer', parameters: { cost: 2 } });
        tile('helm').adjustEffectLevel('flux', 2);
        tile('helm').addEffect('railFeed');
        const hullHealth = ship.hullState.health;

        expect(play('groundOut', 'helm')).toBe(true);

        expect(tile('helm').hasEffect('flux')).toBe(false);
        expect(tile('helm').hasEffect('railFeed')).toBe(true);
        expect(tile('hull').getEffectLevel('flux')).toBe(2);
        expect(ship.hullState.health).toBe(hullHealth);
    });

    it('adds to Flux that the hull already has, which can overload it', () => {
        const { ship, tile, play } = createShip();
        tile('helm').adjustEffectLevel('flux', 2);
        tile('hull').adjustEffectLevel('flux', 1);
        const hullHealth = ship.hullState.health;

        expect(play('groundOut', 'helm')).toBe(true);

        expect(tile('hull').hasEffect('flux')).toBe(false);
        expect(ship.hullState.health).toBe(hullHealth - 1);
    });

    it('does away with effects that the hull can\'t have, and leaves one half of a power transfer in place', () => {
        const { tile, play } = createShip();
        tile('helm').addEffect('shieldReduced');
        tile('helm').adjustEffectLevel('distributePowerLoss', 1);
        tile('helm').adjustEffectLevel('flux', 1);

        expect(play('groundOut', 'helm')).toBe(true);

        expect(tile('hull').hasEffect('shieldReduced')).toBe(false);
        expect(tile('helm').hasEffect('shieldReduced')).toBe(false);
        expect(tile('helm').hasEffect('distributePowerLoss')).toBe(true);
        expect(tile('hull').hasEffect('flux')).toBe(true);
    });

    it('keeps the time that a moved effect has left', () => {
        const { tile, play, wait } = createShip();
        tile('helm').addEffect('persistentDamage');
        const endTime = tile('helm').effects.find(effect => effect.type === 'persistentDamage')?.progress?.endTime;
        wait(1000);

        expect(play('groundOut', 'helm')).toBe(true);

        expect(tile('hull').effects.find(effect => effect.type === 'persistentDamage')?.progress?.endTime).toBe(endTime);
    });

    it('leaves an auto-destruct where it is', () => {
        const { tile, play } = createShip();
        tile('engineer').adjustEffectLevel('autoDestructRequested', 2);

        expect(play('groundOut', 'engineer')).toBe(false);
        expect(tile('engineer').hasEffect('autoDestructRequested')).toBe(true);
        expect(tile('hull').hasEffect('autoDestructRequested')).toBe(false);
    });

    it('can\'t be played on the hull, or on a system with no negative effects', () => {
        const { tile, play } = createShip();
        expect(play('groundOut', 'helm')).toBe(false);

        tile('hull').adjustEffectLevel('flux', 1);
        expect(play('groundOut', 'hull')).toBe(false);
        expect(tile('hull').getEffectLevel('flux')).toBe(1);
    });
});

describe('Jury-rig', () => {
    it('stabilises a damaged card in a system', () => {
        const { ship, tile, play } = createShip();
        expect(cardDefinitions.juryRig).toMatchObject({ targetType: 'system', system: 'engineer', parameters: { cost: 2, cards: 1 } });
        tile('helm').adjustSystemHealth(-2);
        const cards = () => [...ship.helmState.hand, ...ship.helmState.deck];
        expect(cards().filter(card => card.hasTrait('damaged')).length).toBe(2);
        const health = ship.helmState.health;

        expect(play('juryRig', 'helm')).toBe(true);

        expect(ship.helmState.health).toBe(health + 1);
        expect(cards().filter(card => card.hasTrait('damaged')).length).toBe(1);
        expect(cards().filter(card => card.hasTrait('stabilised')).length).toBe(1);
    });

    it('can\'t be played on a system with nothing damaged', () => {
        const { ship, play } = createShip();

        expect(play('juryRig', 'helm')).toBe(false);
        expect(ship.helmState.health).toBe(ship.helmState.maxHealth);
    });

    it('can\'t stabilise a card that is critically damaged', () => {
        const { ship, tile, play } = createShip();
        // A stabilised card that's damaged again is critically damaged.
        tile('helm').adjustSystemHealth(-1);
        tile('helm').adjustSystemHealth(1);
        tile('helm').adjustSystemHealth(-ship.helmState.health);
        tile('helm').adjustSystemHealth(ship.helmState.maxHealth);
        expect([...ship.helmState.hand, ...ship.helmState.deck].filter(card => card.hasTrait('critical')).length).toBe(1);
        const health = ship.helmState.health;
        expect(health).toBe(ship.helmState.maxHealth - 1);

        expect(play('juryRig', 'helm')).toBe(false);
        expect(ship.helmState.health).toBe(health);
    });
});

describe('Fabricate', () => {
    it('puts an expendable copy of the top card of a system\'s deck in its hand, and leaves the card in the deck', () => {
        const { ship, play } = createShip();
        expect(cardDefinitions.fabricate).toMatchObject({ rarity: 'uncommon', targetType: 'system', system: 'engineer', parameters: { cost: 2 } });
        const topCard = ship.tacticalState.deck[0];
        const handSize = ship.tacticalState.hand.length;
        expect(handSize).toBeLessThan(ship.tacticalState.maxHandSize);

        expect(play('fabricate', 'tactical')).toBe(true);

        expect(ship.tacticalState.hand.length).toBe(handSize + 1);
        const copy = ship.tacticalState.hand[handSize];
        expect(copy).not.toBe(topCard);
        expect(copy.type).toBe(topCard.type);
        expect(copy.hasTrait('expendable')).toBe(true);
        expect(copy.id).not.toBe(topCard.id);
        expect(ship.tacticalState.deck[0]).toBe(topCard);
        expect(topCard.hasTrait('expendable')).toBe(false);
    });

    it('can be played on the engineer\'s own system too', () => {
        const { ship, play } = createShip();
        const handSize = ship.engineerState.hand.length;
        const topCard = ship.engineerState.deck[0];

        expect(play('fabricate', 'engineer')).toBe(true);

        expect(ship.engineerState.hand.length).toBe(handSize + 1);
        expect(ship.engineerState.hand[handSize].type).toBe(topCard.type);
    });

    it('copies the card as new, not as damaged', () => {
        const { ship, tile, play } = createShip();
        tile('science').adjustSystemHealth(-ship.scienceState.health);
        const topCard = ship.scienceState.deck[0];
        expect(topCard.isDamaged).toBe(true);
        const handSize = ship.scienceState.hand.length;

        expect(play('fabricate', 'science')).toBe(true);

        const copy = ship.scienceState.hand[handSize];
        expect(copy.isDamaged).toBe(false);
        expect(copy.hasTrait('expendable')).toBe(true);
    });

    it('can\'t be played on a full hand, or on a system that isn\'t crew', () => {
        const { ship, play } = createShip();
        expect(play('fabricate', 'hull')).toBe(false);
        expect(play('fabricate', 'reactor')).toBe(false);

        while (ship.helmState.hand.length < ship.helmState.maxHandSize) {
            ship.helmState.addCardToHand(new CardState(ship.getCardId(), 'purge'));
        }
        expect(play('fabricate', 'helm')).toBe(false);
        expect(ship.helmState.hand.length).toBe(ship.helmState.maxHandSize);
    });
});

describe('Run Quiet', () => {
    it('adds 1 Charge to the system every 10 seconds while it runs quiet, up to the most it can hold, and keeps its power loss', () => {
        const { ship, tile, play, wait } = createShip();
        expect(runQuietChargeInterval).toBe(10_000);
        expect(cardDefinitions.runQuiet.parameters).toMatchObject({ cost: 1, powerChange: 2, charge: 1, interval: 10 });

        expect(play('runQuiet', 'science')).toBe(true);
        expect(ship.scienceState.powerLevel).toBe(1);

        wait(runQuietChargeInterval - 1);
        expect(tile('science').getEffectLevel('charge')).toBe(0);
        wait(1);
        expect(tile('science').getEffectLevel('charge')).toBe(1);
        expect(ship.scienceState.powerLevel).toBe(1);

        for (let i = 0; i < chargeMaxLevel + 2; i++) {
            wait(runQuietChargeInterval);
        }
        expect(tile('science').getEffectLevel('charge')).toBe(chargeMaxLevel);
        expect(ship.scienceState.powerLevel).toBe(1);
    });

    it('stops adding Charge once it is brought back, and leaves what it added', () => {
        const { ship, tile, play, wait } = createShip();
        play('runQuiet', 'helm');
        wait(runQuietChargeInterval);
        wait(runQuietChargeInterval);
        expect(tile('helm').getEffectLevel('charge')).toBe(2);

        expect(play('runQuiet', 'helm')).toBe(true);
        expect(ship.helmState.powerLevel).toBe(3);

        for (let i = 0; i < 3; i++) {
            wait(runQuietChargeInterval);
        }
        expect(tile('helm').getEffectLevel('charge')).toBe(2);
    });
});

describe('Priority Feed', () => {
    it('costs 1, and has a system draw a card', () => {
        const { ship, play } = createShip();
        expect(cardDefinitions.priorityFeed).toMatchObject({ targetType: 'system', system: 'engineer', parameters: { cost: 1, cards: 1 } });
        const handSize = ship.tacticalState.hand.length;
        const topCard = ship.tacticalState.deck[0];
        expect(handSize).toBeLessThan(ship.tacticalState.maxHandSize);

        expect(play('priorityFeed', 'tactical')).toBe(true);

        expect(ship.tacticalState.hand.length).toBe(handSize + 1);
        expect(ship.tacticalState.hand).toContain(topCard);
    });
});

describe('Buffer', () => {
    it('spends 1 Charge in place of the next hit that would damage one of the system\'s cards, then is gone', () => {
        const { ship, tile, play } = createShip();
        tile('helm').adjustEffectLevel('charge', 2);
        const health = ship.helmState.health;

        expect(play('buffer', 'helm')).toBe(true);
        expect(tile('helm').effects.find(effect => effect.type === 'buffered')!.progress).toBeNull();

        // A hit that does nothing to this system leaves it waiting.
        ship.helmState.applyDamage.invoke(0);
        expect(tile('helm').hasEffect('buffered')).toBe(true);
        expect(tile('helm').getEffectLevel('charge')).toBe(2);

        ship.helmState.applyDamage.invoke(2);
        expect(ship.helmState.health).toBe(health);
        expect(tile('helm').getEffectLevel('charge')).toBe(1);
        expect(tile('helm').hasEffect('buffered')).toBe(false);

        ship.helmState.applyDamage.invoke(2);
        expect(ship.helmState.health).toBe(health - 2);
        expect(tile('helm').getEffectLevel('charge')).toBe(1);
    });

    it('waits for Charge: a hit on a system with none gets through, and the next is stopped once there is some', () => {
        const { ship, tile, play } = createShip();
        const health = ship.scienceState.health;
        play('buffer', 'science');

        ship.scienceState.applyDamage.invoke(1);
        expect(ship.scienceState.health).toBe(health - 1);
        expect(tile('science').hasEffect('buffered')).toBe(true);

        tile('science').adjustEffectLevel('charge', 1);
        ship.scienceState.applyDamage.invoke(1);
        expect(ship.scienceState.health).toBe(health - 1);
        expect(tile('science').hasEffect('charge')).toBe(false);
    });

    it('only protects the system it is on, and can\'t be played on it twice', () => {
        const { ship, tile, play } = createShip();
        tile('helm').adjustEffectLevel('charge', 1);
        const health = ship.tacticalState.health;

        expect(play('buffer', 'helm')).toBe(true);
        expect(play('buffer', 'helm')).toBe(false);

        ship.tacticalState.applyDamage.invoke(1);
        expect(ship.tacticalState.health).toBe(health - 1);
        expect(tile('helm').getEffectLevel('charge')).toBe(1);
    });

    it('is left behind with the encounter', () => {
        const { ship, tile, play } = createShip();
        tile('helm').adjustEffectLevel('charge', 1);
        play('buffer', 'helm');

        ship.cleanupAfterEncounter();
        ship.startEncounter();
        const health = ship.helmState.health;
        tile('helm').adjustEffectLevel('charge', 1);

        ship.helmState.applyDamage.invoke(1);
        expect(ship.helmState.health).toBe(health - 1);
    });
});

describe('Hot Start', () => {
    it('has a system draw 2 cards, and adds 1 Flux to it', () => {
        const { ship, tile, play } = createShip();
        expect(cardDefinitions.hotStart.parameters).toMatchObject({ cost: 1, cards: 2, flux: 1 });
        const handSize = ship.helmState.hand.length;
        const expected = Math.min(handSize + 2, ship.helmState.maxHandSize);

        expect(play('hotStart', 'helm')).toBe(true);

        expect(ship.helmState.hand.length).toBe(expected);
        expect(tile('helm').getEffectLevel('flux')).toBe(1);
    });

    it('overloads a system that already has 2 Flux', () => {
        const { ship, tile, play } = createShip();
        tile('helm').adjustEffectLevel('flux', 2);
        const health = ship.helmState.health;

        expect(play('hotStart', 'helm')).toBe(true);

        expect(tile('helm').hasEffect('flux')).toBe(false);
        expect(ship.helmState.health).toBe(health - 1);
    });
});

/** Sets up a ship to play Extreme Measures, which costs one more than the engineer normally has. */
function createExtremeShip() {
    const created = createShip();
    created.ship.engineerState.adjustPowerLevel(1);
    return created;
}

describe('Extreme Measures', () => {
    it('costs 4, and offers Auto-destruct, Cannibalise and Emergency Power, which can only be had from it', () => {
        expect(cardDefinitions.extremeMeasures).toMatchObject({
            targetType: 'choice', system: 'engineer', cards: ['autoDestruct', 'cannibalise', 'emergencyPower'], parameters: { cost: 4 },
        });

        const shop = getShopCardTypes('engineer');
        expect(shop).toContain('extremeMeasures');
        for (const type of ['autoDestruct', 'confirmAutoDestruct', 'abortAutoDestruct', 'cannibalise', 'graft', 'emergencyPower'] as const) {
            expect(shop).not.toContain(type);
        }
    });

    it('can\'t be played by an engineer with only 3 power', () => {
        const { ship, playChoice } = createShip();
        expect(ship.engineerState.powerLevel).toBe(3);

        expect(playChoice('extremeMeasures', 'emergencyPower')).toBe(false);
        expect(ship.helmState.powerLevel).toBe(3);
    });
});

describe('Auto-destruct', () => {
    function createShips() {
        const created = createExtremeShip();
        const { state, ship } = created;
        state.initFactions([{ id: 'player' }], 'player');
        state.factionRegistry.setEncounterFactions([{ id: 'raiders', relations: { player: RelationshipType.Hostile } }]);

        const addShip = (x: number) => {
            const other = new AiShip(state, createShipSetup('waterModule', 'raiders', { x, y: 0, angle: 0 }));
            state.add(other);
            return other;
        };

        const confirmers = [ship.helmState, ship.scienceState, ship.tacticalState];
        const confirmCards = (crew: { hand: readonly CardState[] }) => crew.hand.filter(card => card.type === 'confirmAutoDestruct');

        /** Plays the Confirm card that the given crew member was dealt, and says whether it was played. */
        const confirm = (crew: (typeof confirmers)[number]) => {
            const [card] = confirmCards(crew);
            return crew.playCard(card.id, 'confirmAutoDestruct', 'no-target', '') !== null;
        };

        return { ...created, addShip, confirmers, confirmCards, confirm };
    }

    const abortCards = (ship: PlayerShip) => ship.engineerState.hand.filter(card => card.type === 'abortAutoDestruct');

    it('is a card that needs 2 of the other 3 crew to confirm it within 30 seconds', () => {
        expect(autoDestructConfirmationsNeeded).toBe(2);
        expect(autoDestructConfirmWindow).toBe(30_000);
        expect(cardDefinitions.autoDestruct).toMatchObject({ parameters: { cost: 4, window: 30, confirmations: 2 } });
        expect(systemEffectDefinitions.autoDestructRequested).toMatchObject({ usesLevels: true, maxLevel: 2, duration: 30_000 });
    });

    it('deals each of the other crew members a Confirm card, and starts no countdown', () => {
        const { state, ship, tile, playChoice, confirmers, confirmCards } = createShips();
        // It's an engineer card, but it's played from the other crew members' hands, and can only be played.
        expect(cardDefinitions.confirmAutoDestruct).toMatchObject({ targetType: 'no-target', system: 'engineer', traits: ['expendable', 'priority'], parameters: { cost: 0 } });

        expect(playChoice('extremeMeasures', 'autoDestruct')).toBe(true);

        for (const crew of confirmers) {
            expect(confirmCards(crew).length).toBe(1);
        }
        expect(confirmCards(ship.engineerState).length).toBe(0);
        expect(tile('engineer').hasEffect('autoDestructing')).toBe(false);
        expect(abortCards(ship).length).toBe(0);

        // The request shows on the engineer's system, with how many more confirmations it needs, until the time's up.
        const request = tile('engineer').effects.find(effect => effect.type === 'autoDestructRequested')!;
        expect(request.level).toBe(2);
        expect(request.progress?.endTime).toBe(state.currentTime + autoDestructConfirmWindow);
    });

    it('is not started by one confirmation, but by two, which hand the engineer an Abort card and take away the other Confirm card', () => {
        const { state, ship, tile, playChoice, confirmers, confirmCards, confirm } = createShips();
        const [helm, science, tactical] = confirmers;
        expect(cardDefinitions.abortAutoDestruct).toMatchObject({ targetType: 'no-target', traits: ['expendable', 'priority'] });
        playChoice('extremeMeasures', 'autoDestruct');

        expect(confirm(helm)).toBe(true);
        expect(confirmCards(helm).length).toBe(0);
        expect(tile('engineer').getEffectLevel('autoDestructRequested')).toBe(1);
        expect(tile('engineer').hasEffect('autoDestructing')).toBe(false);
        expect(abortCards(ship).length).toBe(0);
        expect(confirmCards(science).length).toBe(1);

        expect(confirm(science)).toBe(true);
        expect(tile('engineer').hasEffect('autoDestructRequested')).toBe(false);
        expect(tile('engineer').effects.find(effect => effect.type === 'autoDestructing')!.progress?.endTime).toBe(state.currentTime + autoDestructDuration);
        expect(abortCards(ship).length).toBe(1);
        for (const crew of [helm, science, tactical]) {
            expect(confirmCards(crew).length).toBe(0);
        }
    });

    it('lapses if fewer than 2 confirm in 30 seconds, taking the Confirm cards away and starting nothing', () => {
        const { state, ship, tile, playChoice, confirmers, confirmCards, confirm, wait } = createShips();
        playChoice('extremeMeasures', 'autoDestruct');
        confirm(confirmers[0]);

        wait(autoDestructConfirmWindow - 1);
        expect(tile('engineer').hasEffect('autoDestructRequested')).toBe(true);
        expect(confirmCards(confirmers[1]).length).toBe(1);

        wait(1);
        expect(tile('engineer').hasEffect('autoDestructRequested')).toBe(false);
        expect(tile('engineer').hasEffect('autoDestructing')).toBe(false);
        for (const crew of confirmers) {
            expect(confirmCards(crew).length).toBe(0);
        }
        expect(abortCards(ship).length).toBe(0);

        wait(autoDestructDuration);
        expect(state.objects.has(ship.id)).toBe(true);

        // Once it's lapsed, it can be requested again.
        expect(playChoice('extremeMeasures', 'autoDestruct')).toBe(true);
    });

    it('can\'t be requested again while one is pending or counting down', () => {
        const { ship, tile, playChoice, confirmers, confirmCards, confirm } = createShips();

        expect(playChoice('extremeMeasures', 'autoDestruct')).toBe(true);
        expect(playChoice('extremeMeasures', 'autoDestruct')).toBe(false);
        for (const crew of confirmers) {
            expect(confirmCards(crew).length).toBe(1);
        }

        confirm(confirmers[0]);
        confirm(confirmers[1]);
        expect(playChoice('extremeMeasures', 'autoDestruct')).toBe(false);
        expect(abortCards(ship).length).toBe(1);
        expect(tile('engineer').hasEffect('autoDestructRequested')).toBe(false);
    });

    it('makes room in a full hand for each Confirm card, and for the abort card', () => {
        const { ship, playChoice, confirmers, confirmCards, confirm } = createShips();
        for (const crew of [ship.engineerState, ...confirmers]) {
            while (crew.hand.length < crew.maxHandSize) {
                crew.addCardToHand(new CardState(ship.getCardId(), 'purge'));
            }
        }

        expect(playChoice('extremeMeasures', 'autoDestruct')).toBe(true);
        for (const crew of confirmers) {
            expect(confirmCards(crew).length).toBe(1);
            expect(crew.hand.length).toBe(crew.maxHandSize);
        }

        confirm(confirmers[0]);
        confirm(confirmers[1]);
        expect(abortCards(ship).length).toBe(1);
    });

    it('can\'t have its Confirm card discarded, or spent as charge', () => {
        const { ship, playChoice, confirmers, confirmCards } = createShips();
        playChoice('extremeMeasures', 'autoDestruct');
        const [card] = confirmCards(confirmers[0]);

        expect(confirmers[0].discardCard(card.id)).toBe(false);
        expect(confirmCards(confirmers[0]).length).toBe(1);
        expect(ship.engineerState.hand).not.toContain(card);
    });

    it('does nothing if a Confirm card is played when there\'s nothing to confirm', () => {
        const { ship, confirmers } = createShips();
        const card = new CardState(ship.getCardId(), 'confirmAutoDestruct');
        confirmers[0].addCardToHand(card);

        expect(confirmers[0].playCard(card.id, 'confirmAutoDestruct', 'no-target', '')).toBeNull();
    });

    it('never has a Confirm card sold, or kept in a deck', () => {
        const { ship, confirmers, playChoice, confirm } = createShips();
        for (const role of ['helm', 'science', 'tactical', 'engineer'] as const) {
            expect(getShopCardTypes(role)).not.toContain('confirmAutoDestruct');
        }

        playChoice('extremeMeasures', 'autoDestruct');
        confirm(confirmers[0]);
        ship.cleanupAfterEncounter();

        for (const system of [ship.helmState, ship.scienceState, ship.tacticalState, ship.engineerState]) {
            expect(system.deck.some(card => card.type === 'confirmAutoDestruct')).toBe(false);
            expect(system.hand.some(card => card.type === 'confirmAutoDestruct')).toBe(false);
        }
    });

    it('takes the Confirm cards away when the encounter ends', () => {
        const { ship, tile, playChoice, confirmers, confirmCards } = createShips();
        playChoice('extremeMeasures', 'autoDestruct');

        ship.cleanupAfterEncounter();

        expect(tile('engineer').hasEffect('autoDestructRequested')).toBe(false);
        for (const crew of confirmers) {
            expect(confirmCards(crew).length).toBe(0);
        }
    });

    /** Requests an auto-destruct and has two of the crew confirm it, to start the countdown. */
    function startCountdown(created: ReturnType<typeof createShips>) {
        created.playChoice('extremeMeasures', 'autoDestruct');
        created.confirm(created.confirmers[0]);
        created.confirm(created.confirmers[1]);
    }

    it('when the countdown runs out, heavily damages every ship nearby, and destroys the ship', () => {
        const created = createShips();
        const { state, ship, wait, addShip } = created;
        expect(autoDestructRange).toBe(6);
        expect(autoDestructDamage).toBe(60);
        const near = addShip(autoDestructRange - 1);
        const far = addShip(autoDestructRange + 1);
        const nearHealth = near.hullState.health;
        const farHealth = far.hullState.health;

        startCountdown(created);

        wait(autoDestructDuration - 1);
        expect(state.objects.has(ship.id)).toBe(true);
        expect(near.hullState.health).toBe(nearHealth);

        wait(1);
        expect(state.objects.has(ship.id)).toBe(false);
        expect(near.hullState.health).toBeLessThan(nearHealth);
        expect(far.hullState.health).toBe(farHealth);
    });

    it('is stopped by the abort card, which is used up', () => {
        const created = createShips();
        const { state, ship, tile, wait, addShip } = created;
        const near = addShip(1);
        const nearHealth = near.hullState.health;
        startCountdown(created);
        wait(autoDestructDuration - 1);

        const [abort] = abortCards(ship);
        expect(ship.engineerState.playCard(abort.id, 'abortAutoDestruct', 'no-target', '')).not.toBeNull();

        expect(tile('engineer').hasEffect('autoDestructing')).toBe(false);
        expect(abortCards(ship).length).toBe(0);
        expect(ship.engineerState.deck).not.toContain(abort);

        wait(autoDestructDuration);
        expect(state.objects.has(ship.id)).toBe(true);
        expect(near.hullState.health).toBe(nearHealth);
    });

    it('takes the abort card away if the countdown is stopped some other way, or the encounter ends', () => {
        const created = createShips();
        const { ship, tile } = created;

        startCountdown(created);
        tile('engineer').removeEffect('autoDestructing', 'early');
        expect(abortCards(ship).length).toBe(0);

        startCountdown(created);
        ship.cleanupAfterEncounter();
        expect(tile('engineer').hasEffect('autoDestructing')).toBe(false);
        expect(abortCards(ship).length).toBe(0);
    });

    it('isn\'t moved by a Shunt, whether it is waiting for confirmation or counting down', () => {
        const created = createShips();
        const { ship, tile, play, playChoice } = created;
        playChoice('extremeMeasures', 'autoDestruct');

        expect(play('shunt', 'engineer')).toBe(true);
        expect(tile('engineer').hasEffect('autoDestructRequested')).toBe(true);

        created.confirm(created.confirmers[0]);
        created.confirm(created.confirmers[1]);
        expect(play('shunt', 'engineer')).toBe(true);

        expect(tile('engineer').hasEffect('autoDestructing')).toBe(true);
        expect(abortCards(ship).length).toBe(1);
    });
});

describe('Cannibalise', () => {
    const graftCards = (ship: PlayerShip) => ship.engineerState.hand.filter(card => card.type === 'graft');

    it('damages every card of a system, and puts an expendable Graft card in the engineer\'s hand', () => {
        const { ship, tile, playChoice } = createExtremeShip();
        const maxHealth = ship.tacticalState.maxHealth;
        expect(ship.tacticalState.health).toBe(maxHealth);
        expect(cardDefinitions.graft).toMatchObject({ targetType: 'system', traits: ['expendable'] });

        expect(playChoice('extremeMeasures', 'cannibalise', 'tactical')).toBe(true);

        expect(ship.tacticalState.health).toBe(0);
        expect(tile('tactical').getEffectLevel('cannibalised')).toBe(maxHealth);
        expect(graftCards(ship).length).toBe(1);
    });

    it('can\'t be played on the hull, on a system with nothing left to damage, or while another system is cannibalised', () => {
        const { ship, tile, playChoice } = createExtremeShip();

        expect(playChoice('extremeMeasures', 'cannibalise', 'hull')).toBe(false);
        expect(ship.hullState.health).toBe(ship.hullState.maxHealth);

        tile('helm').adjustSystemHealth(-ship.helmState.health);
        expect(playChoice('extremeMeasures', 'cannibalise', 'helm')).toBe(false);

        expect(playChoice('extremeMeasures', 'cannibalise', 'tactical')).toBe(true);
        expect(playChoice('extremeMeasures', 'cannibalise', 'science')).toBe(false);
        expect(ship.scienceState.health).toBe(ship.scienceState.maxHealth);
        expect(graftCards(ship).length).toBe(1);
    });

    it('counts only the cards it damaged', () => {
        const { ship, tile, playChoice } = createExtremeShip();
        tile('tactical').adjustSystemHealth(-2);
        const health = ship.tacticalState.health;

        playChoice('extremeMeasures', 'cannibalise', 'tactical');

        expect(tile('tactical').getEffectLevel('cannibalised')).toBe(health);
    });

    it('lets Graft fully repair up to that many damaged cards on another system, and Graft is used up', () => {
        const { ship, tile, playChoice } = createExtremeShip();

        // Leaves helm with every card damaged, and science with 3 cards to cannibalise.
        tile('helm').adjustSystemHealth(-ship.helmState.health);
        tile('science').adjustSystemHealth(-(ship.scienceState.health - 3));
        expect(ship.scienceState.health).toBe(3);
        playChoice('extremeMeasures', 'cannibalise', 'science');
        expect(tile('science').getEffectLevel('cannibalised')).toBe(3);

        const [graft] = graftCards(ship);
        expect(ship.engineerState.playCard(graft.id, 'graft', 'system', 'science')).toBeNull();
        expect(ship.engineerState.playCard(graft.id, 'graft', 'system', 'helm')).not.toBeNull();

        expect(ship.helmState.health).toBe(3);
        const repaired = [...ship.helmState.hand, ...ship.helmState.deck].filter(card => !card.isDamaged);
        expect(repaired.length).toBe(3);
        expect(repaired.every(card => !card.hasTrait('stabilised'))).toBe(true);

        expect(tile('science').hasEffect('cannibalised')).toBe(false);
        expect(graftCards(ship).length).toBe(0);
        expect(ship.engineerState.deck).not.toContain(graft);
    });

    it('lets Graft repair critically damaged cards too', () => {
        const { ship, tile, playChoice } = createExtremeShip();

        // A stabilised card that's damaged again is critically damaged, which normal repairs can't fix.
        tile('helm').adjustSystemHealth(-1);
        tile('helm').adjustSystemHealth(1);
        tile('helm').adjustSystemHealth(-ship.helmState.health);
        const critical = [...ship.helmState.hand, ...ship.helmState.deck].filter(card => card.hasTrait('critical'));
        expect(critical.length).toBe(1);
        tile('helm').adjustSystemHealth(ship.helmState.maxHealth);
        expect(ship.helmState.health).toBe(ship.helmState.maxHealth - 1);

        playChoice('extremeMeasures', 'cannibalise', 'tactical');
        const [graft] = graftCards(ship);
        expect(ship.engineerState.playCard(graft.id, 'graft', 'system', 'helm')).not.toBeNull();

        expect(ship.helmState.health).toBe(ship.helmState.maxHealth);
        expect(critical[0].isDamaged).toBe(false);
    });

    it('doesn\'t let Graft be played on a system with nothing to repair', () => {
        const { ship, playChoice } = createExtremeShip();
        playChoice('extremeMeasures', 'cannibalise', 'tactical');

        const [graft] = graftCards(ship);
        expect(ship.engineerState.playCard(graft.id, 'graft', 'system', 'helm')).toBeNull();
        expect(graftCards(ship).length).toBe(1);
    });
});

describe('Emergency Power', () => {
    it('adds 3 power to every system for 12 seconds, then 2 Flux to each', () => {
        const { ship, tile, play, playChoice, wait } = createExtremeShip();
        expect(emergencyPowerGain).toBe(3);
        expect(emergencyPowerDuration).toBe(12_000);
        expect(emergencyPowerFlux).toBe(2);
        tile('helm').adjustEffectLevel('flux', 1);
        const helmHealth = ship.helmState.health;

        // Science banks power (down to 1) for longer than the emergency lasts, so shows the gain under the most power a system can have, which the rest reach.
        play('bankPower', 'science');

        expect(playChoice('extremeMeasures', 'emergencyPower')).toBe(true);
        expect(ship.engineerState.systems.map(system => system.power)).toEqual([5, 5, 5, 4, 5, 5]);

        wait(emergencyPowerDuration - 1);
        expect(ship.scienceState.powerLevel).toBe(4);
        expect(tile('tactical').hasEffect('flux')).toBe(false);

        wait(1);
        expect(ship.engineerState.systems.map(system => system.power)).toEqual([3, 3, 3, 1, 3, 4]);
        expect(tile('tactical').getEffectLevel('flux')).toBe(emergencyPowerFlux);
        expect(tile('hull').getEffectLevel('flux')).toBe(emergencyPowerFlux);

        // A system that already had Flux is pushed over the limit.
        expect(tile('helm').hasEffect('flux')).toBe(false);
        expect(ship.helmState.health).toBe(helmHealth - 1);
    });

    it('leaves no Flux if it is cut short, as by a Reset', () => {
        const { tile, playChoice } = createExtremeShip();
        playChoice('extremeMeasures', 'emergencyPower');

        tile('science').removeEffect('emergencyPower', 'early');
        expect(tile('science').hasEffect('flux')).toBe(false);
    });
});

describe('the engineer\'s synergy tags', () => {
    const tagged = {
        trickleCharge: { provides: ['charge'], wants: [] },
        bankPower: { provides: ['charge'], wants: [] },
        runQuiet: { provides: ['charge'], wants: [] },
        discharge: { provides: [], wants: ['charge'] },
        surgeDraw: { provides: [], wants: ['charge'] },
        buffer: { provides: [], wants: ['charge'] },
        redline: { provides: ['flux'], wants: [] },
        hotStart: { provides: ['flux'], wants: [] },
        extremeMeasures: { provides: ['flux'], wants: [] },
        vent: { provides: [], wants: ['flux'] },
        reset: { provides: [], wants: ['flux'] },
        purge: { provides: [], wants: ['flux'] },
        coolantFlush: { provides: [], wants: ['flux'] },
        burnout: { provides: [], wants: ['flux'] },
        swapSystems: { provides: ['layout'], wants: [] },
        relocateSystem: { provides: ['layout'], wants: [] },
        railFeed: { provides: [], wants: ['layout'] },
        busLink: { provides: [], wants: ['layout'] },
        daisyChain: { provides: [], wants: ['layout'] },
    } as const;

    it('tag Charge and Flux builders as providing them, and their payoffs as wanting them', () => {
        for (const [type, synergy] of Object.entries(tagged)) {
            expect(getCardSynergy(type as CardType), type).toEqual(synergy);
        }
    });

    it('give a work order for a builder its payoffs, and for a payoff its builders', () => {
        expect(getSynergyCardTypes('trickleCharge').sort()).toEqual(['buffer', 'discharge', 'surgeDraw']);
        expect(getSynergyCardTypes('discharge').sort()).toEqual(['bankPower', 'runQuiet', 'trickleCharge']);
        expect(getSynergyCardTypes('redline').sort()).toEqual(['burnout', 'coolantFlush', 'purge', 'reset', 'vent']);
        expect(getSynergyCardTypes('vent').sort()).toEqual(['extremeMeasures', 'hotStart', 'redline']);
        expect(getSynergyCardTypes('swapSystems').sort()).toEqual(['busLink', 'daisyChain', 'railFeed']);
        expect(getSynergyCardTypes('busLink').sort()).toEqual(['relocateSystem', 'swapSystems']);
    });
});

describe('the engineer\'s style cards', () => {
    it('can all be bought from the engineer\'s shop', () => {
        const shop = getShopCardTypes('engineer');

        for (const type of ['trickleCharge', 'bankPower', 'discharge', 'surgeDraw', 'redline', 'vent', 'railFeed', 'priorityFeed', 'buffer', 'hotStart', 'extremeMeasures',
            'coolantFlush', 'burnout', 'busLink', 'daisyChain', 'groundOut', 'juryRig', 'fabricate'] as const) {
            expect(shop).toContain(type);
        }
    });

    it('are all left behind with the encounter: every system has its power back for the next', () => {
        const { ship, tile, play } = createShip();
        play('bankPower', 'science');
        play('redline', 'helm');
        play('railFeed', 'tactical');
        tile('reactor').adjustEffectLevel('charge', 3);
        tile('reactor').adjustEffectLevel('flux', 1);
        play('discharge', 'reactor');
        play('vent');
        ship.engineerState.adjustPowerLevel(1);
        play('emergencyPower');
        play('cannibalise', 'science');
        ship.engineerState.adjustPowerLevel(-1);

        ship.cleanupAfterEncounter();

        for (const system of ship.engineerState.systems) {
            expect(system.power).toBe(3);
            expect(system.effects.length).toBe(0);
        }
    });
});
