import { cardDefinitions } from 'common-data/features/cards/utils/cardDefinitions';
import { MAX_POWER_LEVEL } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { describe, expect, it } from 'vitest';
import { createShipSetup, defaultSkill, type ShipDesign } from './shipDesigns';

const designs: ShipDesign[] = ['harrier', 'fighter', 'bulwark', 'flagship', 'clinicShip'];
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

    it.each(designs)('%s can load its weapons on baseline power', (design) => {
        const setup = createShipSetup(design, 'side', origin);
        // Each reactor card gives its system one level of baseline power.
        const tacticalPower = setup.reactor.cards.filter(card => card === 'reactorPowerTactical').length;
        for (const cardType of setup.tactical.cards) {
            const definition = cardDefinitions[cardType];
            if (definition.targetType === 'weapon-slot') {
                expect(definition.parameters.cost).toBeLessThanOrEqual(tacticalPower);
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
