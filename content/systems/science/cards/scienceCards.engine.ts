import { isCrewSystem } from 'common-data/features/ships/types/ShipSystem';
import { isLeveledSystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { particleEffects } from 'content/systems/science/effects/scienceEffects.shared';
import { scanEvaluator } from 'engine/ai/evaluators/science';
import { defineEngineCards } from 'engine/content/EngineContent';
import { cards as sharedCards } from './scienceCards.shared';
import type { Ship } from 'engine/state/Ship';
import type { SystemEffect } from 'engine/state/systems/engineer/SystemEffect';
import type { SystemState } from 'engine/state/systems/SystemState';

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
        synergy: { provides: ['particles'] },
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
        synergy: { provides: ['particles'] },
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
        synergy: { provides: ['particles'] },
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
        synergy: { provides: ['insight'] },
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
        synergy: { provides: ['particles'] },
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
        synergy: { provides: ['particles'] },
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
    deepScan: {
        synergy: { provides: ['insight'] },
        aiEvaluator: scanEvaluator,
        load: () => {
            return true;
        },
        revealSystem: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.subscribeToSystem(target, targetSystem);

            // Also read the hand of the system, if it's one that has a hand to read.
            if (isCrewSystem(targetSystem)) {
                ship.scienceState.readHand(target, targetSystem);
            }
            return true;
        },
        findVulnerability: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.findVulnerability(target, targetSystem);
            return true;
        },
    },
    gravitonScan: {
        synergy: { provides: ['particles'] },
        aiEvaluator: scanEvaluator,
        load: () => {
            return true;
        },
        revealSystem: (_gameState, ship, target, targetSystem, parameters) => {
            ship.scienceState.subscribeToSystem(target, targetSystem);

            // Whichever system is revealed, it's the target's helm that is slowed. Scanning again starts the time over.
            const helm = target.helmState;
            helm.removeEffect('gravitonDrag', 'early');
            helm.adjustEffectLevel('gravitonDrag', parameters.effectLevel);
            return true;
        },
        findVulnerability: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.findVulnerability(target, targetSystem);
            return true;
        },
    },
    eureka: {
        synergy: { wants: ['insight'] },
        play: (_gameState, ship, parameters) => {
            const science = ship.scienceState;
            const scanned = science.getScannedSystemTarget();

            if (!scanned || !science.spendInsight(parameters.insightCost ?? sharedCards.eureka.parameters.insightCost)) {
                return false;
            }

            // The Insight spent pays for this vulnerability, so finding it gains none.
            science.findVulnerability(scanned.ship, scanned.system, false);
            return true;
        },
    },
    predictiveModel: {
        synergy: { wants: ['insight'] },
        play: (_gameState, ship, parameters) => {
            const science = ship.scienceState;
            const scannedShip = science.scannedShip;

            if (!scannedShip || !science.spendInsight(parameters.insightCost ?? sharedCards.predictiveModel.parameters.insightCost)) {
                return false;
            }

            // The effect sits on the scanned ship's helm, as that's where a ship's weapon accuracy is adjusted. Playing another starts the time over.
            const helm = scannedShip.helmState;
            helm.removeEffect('predictiveModel', 'early');
            helm.adjustEffectLevel('predictiveModel', parameters.accuracyReduction ?? sharedCards.predictiveModel.parameters.accuracyReduction);
            return true;
        },
    },
    catalyse: {
        synergy: { wants: ['particles'] },
        play: (_gameState, ship, parameters) => {
            const system = getScannedSystem(ship);
            const particles = system ? getParticleEffects(system) : [];

            if (!system || particles.length === 0) {
                return false;
            }

            // The damage lands before the particles go, so Antiproton Residue still adds to it.
            const damagePerEffect = parameters.damagePerEffect ?? sharedCards.catalyse.parameters.damagePerEffect;
            system.applyDamage.invoke(particles.length * damagePerEffect);

            for (const particle of particles) {
                system.removeEffect(particle.type, 'early');
            }
            return true;
        },
    },
    halfLife: {
        synergy: { wants: ['particles'] },
        play: (_gameState, ship) => {
            const system = getScannedSystem(ship);
            if (!system) {
                return false;
            }

            // Playing another while one lasts starts its time over, as adding an effect that's already there does.
            system.addEffect('halfLife');
            return true;
        },
    },
    crossReaction: {
        synergy: { wants: ['particles'] },
        play: (_gameState, ship, parameters) => {
            const system = getScannedSystem(ship);
            const effectsNeeded = parameters.effectsNeeded ?? sharedCards.crossReaction.parameters.effectsNeeded;

            if (!system || getParticleEffects(system).length < effectsNeeded) {
                return false;
            }

            system.addEffect('crossReaction');
            return true;
        },
    },
    saturate: {
        synergy: { wants: ['particles'] },
        play: (_gameState, ship, parameters) => {
            const system = getScannedSystem(ship);
            if (!system) {
                return false;
            }

            // Only effects with levels can be raised. Of those, it's the one with the highest level that is.
            const [particle] = getParticleEffects(system)
                .filter(effect => isLeveledSystemEffectType(effect.type))
                .sort((a, b) => b.level - a.level);

            if (!particle || !isLeveledSystemEffectType(particle.type)) {
                return false;
            }

            const multiplier = parameters.multiplier ?? sharedCards.saturate.parameters.multiplier;
            system.adjustEffectLevel(particle.type, Math.min(particle.level * multiplier, maxEffectLevel) - particle.level);
            return true;
        },
    },
});

/** The most that an effect's level can hold. */
const maxEffectLevel = 255;

/** The system that the ship's science is scanning now, on another ship, or null if it isn't scanning one. */
function getScannedSystem(ship: Ship): SystemState | null {
    const scanned = ship.scienceState.getScannedSystemTarget();
    return scanned ? scanned.ship.getSystem(scanned.system) : null;
}

/** The particle effects that are on a system now. */
function getParticleEffects(system: SystemState): SystemEffect[] {
    return system.getEffects().filter(effect => (particleEffects as readonly string[]).includes(effect.type));
}
