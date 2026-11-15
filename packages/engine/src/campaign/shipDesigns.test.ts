import { cardDefinitions } from 'common-data/features/cards/utils/cardDefinitions';
import { crewRoleNames } from 'common-data/features/ships/types/CrewRole';
import { shipSystems } from 'common-data/features/ships/types/ShipSystem';
import { MAX_POWER_LEVEL } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { AiShip } from 'src/state/AiShip';
import { seededRandom, setupGameRoom } from 'src/testUtils';
import { describe, expect, it, vi } from 'vitest';
import { createShipSetup, defaultSkill, getShipDesigns, inertPriorities, inertTemplate, type ShipDesign } from './shipDesigns';
import type { AiShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';

/** Every design, wherever its content folder is. */
const designs = getShipDesigns();
const origin = { x: 0, y: 0, angle: 0 };

describe('ship designs', () => {
    it.each(designs)('%s can afford every card it carries', (design) => {
        const setup = createShipSetup(design, 'side', origin);
        for (const system of [setup.helm, setup.science, setup.tactical, setup.engineer]) {
            for (const cardType of system.cards) {
                expect(cardDefinitions[cardType].parameters.cost).toBeLessThanOrEqual(Math.min(system.maxPowerLevel, MAX_POWER_LEVEL));
            }
        }
    });

    it('gives each design its own appearance, whichever side it is on', () => {
        const appearances = designs.map(design => createShipSetup(design, 'side', origin).appearance);
        expect(new Set(appearances).size).toBe(designs.length);
        expect(designs.map(design => createShipSetup(design, 'another', origin).appearance)).toEqual(appearances);
    });

    it('joins the given side, with the skill and name the encounter chooses', () => {
        expect(createShipSetup('harrier', 'wardens', origin)).toMatchObject({ faction: 'wardens', skill: defaultSkill, name: 'Harrier' });
        expect(createShipSetup('harrier', 'wardens', origin, { skill: 0.5, name: 'Escort One' })).toMatchObject({ skill: 0.5, name: 'Escort One' });
    });
});

describe('ships that do nothing', () => {
    const rooms = setupGameRoom();

    function createState() {
        const state = rooms.createState(seededRandom(2));
        state.initFactions([{ id: 'player' }], 'player');
        state.factionRegistry.setEncounterFactions([{ id: 'objects' }, { id: 'raiders', relations: { objects: RelationshipType.Hostile } }]);
        return state;
    }

    const inertSetup = (position = origin): AiShipSetupInfo => ({
        ...inertTemplate('mining-barge', Array<'hullBare'>(20).fill('hullBare')),
        name: 'Module',
        faction: 'objects',
        position,
        goal: { type: 'search-and-destroy' },
        skill: 1,
    });

    it('have one card in each crew system, none in hand, nothing in the reactor, and no power anywhere', () => {
        const state = createState();
        const ship = new AiShip(state, inertSetup());

        for (const role of crewRoleNames) {
            const system = ship.getCrewSystem(role);
            expect(system.maxHealth).toBe(1);
            expect(system.hand).toHaveLength(0);
            expect(system.powerLevel).toBe(0);
        }

        expect(ship.reactorState.deck).toHaveLength(0);
        expect(ship.hullState.maxHealth).toBe(20);
        expect(ship.hullState.maxShield).toBe(0);
    });

    it('play nothing and stay put for a minute beside a hostile', () => {
        const state = createState();
        const ship = new AiShip(state, inertSetup({ x: 3, y: 4, angle: 1 }));
        // The hostile does everything but shoot, so the inert ship has something to react to, and is still there to watch.
        const hostile = new AiShip(state, createShipSetup('fighter', 'raiders', { x: 8, y: 4, angle: Math.PI }, { priorities: { tactical: 0 } }));
        state.add(ship);
        state.add(hostile);

        const cards = () => shipSystems.map(system => [...ship.getSystem(system).deck, ...ship.getSystem(system).hand].map(card => `${card.id}:${card.type}`));
        const before = cards();
        const shots = vi.spyOn(state, 'broadcastWeaponEffect');

        for (let elapsed = 0; elapsed < 60_000; elapsed += 100) {
            state.tick(100);
        }

        expect(state.factionRegistry.areHostile(ship, hostile)).toBe(true);
        expect(hostile.getPosition(state.currentTime)).not.toMatchObject({ x: 8, y: 4 });
        expect(ship.getPosition(state.currentTime)).toEqual({ x: 3, y: 4, angle: 1 });
        expect(ship.helmState.activeManeuver).toBeNull();
        expect(cards()).toEqual(before);
        expect(shots.mock.calls.filter(([effect]) => effect.sourceId === ship.id)).toEqual([]);
        for (const role of crewRoleNames) {
            expect(ship.getCrewSystem(role).hand).toHaveLength(0);
        }
    });

    it('can be made by switching off a ship\'s officers when it\'s spawned, without changing its design', () => {
        expect(createShipSetup('harrier', 'side', origin, { priorities: { helm: 0 } }).priorities).toEqual({ helm: 0 });
        expect(createShipSetup('harrier', 'side', origin).priorities).toBeUndefined();
        // A tug's engineer is switched off by its design, and stays off when its helm is switched off too.
        expect(createShipSetup('tug', 'side', origin, { priorities: { helm: 0 } }).priorities).toEqual({ engineer: 0, helm: 0 });
        expect(createShipSetup('waterModule', 'side', origin).priorities).toEqual(inertPriorities);
    });
});

describe('the quarantine gate\'s designs', () => {
    const rooms = setupGameRoom();

    function build(design: ShipDesign) {
        const state = rooms.createState(seededRandom(1));
        state.initFactions([{ id: 'player' }], 'player');
        state.factionRegistry.setEncounterFactions([{ id: 'side' }]);
        const ship = new AiShip(state, createShipSetup(design, 'side', origin));
        state.add(ship);
        ship.hullState.restoreShields();
        return ship;
    }

    it('give a pylon 90 shield over 60 bare hull, fully powered, and torpedoes in one slot', () => {
        const pylon = build('gatePylon');

        expect(pylon.hullState.maxShield).toBe(90);
        expect(pylon.hullState.maxHealth).toBe(66);
        expect(pylon.hullState.powerLevel).toBe(5);
        expect(pylon.tacticalState.powerLevel).toBe(3);
        expect(pylon.tacticalState.slots).toHaveLength(1);
        expect([...pylon.tacticalState.deck, ...pylon.tacticalState.hand].map(card => card.type)).toEqual(['photonTorpedo', 'photonTorpedo']);
        expect([...pylon.helmState.deck, ...pylon.helmState.hand].every(card => card.type === 'faceTarget')).toBe(true);
        expect(createShipSetup('gatePylon', 'side', origin).fleeThreshold).toBe(0);

        // Damage that gets through takes cards at random, emitters as likely as bare hull.
        pylon.hullState.applyDamage.invoke(66);
        expect(pylon.hullState.maxShield).toBe(0);
    });

    it('give the keepers\' boat 75 fully powered shield over almost nothing, nothing but Slow and Steady, and nobody at its guns', () => {
        const boat = build('keeperBoat');

        expect(boat.hullState.maxShield).toBe(75);
        expect(boat.hullState.maxHealth).toBe(7);
        expect(boat.hullState.powerLevel).toBe(5);
        expect([...boat.helmState.deck, ...boat.helmState.hand].every(card => card.type === 'slowAndSteady')).toBe(true);
        expect(createShipSetup('keeperBoat', 'side', origin)).toMatchObject({ fleeThreshold: 0, priorities: { tactical: 0 } });
    });
});
