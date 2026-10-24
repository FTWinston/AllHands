import { cardDefinitions, type CardType } from './cardDefinitions';
import type { CrewRoleName } from '../../ships/types/CrewRole';
import type { CardDefinition } from '../types/CardDefinition';

/** Placeholder cards in the starting decks, which shouldn't be on sale. */
const placeholderCardTypes: ReadonlySet<CardType> = new Set(['exampleNoTarget', 'exampleEnemyTarget']);

/** Cards that are only ever one of a choice card's options, rather than being in a deck themselves. */
const choiceOptionCardTypes: ReadonlySet<CardType> = new Set(
    Object.values(cardDefinitions as Record<CardType, CardDefinition>).flatMap(definition => (definition.targetType === 'choice' ? definition.cards : []))
);

/** Card traits that rule a card out of being sold: expendable cards don't stay in a deck, and priority cards (e.g. Warp Away) are given out by the campaign. */
const excludedTraits = ['expendable', 'priority', 'unplayable'] as const;

/**
 * The cards a shop station can offer the given crew member: those that go in that crew member's deck (their card's system is the crew member's own),
 * other than expendable, campaign, placeholder or choice option cards. Reactor and hull cards have their own (automatic) decks, so are never sold.
 */
export function getShopCardTypes(role: CrewRoleName): CardType[] {
    return (Object.entries(cardDefinitions) as [CardType, CardDefinition][])
        .filter(([type, definition]) => definition.system === role
            && !placeholderCardTypes.has(type)
            && !choiceOptionCardTypes.has(type)
            && !excludedTraits.some(trait => definition.traits?.includes(trait)))
        .map(([type]) => type);
}
