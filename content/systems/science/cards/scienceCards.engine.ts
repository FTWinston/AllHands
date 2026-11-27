import { isCrewSystem } from 'common-data/features/ships/types/ShipSystem';
import { isLeveledSystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { distance } from 'common-data/features/space/utils/vectors';
import { particleEffects } from 'content/systems/science/effects/scienceEffects.shared';
import { scanEvaluator } from 'engine/ai/evaluators/science';
import { applyMotionCard } from 'engine/cards/applyMotionCard';
import { defineEngineCards } from 'engine/content/EngineContent';
import { SensorGhost } from 'engine/state/SensorGhost';
import { Ship } from 'engine/state/Ship';
import { cards as sharedCards } from './scienceCards.shared';
import type { SystemEffect } from 'engine/state/systems/engineer/SystemEffect';
import type { SystemState } from 'engine/state/systems/SystemState';

export const cards = defineEngineCards(sharedCards, {
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
    phasedChronitonScan: {
        synergy: { provides: ['particles'], wants: ['particles'] },
        aiEvaluator: scanEvaluator,
        load: () => {
            return true;
        },
        revealSystem: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.subscribeToSystem(target, targetSystem);

            // Revealing the system again before it echoes starts its time over, as adding an effect that's already there does.
            target.getSystem(targetSystem).addEffect('chronitonEcho');
            return true;
        },
        findVulnerability: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.findVulnerability(target, targetSystem);
            return true;
        },
    },
    crossReference: {
        synergy: { provides: ['insight'] },
        aiEvaluator: scanEvaluator,
        load: () => {
            return true;
        },
        revealSystem: (_gameState, ship, target, targetSystem, parameters) => {
            // Checked first, as revealing the system is what makes it one that has been revealed.
            const revealedBefore = ship.scienceState.hasRevealed(target, targetSystem);
            ship.scienceState.subscribeToSystem(target, targetSystem);

            if (revealedBefore) {
                ship.scienceState.gainInsight(parameters.extraInsight ?? sharedCards.crossReference.parameters.extraInsight);
            }
            return true;
        },
        findVulnerability: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.findVulnerability(target, targetSystem);
            return true;
        },
    },
    activePing: {
        load: () => {
            return true;
        },
        revealSystem: (gameState, ship, target, _targetSystem, parameters) => {
            ship.scienceState.revealAllSystems(target);

            // Loud: every hostile ship within range, whether or not it could sense this one before, knows where it is for a while.
            const range = parameters.range ?? sharedCards.activePing.parameters.range;
            const duration = (parameters.duration ?? sharedCards.activePing.parameters.duration) * 1000;
            const position = ship.getPosition(gameState.currentTime);

            for (const other of gameState.objects.values()) {
                if (other instanceof Ship && other !== ship
                    && gameState.factionRegistry.areHostile(ship, other)
                    && distance(position, other.getPosition(gameState.currentTime)) <= range) {
                    other.revealObject(ship.id, duration);
                }
            }
            return true;
        },
        findVulnerability: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.findVulnerability(target, targetSystem);
            return true;
        },
    },
    passiveListen: {
        aiEvaluator: scanEvaluator,
        load: () => {
            return true;
        },
        revealSystem: (gameState, ship, target, targetSystem, parameters) => {
            // Quiet: nothing is sent out for anyone to notice, but nothing is learned until the listening is done.
            const delay = (parameters.delay ?? sharedCards.passiveListen.parameters.delay) * 1000;
            gameState.setTimeout(() => {
                if (gameState.objects.has(target.id) && ship.knownObjects.has(target.id) && !target.scienceState.isJamming) {
                    ship.scienceState.subscribeToSystem(target, targetSystem);
                }
            }, delay);
            return true;
        },
        findVulnerability: (_gameState, ship, target, targetSystem, _parameters) => {
            ship.scienceState.findVulnerability(target, targetSystem);
            return true;
        },
    },
    jam: {
        play: (_gameState, ship) => {
            // Playing another while one lasts starts its time over, as adding an effect that's already there does.
            ship.scienceState.addEffect('jammed');
            return true;
        },
    },
    sensorGhost: {
        play: (gameState, ship, parameters) => {
            // The ghost is left where the ship is, and flies on the way the ship is going now, which the ship is free to change.
            gameState.add(new SensorGhost(gameState, ship, (parameters.duration ?? sharedCards.sensorGhost.parameters.duration) * 1000));
            return true;
        },
    },
    firingSolution: {
        synergy: { wants: ['insight'] },
        play: (_gameState, ship, parameters) => {
            if (!ship.scienceState.spendInsight(parameters.insightCost ?? sharedCards.firingSolution.parameters.insightCost)) {
                return false;
            }

            // Made room for in a full hand, as the engineer's Confirm Auto-destruct cards are.
            ship.tacticalState.addCard('firingSolutionShot', true);
            return true;
        },
    },
    firingSolutionShot: {
        prime: (_gameState, _ship, slot, parameters) => {
            // It's an instant card, so doesn't take the weapon's modifier slot, and it's taken back as the weapon fires.
            slot.adjustParameterForNextShot('accuracy', parameters.accuracyIncrease ?? sharedCards.firingSolutionShot.parameters.accuracyIncrease);
            return true;
        },
    },
    plottedCourse: {
        synergy: { wants: ['insight'] },
        play: (_gameState, ship, parameters) => {
            if (!ship.scienceState.scannedShip || !ship.scienceState.spendInsight(parameters.insightCost ?? sharedCards.plottedCourse.parameters.insightCost)) {
                return false;
            }

            ship.helmState.addCard('plottedCourseManoeuvre', true);
            return true;
        },
    },
    plottedCourseManoeuvre: {
        play: applyMotionCard,
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
