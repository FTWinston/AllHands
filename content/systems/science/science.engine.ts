import { scanEvaluator } from 'engine/ai/evaluators/science';
import { defineEngineContent } from 'engine/content/EngineContent';
import { scienceShared } from './science.shared';

export const scienceEngine = defineEngineContent({
    shared: scienceShared,
    cards: {
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
    },
    effects: {
        antiprotonResidue: {
            apply: (system, level) => {
                // Increase damage taken from all sources by level percent.
                system.systemState.applyDamage.addHandler('antiprotonResidue', false, damage => damage * (1 + level / 100));
                return true;
            },
            remove: (system) => {
                system.systemState.applyDamage.removeHandler('antiprotonResidue');
            },
            onLevelChanged: (system, newLevel) => {
                // addHandler replaces the old handler, so we can just call it again with the new level.
                system.systemState.applyDamage.addHandler('antiprotonResidue', false, damage => damage * (1 + newLevel / 100));
            },
        },
        chronitonSaturation: {
            apply: (system) => {
                // Block every second scheduled draw while this effect is active, starting with the first.
                let blockNext = true;
                system.systemState.scheduledDraw.addInterceptor('chronitonSaturation', () => {
                    const block = blockNext;
                    blockNext = !blockNext;
                    return block;
                });
                return true;
            },
            remove: (system) => {
                system.systemState.scheduledDraw.removeInterceptor('chronitonSaturation');
            },
        },
        polaronBombardment: {
            apply: (system, level) => {
                system.adjustSystemPowerLevel(-level);
                return true;
            },
            remove: (system, _removal, level) => {
                system.adjustSystemPowerLevel(level);
            },
            onLevelChanged: (system, newLevel, oldLevel) => {
                system.adjustSystemPowerLevel(oldLevel - newLevel);
            },
        },
        polaronAccumulation: {
            apply: (system) => {
                system.adjustSystemPowerLevel(1);
                return true;
            },
            remove: (system) => {
                system.adjustSystemPowerLevel(-1);
            },
        },
        tetryonSaturation: {
            apply: (system, level) => {
                system.systemState.chanceToHitPercentageModifier += level;
                return true;
            },
            remove: (system, _removal, level) => {
                system.systemState.chanceToHitPercentageModifier -= level;
            },
            onLevelChanged: (system, newLevel, oldLevel) => {
                system.systemState.chanceToHitPercentageModifier += newLevel - oldLevel;
            },
        },
        reducedCardCost: {
            apply: (system) => {
                system.systemState.adjustCostOfEveryCard(-1);
                return true;
            },
            remove: (system) => {
                system.systemState.adjustCostOfEveryCard(1);
            },
        },
    },
});
