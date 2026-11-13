import { cardDefinitions } from 'common-data/features/cards/utils/cardDefinitions';
import { transferPowerDuration, transferPowerRange } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { playerShipSetup } from 'src/campaign/playerShipSetup';
import { createShipSetup } from 'src/campaign/shipDesigns';
import { AiShip } from 'src/state/AiShip';
import { CardState } from 'src/state/CardState';
import { PlayerShip } from 'src/state/PlayerShip';
import { setupGameRoom } from 'src/testUtils';
import { describe, expect, it } from 'vitest';
import type { GameState } from 'src/state/GameState';
import type { Ship } from 'src/state/Ship';

const rooms = setupGameRoom();

function createState() {
    const state = rooms.createState();
    state.initFactions([{ id: 'player' }], 'player');
    state.factionRegistry.setEncounterFactions([
        { id: 'ring', relations: { player: RelationshipType.Friendly } },
        { id: 'bystanders' },
        { id: 'raiders', relations: { player: RelationshipType.Hostile } },
    ]);

    const ship = new PlayerShip(state, playerShipSetup);
    state.add(ship);
    ship.startEncounter();
    return { state, ship };
}

function addModule(state: GameState, faction: string, x: number) {
    const module = new AiShip(state, createShipSetup('waterModule', faction, { x, y: 0, angle: 0 }));
    state.add(module);
    return module;
}

const isPowered = (ship: Ship) => ship.engineerState.systems.find(tile => tile.system === 'hull')!.hasEffect('powerReceived');

/** Plays a Transfer Power card from the player ship's engineer, having raised its power to afford it. Returns whether it was played. */
function transferPower(ship: PlayerShip, power = 4) {
    ship.engineerState.adjustPowerLevel(power - ship.engineerState.powerLevel);
    const card = new CardState(ship.getCardId(), 'transferPower');
    ship.engineerState.addCardToHand(card);
    return ship.engineerState.playCard(card.id, 'transferPower', 'no-target', '') !== null;
}

describe('Transfer Power', () => {
    it('costs one more than the engineer normally has', () => {
        const { ship } = createState();

        expect(cardDefinitions.transferPower.parameters.cost).toBe(4);
        expect(ship.engineerState.powerLevel).toBe(3);
        expect(transferPower(ship, 3)).toBe(false);
    });

    it('powers the nearest friendly ship within range, for a while', () => {
        const { state, ship } = createState();
        const near = addModule(state, 'ring', transferPowerRange - 1);
        const far = addModule(state, 'ring', transferPowerRange);

        expect(transferPower(ship)).toBe(true);

        expect(isPowered(near)).toBe(true);
        expect(isPowered(far)).toBe(false);
        expect(isPowered(ship)).toBe(false);

        const effect = near.engineerState.systems.find(tile => tile.system === 'hull')!.effects.find(e => e.type === 'powerReceived')!;
        expect(effect.progress?.endTime).toBe(state.currentTime + transferPowerDuration);
    });

    it('starts its time over if it is played again', () => {
        const { state, ship } = createState();
        const module = addModule(state, 'ring', 2.5);
        const hull = module.engineerState.systems.find(tile => tile.system === 'hull')!;

        transferPower(ship);
        state.currentTime += 5000;
        transferPower(ship);

        expect(hull.effects.filter(effect => effect.type === 'powerReceived')).toHaveLength(1);
        expect(hull.effects.find(effect => effect.type === 'powerReceived')!.progress?.endTime).toBe(state.currentTime + transferPowerDuration);
    });

    it('can\'t be played with no friendly ship in range, whoever else is close', () => {
        const { state, ship } = createState();
        const neutral = addModule(state, 'bystanders', 2);
        const hostile = addModule(state, 'raiders', 2);
        addModule(state, 'ring', transferPowerRange + 1);

        expect(transferPower(ship)).toBe(false);
        expect(isPowered(neutral)).toBe(false);
        expect(isPowered(hostile)).toBe(false);
    });
});
