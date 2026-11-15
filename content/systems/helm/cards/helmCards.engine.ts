import { choiceEvaluator } from 'engine/ai/evaluators';
import { locationCardEvaluator } from 'engine/ai/evaluators/helm';
import { applyMotionCard } from 'engine/cards/applyMotionCard';
import { defineEngineCards } from 'engine/content/EngineContent';
import { cards as sharedCards } from './helmCards.shared';

export const cards = defineEngineCards(sharedCards, {
    warpAway: {
        play: (gameState, ship) => {
            return gameState.campaign?.warpAway(ship) === true;
        },
    },
    slowAndSteady: {
        aiEvaluator: locationCardEvaluator('slowAndSteady'),
        play: applyMotionCard,
    },
    fullReverse: {
        aiEvaluator: locationCardEvaluator('fullReverse'),
        play: applyMotionCard,
    },
    zigZag: {
        aiEvaluator: locationCardEvaluator('zigZag'),
        play: applyMotionCard,
    },
    strafe: {
        aiEvaluator: locationCardEvaluator('strafe'),
        play: applyMotionCard,
    },
    sweepLeft: {
        aiEvaluator: locationCardEvaluator('sweepLeft'),
        play: applyMotionCard,
    },
    sweepRight: {
        aiEvaluator: locationCardEvaluator('sweepRight'),
        play: applyMotionCard,
    },
    faceTarget: {
        aiEvaluator: locationCardEvaluator('faceTarget'),
        play: applyMotionCard,
    },
    sweep: {
        aiEvaluator: choiceEvaluator(['sweepLeft', 'sweepRight']),
    },
});
