import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { defineEngineCards } from 'engine/content/EngineContent';
import { cards as sharedCards, disruptedDamage } from './weaponTraitsCards.shared';
import type { CardParameters } from 'common-data/features/cards/types/CardParameters';
import type { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import type { CardEvaluator } from 'engine/ai/types';
import type { GameState } from 'engine/state/GameState';
import type { Ship } from 'engine/state/Ship';

/** A Disrupted card's play: it damages its own station's system. */
function disrupt(role: CrewRoleName) {
    return (_gameState: GameState, ship: Ship, parameters: CardParameters) => {
        ship.getSystem(role).applyDamage.invoke(parameters.damage ?? disruptedDamage);
        return true;
    };
}

/** The AI plays a Disrupted card to clear it from the hand, though it's worth less than anything useful. */
function disruptedEvaluator(cardType: CardType): CardEvaluator {
    return card => [{
        score: 25,
        cost: card.getParameter('cost'),
        action: { kind: 'playCard', cardId: card.id, cardType, targetType: 'no-target', targetId: '' },
    }];
}

export const cards = defineEngineCards(sharedCards, {
    disruptedHelm: { play: disrupt('helm'), aiEvaluator: disruptedEvaluator('disruptedHelm') },
    disruptedScience: { play: disrupt('science'), aiEvaluator: disruptedEvaluator('disruptedScience') },
    disruptedTactical: { play: disrupt('tactical'), aiEvaluator: disruptedEvaluator('disruptedTactical') },
    disruptedEngineer: { play: disrupt('engineer'), aiEvaluator: disruptedEvaluator('disruptedEngineer') },
});
