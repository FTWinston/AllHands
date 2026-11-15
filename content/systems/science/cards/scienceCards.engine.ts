import { scanEvaluator } from 'engine/ai/evaluators/science';
import { defineEngineCards } from 'engine/content/EngineContent';
import { cards as sharedCards } from './scienceCards.shared';

export const cards = defineEngineCards(sharedCards, {
    exampleNoTarget: {
        play: (_gameState, _ship) => {
            return true;
        },
    },
    passiveScan: {
        aiEvaluator: scanEvaluator,
        load: () => {
            return true;
        },
        revealSystem: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.subscribeToSystem(target, targetSystem);
            return true;
        },
        findVulnerability: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.findVulnerability(target, targetSystem);
            return true;
        },
    },
    antiprotonScan: {
        aiEvaluator: scanEvaluator,
        load: () => {
            return true;
        },
        revealSystem: (_gameState, ship, target, targetSystem, parameters) => {
            ship.scienceState.subscribeToSystem(target, targetSystem);
            target.getSystem(targetSystem).adjustEffectLevel('antiprotonResidue', parameters.effectLevel);
            return true;
        },
        findVulnerability: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.findVulnerability(target, targetSystem);
            return true;
        },
    },
    tetryonScan: {
        aiEvaluator: scanEvaluator,
        load: () => {
            return true;
        },
        revealSystem: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.subscribeToSystem(target, targetSystem);
            return true;
        },
        findVulnerability: (_gameState, ship, target, targetSystem, parameters) => {
            ship.scienceState.findVulnerability(target, targetSystem);
            target.hullState.scrambleShields(parameters.scrambleCards);
            return true;
        },
    },
    chronitonScan: {
        aiEvaluator: scanEvaluator,
        load: () => {
            return true;
        },
        revealSystem: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.subscribeToSystem(target, targetSystem);
            target.getSystem(targetSystem).addEffect('chronitonSaturation');
            return true;
        },
        findVulnerability: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.findVulnerability(target, targetSystem);
            return true;
        },
    },
    polaronScan: {
        aiEvaluator: scanEvaluator,
        load: () => {
            return true;
        },
        revealSystem: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.subscribeToSystem(target, targetSystem);
            return true;
        },
        findVulnerability: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.findVulnerability(target, targetSystem);
            target.getSystem(targetSystem).adjustEffectLevel('polaronBombardment', 1);
            return true;
        },
    },
    invertedPulseScan: {
        aiEvaluator: scanEvaluator,
        load: () => {
            return true;
        },
        revealSystem: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.subscribeToSystem(target, targetSystem);
            return true;
        },
        findVulnerability: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.findVulnerability(target, targetSystem);
            ship.scienceState.drawFromTop(2);
            return true;
        },
    },
    coherentBeamScan: {
        aiEvaluator: scanEvaluator,
        load: () => {
            return true;
        },
        revealSystem: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.subscribeToSystem(target, targetSystem);
            ship.scienceState.findVulnerability(target, targetSystem); // Also find a vulnerability, immediately.
            return true;
        },
        findVulnerability: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.findVulnerability(target, targetSystem);
            return true;
        },
    },
    phasedBurstScan: {
        aiEvaluator: scanEvaluator,
        load: () => {
            return true;
        },
        revealSystem: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.subscribeToSystem(target, targetSystem);
            ship.scienceState.addEffect('reducedCardCost');
            return true;
        },
        findVulnerability: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.findVulnerability(target, targetSystem);
            return true;
        },
    },
    phasedPolaronScan: {
        aiEvaluator: scanEvaluator,
        load: () => {
            return true;
        },
        revealSystem: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.subscribeToSystem(target, targetSystem);
            target.getSystem(targetSystem).addEffect('polaronAccumulation');
            return true;
        },
        findVulnerability: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.findVulnerability(target, targetSystem);
            return true;
        },
    },
    coherentTetryonScan: {
        aiEvaluator: scanEvaluator,
        load: () => {
            return true;
        },
        revealSystem: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.subscribeToSystem(target, targetSystem);
            target.getSystem(targetSystem).adjustEffectLevel('tetryonSaturation', 30);
            return true;
        },
        findVulnerability: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.findVulnerability(target, targetSystem);
            return true;
        },
    },
    coherentChronitonScan: {
        aiEvaluator: scanEvaluator,
        load: () => {
            return true;
        },
        revealSystem: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.subscribeToSystem(target, targetSystem);
            return true;
        },
        findVulnerability: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.findVulnerability(target, targetSystem);

            // Fill your hand with expendable copies of your last drawn card.
            const sourceCard = ship.scienceState.getLastDrawnCard();
            if (sourceCard) {
                while (ship.scienceState.hand.length < ship.scienceState.maxHandSize) {
                    const expendableCopy = sourceCard.createExpendableCopy(ship.getCardId());
                    ship.scienceState.addCardToHand(expendableCopy);
                }
            }
            return true;
        },
    },
    invertedAntiprotonScan: {
        aiEvaluator: scanEvaluator,
        load: () => {
            return true;
        },
        revealSystem: (_gameState, ship, target, targetSystem, parameters) => {
            ship.scienceState.subscribeToSystem(target, targetSystem);

            // Apply effect to all target systems except targetSystem.
            if (targetSystem !== 'hull') {
                target.hullState.adjustEffectLevel('antiprotonResidue', parameters.effectLevel);
            }
            if (targetSystem !== 'reactor') {
                target.reactorState.adjustEffectLevel('antiprotonResidue', parameters.effectLevel);
            }
            if (targetSystem !== 'helm') {
                target.helmState.adjustEffectLevel('antiprotonResidue', parameters.effectLevel);
            }
            if (targetSystem !== 'tactical') {
                target.tacticalState.adjustEffectLevel('antiprotonResidue', parameters.effectLevel);
            }
            if (targetSystem !== 'science') {
                target.scienceState.adjustEffectLevel('antiprotonResidue', parameters.effectLevel);
            }
            if (targetSystem !== 'engineer') {
                target.engineerState.adjustEffectLevel('antiprotonResidue', parameters.effectLevel);
            }
            return true;
        },
        findVulnerability: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.findVulnerability(target, targetSystem);
            return true;
        },
    },
    invertedChronitonScan: {
        aiEvaluator: scanEvaluator,
        load: () => {
            return true;
        },
        revealSystem: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.subscribeToSystem(target, targetSystem);
            return true;
        },
        findVulnerability: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.findVulnerability(target, targetSystem);

            ship.scienceState.drawFromBottom(ship.scienceState.maxHandSize);

            return true;
        },
    },
});
