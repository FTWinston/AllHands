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

/** Describe what a deflector loaded with the given parts does, with its numbers, e.g. "Raises damage taken by every system of the target by 20% for 15s." */
export function describeDeflector(parts: DeflectorParts) {
    const outcome = getDeflectorOutcome(parts);
    const phrases = substancePhrases[parts.substance];
    const effect = (outcome.friendly ? phrases.friendly : phrases.hostile)(describeWhere(outcome), outcome.level);
    const shields = outcome.friendly
        ? ''
        : outcome.weakenedByShields
            ? ` Weakened by up to ${Math.round(deflectorShieldDampening * 100)}% by shields.`
            : ' Ignores shields.';

    return `${effect} for ${outcome.duration / 1000}s.${shields}`;
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
