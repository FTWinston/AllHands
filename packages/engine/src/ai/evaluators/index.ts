import { CardType, cardDefinitions } from 'common-data/features/cards/utils/cardDefinitions';
import { getCardDefinition } from 'src/cards/getEngineCardDefinition';
import { CardEvaluator } from '../types';

/**
 * TEST-ONLY override hook. Production evaluators live on the card definition's `aiEvaluator`
 * member (co-located with the card's play functions in getEngineCardDefinition.ts, so the two
 * can't drift apart). Tests use this to stub an evaluator for a card type that has no production
 * evaluator (e.g. Officer.test.ts stubs `exampleNoTarget`), or to override one for isolation.
 */
const overrides = new Map<CardType, CardEvaluator>();
const warned = new Set<CardType>();

export function registerCardEvaluator(type: CardType, evaluator: CardEvaluator): void {
    overrides.set(type, evaluator);
}

export function getCardEvaluator(type: CardType): CardEvaluator | undefined {
    const override = overrides.get(type);
    if (override) {
        return override;
    }

    // getCardDefinition throws only when `type` has no entry in cardDefinitions at all; check
    // membership first so that failure mode alone maps to "no evaluator" and any other error
    // (e.g. from a broken evaluator) still propagates instead of being swallowed.
    if (!(type in cardDefinitions)) {
        return undefined;
    }

    return getCardDefinition(type)?.aiEvaluator;
}

/** Cards without evaluators are never played by the AI; make that visible once, not fatal. */
export function warnMissingEvaluator(type: CardType): void {
    if (!warned.has(type)) {
        warned.add(type);
        console.warn(`No AI evaluator registered for card type: ${type}`);
    }
}

/**
 * Choice cards delegate to their children's evaluators. Candidates keep the choice card's id
 * but carry the child's cardType — the engine resolves cost and validation from the child
 * (CrewSystemState.playCard choice handling).
 */
export function choiceEvaluator(childTypes: CardType[]): CardEvaluator {
    return (card, ctx) => {
        const out = [];
        for (const childType of childTypes) {
            const child = getCardEvaluator(childType);
            if (!child) {
                warnMissingEvaluator(childType);
                continue;
            }
            for (const candidate of child(card, ctx)) {
                if (candidate.action.kind === 'playCard') {
                    candidate.action.cardType = childType;
                    candidate.cost = (getCardDefinition(childType).parameters['cost'] as number | undefined) ?? candidate.cost;
                }
                out.push(candidate);
            }
        }
        return out;
    };
}
