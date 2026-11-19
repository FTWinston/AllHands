import { defineUiContent } from 'common-ui/content/UiContent';
import { Trait } from 'common-ui/features/cards/components/Trait';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { deflectorBurstRadius, deflectorShieldDampening, getDeflectorOutcome, mapDeflectorCards, type DeflectorOutcome, type DeflectorParts } from './deflectorParts.shared';
import { deflectorsShared } from './deflectors.shared';
import type { DeflectorEffectSubstance } from 'common-data/features/cards/types/CardDefinition';

/** What a deflector's effect does to the systems (or ships) described by `where`, for each substance: to hostile ships, and inverted, to friendly ones. */
const substancePhrases: Record<DeflectorEffectSubstance, { hostile: (where: string, level: number | null) => string; friendly: (where: string, level: number | null) => string }> = {
    Antiproton: {
        hostile: (where, level) => `Raises damage taken by ${where} by ${level}%`,
        friendly: (where, level) => `Cuts damage taken by ${where} by ${level}%`,
    },
    Tetryon: {
        hostile: (where, level) => `Makes ${where} ${level}% easier to hit`,
        friendly: (where, level) => `Makes ${where} ${level}% harder to hit`,
    },
    Chroniton: {
        hostile: where => `Makes ${where} fail every other card draw`,
        friendly: where => `Makes every other card draw of ${where} bring an extra card`,
    },
    Polaron: {
        hostile: (where, level) => `Takes ${level} power from ${where}`,
        friendly: (where, level) => `Gives ${where} ${level} extra power`,
    },
    Graviton: {
        hostile: (where, level) => `Slows manoeuvres of ${where} by ${level}%`,
        friendly: (where, level) => `Speeds up manoeuvres of ${where} by ${level}%`,
    },
};

/** Which ships a deflector hits. */
function describeShips(outcome: DeflectorOutcome) {
    if (outcome.ships === 'zone') {
        return `each ${outcome.friendly ? 'friendly' : 'hostile'} ship inside it`;
    }

    if (outcome.ships === 'target') {
        return outcome.friendly ? 'your ship' : 'the target';
    }

    return outcome.friendly
        ? `your ship and each friendly ship within ${deflectorBurstRadius} of it`
        : `each hostile ship within ${deflectorBurstRadius} of your ship`;
}

/** Which systems of which ships a deflector hits. */
function describeWhere(outcome: DeflectorOutcome) {
    const ships = describeShips(outcome);

    switch (outcome.systems) {
        case 'helm':
            return ships;
        case 'all':
            return `every system of ${ships}`;
        case 'one':
            return outcome.friendly
                ? `one system of ${ships} (the kind being scanned, if any)`
                : `one system of ${ships} (the one being scanned, if any)`;
    }
}

/** What a deflector does to the shields of the ships it hits, if anything, as a sentence. */
function describeShields(outcome: DeflectorOutcome) {
    const { shields } = outcome;
    if (!shields) {
        return '';
    }

    const ships = describeShips(outcome);
    const percent = Math.round(shields.percent * 10) / 10;
    const each = outcome.ships === 'zone' ? ' each second' : '';

    return shields.restores
        ? ` Restores ${percent}% of the shields of ${ships}${each}.`
        : ` Drains ${percent}% of the shields of ${ships}${each}, and scrambles their tuning.`;
}

/** Make the first letter of a phrase lower case, so that it can carry on a sentence. */
function lowerFirst(text: string) {
    return text.charAt(0).toLowerCase() + text.slice(1);
}

/**
 * Describe what a deflector loaded with the given parts does, with its numbers, e.g. "Raises damage taken by every system of the target by 20% for 15s."
 * A field's is described by what it does to every ship inside it, e.g. "Leaves a field around the target for 20s that raises damage taken by ... of each hostile ship inside it by 20%."
 */
export function describeDeflector(parts: DeflectorParts) {
    const outcome = getDeflectorOutcome(parts);
    const phrases = substancePhrases[parts.substance];
    const effect = (outcome.friendly ? phrases.friendly : phrases.hostile)(describeWhere(outcome), outcome.level);
    const shields = outcome.friendly
        ? ''
        : outcome.weakenedByShields
            ? ` Weakened by up to ${Math.round(deflectorShieldDampening * 100)}% by shields.`
            : ' Ignores shields.';

    if (outcome.fieldDuration !== null) {
        const around = outcome.friendly ? 'your ship' : 'the target';
        return `Leaves a field around ${around} for ${outcome.fieldDuration / 1000}s that ${lowerFirst(effect)}.${describeShields(outcome)}${shields}`;
    }

    return `${effect} for ${outcome.duration / 1000}s.${describeShields(outcome)}${shields}`;
}

export const deflectorsUi = defineUiContent({
    shared: deflectorsShared,
    // Each combination of parts' deflector card is named after its parts, and described by what they do.
    cards: mapDeflectorCards(parts => ({
        name: `${parts.modifier} ${parts.substance} ${parts.delivery}`,
        description: <>
            <Trait trait="expendable" />
            {' '}
            {describeDeflector(parts)}
        </>,
        image: <ExampleIcon />,
    })),
});
