import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { AiShip } from 'src/state/AiShip';
import { SensorGhost } from 'src/state/SensorGhost';
import { setupGameRoom, shipSetup, startCampaign } from 'src/testUtils';
import { getContactLabel } from 'src/utils/contactLabels';
import { describe, expect, it } from 'vitest';

const rooms = setupGameRoom();

function createScene() {
    const state = rooms.createState();
    const { ships: [ship] } = startCampaign(state);
    state.factionRegistry.setEncounterFactions([{ id: 'raiders', relations: { [state.playerFaction!]: RelationshipType.Hostile } }]);

    const addRaider = (x: number) => {
        const raider = new AiShip(state, { ...shipSetup('raiders', x, 0), name: 'Enemy Ship', goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(raider);
        return raider;
    };

    return { state, ship, addRaider };
}

/** Move a ship, which sits still, somewhere else. */
function moveTo(ship: AiShip, x: number) {
    for (const frame of ship.motion) {
        frame.x = x;
    }
}

describe('contact labels', () => {
    it('are the phonetic alphabet, in the order that contacts are found, then numbered', () => {
        expect(getContactLabel(0)).toBe('Alpha');
        expect(getContactLabel(1)).toBe('Bravo');
        expect(getContactLabel(25)).toBe('Zulu');
        expect(getContactLabel(26)).toBe('Alpha 2');
        expect(getContactLabel(52)).toBe('Alpha 3');
    });

    it('give ships that share a name different labels, and the ship itself none', () => {
        const { state, ship, addRaider } = createScene();
        const first = addRaider(20);
        const second = addRaider(-20);

        ship.updateKnownObjects(state.currentTime);

        expect(first.name).toBe(second.name);
        expect(ship.contactLabels.get(first.id)).toBe('Alpha');
        expect(ship.contactLabels.get(second.id)).toBe('Bravo');
        expect(ship.contactLabels.has(ship.id)).toBe(false);
    });

    it('give a sensor ghost a label of its own, though it has its ship name', () => {
        const { state, ship, addRaider } = createScene();
        const raider = addRaider(20);
        const ghost = new SensorGhost(state, raider, 15_000);
        state.add(ghost);

        ship.updateKnownObjects(state.currentTime);

        expect(ghost.name).toBe(raider.name);
        expect(ship.contactLabels.get(ghost.id)).toBeDefined();
        expect(ship.contactLabels.get(ghost.id)).not.toBe(ship.contactLabels.get(raider.id));
    });

    it('stay the same while a contact is in the game, even when it leaves sensor range and returns', () => {
        const { state, ship, addRaider } = createScene();
        const first = addRaider(20);
        addRaider(-20);
        ship.updateKnownObjects(state.currentTime);
        const label = ship.contactLabels.get(first.id);

        moveTo(first, 5000);
        ship.updateKnownObjects(state.currentTime);
        expect(ship.knownObjects.has(first.id)).toBe(false);
        expect(ship.contactLabels.get(first.id)).toBe(label);

        moveTo(first, 20);
        ship.updateKnownObjects(state.currentTime);
        expect(ship.contactLabels.get(first.id)).toBe(label);
    });

    it('are given up when a contact leaves the game, and then used again by the next contact, not by those already labelled', () => {
        const { state, ship, addRaider } = createScene();
        const first = addRaider(20);
        const second = addRaider(-20);
        ship.updateKnownObjects(state.currentTime);

        first.destroy();
        ship.updateKnownObjects(state.currentTime);
        expect(ship.contactLabels.has(first.id)).toBe(false);
        expect(ship.contactLabels.get(second.id)).toBe('Bravo');

        const third = addRaider(0);
        ship.updateKnownObjects(state.currentTime);
        expect(ship.contactLabels.get(third.id)).toBe('Alpha');
    });

    it('differ between ships, as each crew labels contacts in the order it found them', () => {
        const state = rooms.createState();
        const { ships: [first, second] } = startCampaign(state, 2);
        state.factionRegistry.setEncounterFactions([{ id: 'raiders', relations: { [state.playerFaction!]: RelationshipType.Hostile } }]);
        const raider = new AiShip(state, { ...shipSetup('raiders', 20, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(raider);

        first.updateKnownObjects(state.currentTime);
        second.updateKnownObjects(state.currentTime);

        // Each ship finds the objects in the game's order, and the first ship is the other's first contact.
        expect(first.contactLabels.get(second.id)).toBe('Alpha');
        expect(first.contactLabels.get(raider.id)).toBe('Bravo');
        expect(second.contactLabels.get(first.id)).toBe('Alpha');
    });
});
