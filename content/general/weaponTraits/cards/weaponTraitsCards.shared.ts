import { defineCards } from 'common-data/content/SharedContent';

/** The damage a Disrupted card does to its own system when it's played. */
export const disruptedDamage = 2;

export const cards = defineCards({
    // What a hit from a disrupting weapon puts in the hand of the crew system it lands on, one for each station, as every card belongs to one system.
    // It can only be got rid of by playing it, which damages that system.
    disruptedHelm: {
        targetType: 'no-target',
        system: 'helm',
        traits: ['expendable', 'priority'],
        parameters: { cost: 0, damage: disruptedDamage },
    },
    disruptedScience: {
        targetType: 'no-target',
        system: 'science',
        traits: ['expendable', 'priority'],
        parameters: { cost: 0, damage: disruptedDamage },
    },
    disruptedTactical: {
        targetType: 'no-target',
        system: 'tactical',
        traits: ['expendable', 'priority'],
        parameters: { cost: 0, damage: disruptedDamage },
    },
    disruptedEngineer: {
        targetType: 'no-target',
        system: 'engineer',
        traits: ['expendable', 'priority'],
        parameters: { cost: 0, damage: disruptedDamage },
    },
});
