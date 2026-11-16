import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { AiShip } from 'src/state/AiShip';
import { SensorGhost } from 'src/state/SensorGhost';
import { setupGameRoom, shipSetup, startCampaign } from 'src/testUtils';
import { getHostileShips, getPlayerShips } from 'src/utils/shipQueries';
import { describe, expect, it, vi } from 'vitest';

const rooms = setupGameRoom();

describe('SensorGhost', () => {
    function createCampaign() {
        const state = rooms.createState();
        const { campaign, ships: [ship] } = startCampaign(state);
        state.factionRegistry.setEncounterFactions([{ id: 'raiders', relations: { [state.playerFaction!]: RelationshipType.Hostile } }]);
        const raider = new AiShip(state, { ...shipSetup('raiders', 20, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(raider);
        return { state, campaign, ship, raider };
    }

    it('copies the ship that leaves it: its name, appearance and faction', () => {
        const { state, ship, raider } = createCampaign();

        const ghost = new SensorGhost(state, raider, 15_000);
        const playerGhost = new SensorGhost(state, ship, 15_000);

        expect([ghost.name, ghost.appearance, ghost.faction]).toEqual([raider.name, raider.appearance, raider.faction]);
        expect([playerGhost.name, playerGhost.appearance, playerGhost.faction]).toEqual([ship.name, ship.appearance, ship.faction]);
    });

    it('is not a ship, so is never one of the ships that game logic looks for', () => {
        const { state, ship, raider } = createCampaign();

        state.add(new SensorGhost(state, ship, 15_000));
        state.add(new SensorGhost(state, raider, 15_000));

        expect(getPlayerShips(state)).toEqual([ship]);
        expect(getHostileShips(state)).toEqual([raider]);
    });

    it('is taken for a ship only by those hostile to the faction it looks like', () => {
        const { state, ship, raider } = createCampaign();
        const playerGhost = new SensorGhost(state, ship, 15_000);
        const raiderGhost = new SensorGhost(state, raider, 15_000);

        expect(playerGhost.isTakenForShipBy(raider)).toBe(true);
        expect(playerGhost.isTakenForShipBy(ship)).toBe(false);
        expect(raiderGhost.isTakenForShipBy(ship)).toBe(true);
        expect(raiderGhost.isTakenForShipBy(raider)).toBe(false);
    });

    it('vanishing is not an object leaving the game, so nothing that watches for that (objectives, defeat) is told', () => {
        const { state, campaign, ship, raider } = createCampaign();
        const removed = vi.spyOn(campaign, 'onObjectRemoved');
        const playerGhost = new SensorGhost(state, ship, 15_000);
        const raiderGhost = new SensorGhost(state, raider, 15_000);
        state.add(playerGhost);
        state.add(raiderGhost);

        playerGhost.expose();
        raiderGhost.expose();

        expect(state.objects.has(playerGhost.id)).toBe(false);
        expect(state.objects.has(raiderGhost.id)).toBe(false);
        expect(removed).not.toHaveBeenCalled();
        expect(state.outcome).toBeNull();

        // A real ship leaving is told of, as it should be.
        raider.destroy();
        expect(removed).toHaveBeenCalledOnce();
    });

    it('vanishes at the end of the encounter, with every other object that isn\'t a player\'s ship', () => {
        const { state, campaign, ship, raider } = createCampaign();
        const playerGhost = new SensorGhost(state, ship, 15_000);
        const raiderGhost = new SensorGhost(state, raider, 15_000);
        state.add(playerGhost);
        state.add(raiderGhost);

        (campaign as unknown as { teardownEncounter(): void }).teardownEncounter();

        expect([...state.objects.values()]).toEqual([ship]);
    });

    it('vanishing again, once it has vanished, does nothing', () => {
        const { state, ship } = createCampaign();
        const ghost = new SensorGhost(state, ship, 15_000);
        state.add(ghost);
        const removed = vi.spyOn(state, 'remove');

        ghost.expose();
        ghost.expose();

        expect(removed).toHaveBeenCalledOnce();
    });
});
