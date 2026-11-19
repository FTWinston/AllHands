import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { AiShip } from 'src/state/AiShip';
import { setupGameRoom, shipSetup, startCampaign } from 'src/testUtils';
import { describe, expect, it } from 'vitest';

const rooms = setupGameRoom();

function createScene() {
    const state = rooms.createState();
    const { ships: [ship] } = startCampaign(state);
    state.factionRegistry.setEncounterFactions([{ id: 'raiders', relations: { [state.playerFaction!]: RelationshipType.Hostile } }]);

    const raider = new AiShip(state, { ...shipSetup('raiders', 20, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
    state.add(raider);
    const farRaider = new AiShip(state, { ...shipSetup('raiders', 5000, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
    state.add(farRaider);
    ship.updateKnownObjects(state.currentTime);

    return { state, ship, tactical: ship.tacticalState, raider, farRaider };
}

describe('TacticalState target selection', () => {
    it('records a known object as the selected target, and mirrors it on the ship for helm', () => {
        const { ship, tactical, raider } = createScene();

        expect(tactical.selectTarget(raider.id)).toBe(true);
        expect(tactical.selectedTargetId).toBe(raider.id);

        ship.tick(0, 0);
        expect(ship.tacticalTargetId).toBe(raider.id);
    });

    it('accepts an empty id as no target', () => {
        const { tactical, raider } = createScene();
        tactical.selectTarget(raider.id);

        expect(tactical.selectTarget('')).toBe(true);
        expect(tactical.selectedTargetId).toBe('');
    });

    it('refuses an unknown or out of range object, its own ship, and anything that is not an id, leaving the selection as it was', () => {
        const { ship, tactical, raider, farRaider } = createScene();
        tactical.selectTarget(raider.id);

        expect(tactical.selectTarget('nonsense')).toBe(false);
        expect(tactical.selectTarget(farRaider.id)).toBe(false);
        expect(tactical.selectTarget(ship.id)).toBe(false);
        expect(tactical.selectTarget(undefined as unknown as string)).toBe(false);
        expect(tactical.selectTarget({} as unknown as string)).toBe(false);

        expect(tactical.selectedTargetId).toBe(raider.id);
    });

    it('is cleared when the selected object leaves the game', () => {
        const { state, ship, tactical, raider } = createScene();
        tactical.selectTarget(raider.id);

        raider.destroy();
        ship.updateKnownObjects(state.currentTime);
        tactical.update(state.currentTime);

        expect(tactical.selectedTargetId).toBe('');
    });

    it('is cleared when the selected object goes out of sensor range', () => {
        const { state, ship, tactical, raider } = createScene();
        tactical.selectTarget(raider.id);

        for (const frame of raider.motion) {
            frame.x = 5000;
        }
        ship.updateKnownObjects(state.currentTime);
        tactical.update(state.currentTime);

        expect(tactical.selectedTargetId).toBe('');
    });

    it('is cleared once the encounter is over', () => {
        const { ship, tactical, raider } = createScene();
        tactical.selectTarget(raider.id);

        ship.cleanupAfterEncounter();

        expect(tactical.selectedTargetId).toBe('');
    });
});
