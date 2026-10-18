import { cardDefinitions } from 'common-data/features/cards/utils/cardDefinitions';
import { MAX_POWER_LEVEL } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { describe, expect, it } from 'vitest';
import { createEnemySetup, type EnemyRole } from './enemyTemplates';

const roles: EnemyRole[] = ['scout', 'fighter', 'heavy', 'flagship'];

describe('enemy templates', () => {
    it.each(roles)('%s can afford every card it carries', (role) => {
        const setup = createEnemySetup(role, 'factionA', { x: 0, y: 0, angle: 0 });
        for (const system of [setup.helm, setup.science, setup.tactical, setup.engineer]) {
            for (const cardType of system.cards) {
                expect(cardDefinitions[cardType].parameters.cost).toBeLessThanOrEqual(Math.min(system.maxPowerLevel, MAX_POWER_LEVEL));
            }
        }
    });

    it.each(roles)('%s can load its weapons on baseline power', (role) => {
        const setup = createEnemySetup(role, 'factionA', { x: 0, y: 0, angle: 0 });
        // Each reactor card gives its system one level of baseline power.
        const tacticalPower = setup.reactor.cards.filter(card => card === 'reactorPowerTactical').length;
        for (const cardType of setup.tactical.cards) {
            const definition = cardDefinitions[cardType];
            if (definition.targetType === 'weapon-slot') {
                expect(definition.parameters.cost).toBeLessThanOrEqual(tacticalPower);
            }
        }
    });
});
