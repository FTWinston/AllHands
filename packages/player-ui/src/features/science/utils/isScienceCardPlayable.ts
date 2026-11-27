import { cardDefinitions, CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { resolveParameter } from 'common-ui/types/resolveParameters';

/** What science's client knows of its own situation, that decides whether some of its cards can be played. */
export type ScienceCardPlayContext = {
    /** How much Insight science holds. */
    insight: number;
    /** Whether science is scanning a ship. */
    isScanningShip: boolean;
    /** Whether science is scanning one of that ship's systems. */
    isScanningSystem: boolean;
};

/** What a science card needs to be scanning, to be played: a ship, or one of its systems. */
const scanRequirements: Partial<Record<CardType, 'ship' | 'system'>> = {
    eureka: 'system',
    predictiveModel: 'ship',
    plottedCourse: 'ship',
    catalyse: 'system',
    halfLife: 'system',
    crossReaction: 'system',
    saturate: 'system',
};

/**
 * Whether the server would play a science card, as far as its client can tell: any Insight it costs is held, and what it needs scanned is being scanned.
 * The particles on a scanned system aren't known to the client, so a card that needs them may still be refused.
 */
export function isScienceCardPlayable(card: { type: CardType; modifiers?: Partial<Record<string, number>> }, context: ScienceCardPlayContext): boolean {
    const insightCost = resolveParameter('insightCost', cardDefinitions[card.type].parameters, card.modifiers);
    if (context.insight < insightCost) {
        return false;
    }

    switch (scanRequirements[card.type]) {
        case 'ship':
            return context.isScanningShip;
        case 'system':
            return context.isScanningSystem;
        default:
            return true;
    }
}
