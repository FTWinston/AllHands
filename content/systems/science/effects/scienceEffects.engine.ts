import { MAX_POWER_LEVEL } from 'common-data/features/ships/utils/powerLevel';
import { defineEngineEffects } from 'engine/content/EngineContent';
import { effects as sharedEffects, particleEffects, type ParticleEffect } from './scienceEffects.shared';
import type { SystemEffectFunctionality } from 'engine/effects/EngineSystemEffectDefinition';
import type { EngineerSystemTile } from 'engine/state/systems/engineer/EngineerSystemTile';

export const effects = defineEngineEffects(sharedEffects, {
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
    insight: {
        // Insight does nothing by itself: science's cards spend it (see `ScienceState.spendInsight`).
        // The science system keeps its own count of Insight, for its client to see, so it's told of every change to the level.
        apply: (system, level) => {
            if (system.system !== 'science') {
                return false;
            }

            system.systemState.getShip().scienceState.insightLevelChanged(level);
            return true;
        },
        remove: system => system.systemState.getShip().scienceState.insightLevelChanged(0),
        onLevelChanged: (system, newLevel) => system.systemState.getShip().scienceState.insightLevelChanged(newLevel),
    },
    predictiveModel: {
        // Every shot the ship fires is less accurate by level percentage points (see `TacticalState.determineAccuracy`).
        apply: (system, level) => {
            system.systemState.getShip().helmState.weaponAccuracyModifier -= level;
            return true;
        },
        remove: (system, _removal, level) => {
            system.systemState.getShip().helmState.weaponAccuracyModifier += level;
        },
        onLevelChanged: (system, newLevel, oldLevel) => {
            system.systemState.getShip().helmState.weaponAccuracyModifier -= newLevel - oldLevel;
        },
    },
    jammed: {
        // Nothing to do here: scans of the ship fail while it's there (see `ScienceState.isJamming`).
        apply: system => system.system === 'science',
        remove: () => {},
    },
    gravitonDrag: createManeuverSpeedEffect(-1),
    chronitonEcho: {
        // Nothing happens until it runs its time. Cut short, such as by Catalyse, it does nothing at all.
        apply: () => true,
        remove: (system, removal) => {
            if (removal === 'expired') {
                restartParticleEffects(system);
            }
        },
    },
    halfLife: {
        apply: (system) => {
            particlesHeldSince.set(system, system.systemState.getGameState().currentTime);
            return true;
        },
        remove: (system) => {
            holdParticleEffects(system);
            particlesHeldSince.delete(system);
        },
        tick: holdParticleEffects,
    },
    crossReaction: {
        // A system's power is kept track of below zero, so taking the most it could have leaves it with none, and gives back what it had.
        apply: (system) => {
            system.adjustSystemPowerLevel(-MAX_POWER_LEVEL);
            return true;
        },
        remove: (system) => {
            system.adjustSystemPowerLevel(MAX_POWER_LEVEL);
        },
    },
    antiprotonShielding: {
        apply: (system, level) => {
            // Reduce damage taken from all sources by level percent.
            system.systemState.applyDamage.addHandler('antiprotonShielding', false, damage => damage * (1 - level / 100));
            return true;
        },
        remove: (system) => {
            system.systemState.applyDamage.removeHandler('antiprotonShielding');
        },
        onLevelChanged: (system, newLevel) => {
            // addHandler replaces the old handler, so we can just call it again with the new level.
            system.systemState.applyDamage.addHandler('antiprotonShielding', false, damage => damage * (1 - newLevel / 100));
        },
    },
    tetryonScattering: {
        apply: (system, level) => {
            system.systemState.chanceToHitPercentageModifier -= level;
            return true;
        },
        remove: (system, _removal, level) => {
            system.systemState.chanceToHitPercentageModifier += level;
        },
        onLevelChanged: (system, newLevel, oldLevel) => {
            system.systemState.chanceToHitPercentageModifier -= newLevel - oldLevel;
        },
    },
    chronitonAcceleration: {
        apply: (system) => {
            // Every second scheduled draw that goes ahead while this effect is active also draws an extra card, starting with the first.
            let drawExtra = true;
            system.systemState.scheduledDraw.addListener('chronitonAcceleration', () => {
                if (drawExtra) {
                    system.systemState.drawFromTop();
                }
                drawExtra = !drawExtra;
            });
            return true;
        },
        remove: (system) => {
            system.systemState.scheduledDraw.removeListener('chronitonAcceleration');
        },
    },
    polaronCharge: {
        apply: (system, level) => {
            system.adjustSystemPowerLevel(level);
            return true;
        },
        remove: (system, _removal, level) => {
            system.adjustSystemPowerLevel(-level);
        },
        onLevelChanged: (system, newLevel, oldLevel) => {
            system.adjustSystemPowerLevel(newLevel - oldLevel);
        },
    },
    gravitonLift: createManeuverSpeedEffect(1),
});

/** An effect that makes every maneuver the ship starts faster (direction 1) or slower (direction -1) by level percent (see `applyMotionCard`). */
function createManeuverSpeedEffect(direction: 1 | -1): SystemEffectFunctionality {
    return {
        apply: (system, level) => {
            system.systemState.getShip().helmState.maneuverSpeedModifier += level * direction;
            return true;
        },
        remove: (system, _removal, level) => {
            system.systemState.getShip().helmState.maneuverSpeedModifier -= level * direction;
        },
        onLevelChanged: (system, newLevel, oldLevel) => {
            system.systemState.getShip().helmState.maneuverSpeedModifier += (newLevel - oldLevel) * direction;
        },
    };
}

/** When each system under a Half-life last had its particle effects' time put back. */
const particlesHeldSince = new WeakMap<EngineerSystemTile, number>();

/** Put back the time that has run down on a system's particle effects since this was last done, so that they last as long as they did then. */
function holdParticleEffects(system: EngineerSystemTile) {
    const currentTime = system.systemState.getGameState().currentTime;
    const elapsed = currentTime - (particlesHeldSince.get(system) ?? currentTime);
    particlesHeldSince.set(system, currentTime);

    for (const effect of system.effects) {
        if (effect.progress && isParticleEffect(effect.type)) {
            effect.progress.startTime += elapsed;
            effect.progress.endTime += elapsed;
        }
    }
}

/** Start the time over on every particle effect on a system, so each has as long left as it had when it began. */
function restartParticleEffects(system: EngineerSystemTile) {
    const currentTime = system.systemState.getGameState().currentTime;

    for (const effect of system.effects) {
        if (effect.progress && isParticleEffect(effect.type)) {
            const duration = effect.progress.endTime - effect.progress.startTime;
            effect.progress.startTime = currentTime;
            effect.progress.endTime = currentTime + duration;
        }
    }

    system.scienceScanDataChanged.invoke();
}

function isParticleEffect(effectType: string): effectType is ParticleEffect {
    return (particleEffects as readonly string[]).includes(effectType);
}
