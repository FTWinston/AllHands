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
    autoDestructDamage, autoDestructDuration, autoDestructRange, bankPowerCharge, bankPowerDuration, bankPowerLoss, chargeMaxLevel, dischargeDuration,
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
        for (const type of ['autoDestruct', 'abortAutoDestruct', 'cannibalise', 'graft', 'emergencyPower'] as const) {
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
        const { state } = created;
        state.initFactions([{ id: 'player' }], 'player');
        state.factionRegistry.setEncounterFactions([{ id: 'raiders', relations: { player: RelationshipType.Hostile } }]);

        const addShip = (x: number) => {
            const other = new AiShip(state, createShipSetup('waterModule', 'raiders', { x, y: 0, angle: 0 }));
            state.add(other);
            return other;
        };

        return { ...created, addShip };
    }

    const abortCards = (ship: PlayerShip) => ship.engineerState.hand.filter(card => card.type === 'abortAutoDestruct');

    it('starts a 15 second countdown on the engineer\'s system, and puts a priority Abort Auto-destruct card in the engineer\'s hand', () => {
        const { state, ship, tile, playChoice } = createShips();
        expect(autoDestructDuration).toBe(15_000);
        expect(cardDefinitions.abortAutoDestruct).toMatchObject({ targetType: 'no-target', traits: ['expendable', 'priority'] });

        expect(playChoice('extremeMeasures', 'autoDestruct')).toBe(true);

        expect(tile('engineer').effects.find(effect => effect.type === 'autoDestructing')!.progress?.endTime).toBe(state.currentTime + autoDestructDuration);
        expect(abortCards(ship).length).toBe(1);

        // There's only ever one countdown.
        expect(playChoice('extremeMeasures', 'autoDestruct')).toBe(false);
        expect(abortCards(ship).length).toBe(1);
    });

    it('makes room in a full hand for the abort card', () => {
        const { ship, playChoice } = createShips();
        while (ship.engineerState.hand.length < ship.engineerState.maxHandSize) {
            ship.engineerState.addCardToHand(new CardState(ship.getCardId(), 'purge'));
        }

        expect(playChoice('extremeMeasures', 'autoDestruct')).toBe(true);
        expect(abortCards(ship).length).toBe(1);
    });

    it('when the countdown runs out, heavily damages every ship nearby, and destroys the ship', () => {
        const { state, ship, playChoice, wait, addShip } = createShips();
        expect(autoDestructRange).toBe(6);
        expect(autoDestructDamage).toBe(60);
        const near = addShip(autoDestructRange - 1);
        const far = addShip(autoDestructRange + 1);
        const nearHealth = near.hullState.health;
        const farHealth = far.hullState.health;

        playChoice('extremeMeasures', 'autoDestruct');

        wait(autoDestructDuration - 1);
        expect(state.objects.has(ship.id)).toBe(true);
        expect(near.hullState.health).toBe(nearHealth);

        wait(1);
        expect(state.objects.has(ship.id)).toBe(false);
        expect(near.hullState.health).toBeLessThan(nearHealth);
        expect(far.hullState.health).toBe(farHealth);
    });

    it('is stopped by the abort card, which is used up', () => {
        const { state, ship, tile, playChoice, wait, addShip } = createShips();
        const near = addShip(1);
        const nearHealth = near.hullState.health;
        playChoice('extremeMeasures', 'autoDestruct');
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
        const { ship, tile, playChoice } = createShips();

        playChoice('extremeMeasures', 'autoDestruct');
        tile('engineer').removeEffect('autoDestructing', 'early');
        expect(abortCards(ship).length).toBe(0);

        playChoice('extremeMeasures', 'autoDestruct');
        ship.cleanupAfterEncounter();
        expect(tile('engineer').hasEffect('autoDestructing')).toBe(false);
        expect(abortCards(ship).length).toBe(0);
    });

    it('isn\'t moved by a Shunt', () => {
        const { ship, tile, play, playChoice } = createShips();
        playChoice('extremeMeasures', 'autoDestruct');

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
    } as const;

    it('tag Charge and Flux builders as providing them, and their payoffs as wanting them', () => {
        for (const [type, synergy] of Object.entries(tagged)) {
            expect(getCardSynergy(type as CardType), type).toEqual(synergy);
        }
    });

    it('give a work order for a builder its payoffs, and for a payoff its builders', () => {
        expect(getSynergyCardTypes('trickleCharge').sort()).toEqual(['buffer', 'discharge', 'surgeDraw']);
        expect(getSynergyCardTypes('discharge').sort()).toEqual(['bankPower', 'runQuiet', 'trickleCharge']);
        expect(getSynergyCardTypes('redline').sort()).toEqual(['purge', 'reset', 'vent']);
        expect(getSynergyCardTypes('vent').sort()).toEqual(['extremeMeasures', 'hotStart', 'redline']);
    });
});

describe('the engineer\'s style cards', () => {
    it('can all be bought from the engineer\'s shop', () => {
        const shop = getShopCardTypes('engineer');

        for (const type of ['trickleCharge', 'bankPower', 'discharge', 'surgeDraw', 'redline', 'vent', 'railFeed', 'priorityFeed', 'buffer', 'hotStart', 'extremeMeasures'] as const) {
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
