import { cardDefinitions, CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { resolveParameter } from 'common-ui/types/resolveParameters';

/** What the helm knows that decides whether a card can be played now, besides its cost. */
export type HelmCardPlayContext = {
    /** How many levels of Momentum the ship has. */
    momentumLevel: number;
};

/**
 * Whether a helm card can be played now, besides whether there's the power for it: a card that needs or spends Momentum can't be played without enough of it.
 * The engine refuses such cards too; this is so the helm can see that, by the card being greyed out.
 */
export function isHelmCardPlayable(card: { type: CardType; modifiers?: Partial<Record<string, number>> }, context: HelmCardPlayContext): boolean {
    const parameters = cardDefinitions[card.type].parameters;
    const needed = Math.max(
        resolveParameter('minMomentum', parameters, card.modifiers),
        resolveParameter('momentumCost', parameters, card.modifiers)
    );

    return context.momentumLevel >= needed;
}
