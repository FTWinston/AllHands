import { LeveledSystemEffectType, SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import {
    autoDestructDamage, autoDestructRange, bankPowerCharge, bankPowerLoss, dischargePowerPerLevel, emergencyPowerFlux, emergencyPowerGain, fluxLimit, railFeedPowerGain,
    redlinePowerGain, runQuietPowerLoss,
} from 'content/systems/engineer/engineer.shared';
import { defineEngineEffects } from 'engine/content/EngineContent';
import { SystemEffectFunctionality } from 'engine/effects/EngineSystemEffectDefinition';
import { effects as sharedEffects } from './engineerEffects.shared';
import type { Ship } from 'engine/state/Ship';
import type { EngineerSystemTile } from 'engine/state/systems/engineer/EngineerSystemTile';

/**
 * Create a "hub" power transfer effect. The hub is on the card's target system.
 * When removed, it force-removes the paired "spoke" effects from all other systems.
 * @param spokeType The effect type placed on the other systems.
 * @param powerDirection +1 if this effect increases power (gain), -1 if it decreases (loss).
 */
function createTransferHubEffect(spokeType: SystemEffectType, powerDirection: 1 | -1): SystemEffectFunctionality {
    return {
        apply: (system, level) => {
            system.adjustSystemPowerLevel(powerDirection * level);
            return true;
        },
        remove: (system, removal, level) => {
            system.adjustSystemPowerLevel(-powerDirection * level);
            for (const s of system.systemState.getShip().engineerState.systems) {
                if (s !== system) {
                    s.removeEffect(spokeType, removal);
                }
            }
        },
        onLevelChanged: (system, newLevel, oldLevel) => {
            system.adjustSystemPowerLevel(powerDirection * (newLevel - oldLevel));
        },
    };
}

/**
 * Create a "spoke" power transfer effect. Spokes are on the systems affected by a redistribution.
 * When removed, it reduces the paired "hub" effect's level on whichever system has it.
 * @param hubType The effect type placed on the card's target system.
 * @param powerDirection +1 if this effect increases power (gain), -1 if it decreases (loss).
 */
function createTransferSpokeEffect(hubType: LeveledSystemEffectType, powerDirection: 1 | -1): SystemEffectFunctionality {
    return {
        apply: (system, level) => {
            system.adjustSystemPowerLevel(powerDirection * level);
            return true;
        },
        remove: (system, _removal, level) => {
            system.adjustSystemPowerLevel(-powerDirection * level);
            for (const s of system.systemState.getShip().engineerState.systems) {
                if (s.hasEffect(hubType)) {
                    s.adjustEffectLevel(hubType, -level);
                    break;
                }
            }
        },
        onLevelChanged: (system, newLevel, oldLevel) => {
            system.adjustSystemPowerLevel(powerDirection * (newLevel - oldLevel));
        },
    };
}

/**
 * Create a 1:1 paired power transfer effect. Used for Divert Helm/Science/Tactical,
 * where there is exactly one source (loss) and one target (gain).
 * When removed, the paired effect is fully removed from whichever system has it.
 * @param pairedType The paired effect type.
 * @param powerDirection +1 if this effect increases power (gain), -1 if it decreases (loss).
 */
function createOneToOneTransferEffect(pairedType: SystemEffectType, powerDirection: 1 | -1): SystemEffectFunctionality {
    return {
        apply: (system, level) => {
            system.adjustSystemPowerLevel(powerDirection * level);
            return true;
        },
        remove: (system, removal, level) => {
            system.adjustSystemPowerLevel(-powerDirection * level);
            for (const s of system.systemState.getShip().engineerState.systems) {
                s.removeEffect(pairedType, removal);
            }
        },
        onLevelChanged: (system, newLevel, oldLevel) => {
            system.adjustSystemPowerLevel(powerDirection * (newLevel - oldLevel));
        },
    };
}

/** The id of the handler that the Buffer effect adds to its system's damage. */
const bufferHandlerId = 'buffer';

/** A system that has reached the Flux limit overloads: one of its cards, picked at random, is damaged. */
function fluxOverload(system: EngineerSystemTile) {
    system.adjustSystemHealth(-1);
}

/** An auto-destructing ship explodes: every other ship close enough takes a heavy hit on its hull, and then the ship is destroyed. */
function explode(ship: Ship) {
    for (const other of ship.shipsWithin(autoDestructRange)) {
        other.damage({ amount: autoDestructDamage, traits: [], targetSystem: 'hull', sourceId: ship.id });
    }

    ship.destroy();
}

/** Take every Abort Auto-destruct card out of the engineer's hand, once there's no countdown left for it to stop. */
function removeAbortCards(ship: Ship) {
    for (const card of ship.engineerState.hand.filter(card => card.type === 'abortAutoDestruct')) {
        ship.engineerState.removeCard(card.id);
    }
}

export const effects = defineEngineEffects(sharedEffects, {
    auxPower: {
        apply: (system, _level) => {
            // Remove this effect from every other ship system.
            system.systemState.getShip().engineerState.systems.forEach((s) => {
                if (s.system !== system.system) {
                    s.removeEffect('auxPower', 'early');
                }
            });

            system.adjustSystemPowerLevel(1);
            return true;
        },
        remove: (system, _removal, _level) => {
            system.adjustSystemPowerLevel(-1);
        },
    },
    shieldFocus: {
        apply: (system) => {
            if (system.system === 'hull') {
                return false;
            }

            system.removeEffect('shieldReduced', 'expired');
            system.shieldPassThroughModifier -= 50;
            return true;
        },
        remove: (system, removal) => {
            system.shieldPassThroughModifier += 50;
            if (removal === 'early') {
                for (const s of system.systemState.getShip().engineerState.systems) {
                    s.removeEffect('shieldReduced', 'expired');
                }
            }
        },
    },
    // Nothing to do here: `Ship.damage` looks for this on any friendly ship nearby when one is hit.
    shieldsExtended: {
        apply: system => system.system === 'hull',
        remove: () => {},
    },
    // Nothing to do here: an encounter that cares whether a ship is being powered looks for this on its hull.
    powerReceived: {
        apply: system => system.system === 'hull',
        remove: () => {},
    },
    runningQuiet: {
        apply: (system) => {
            system.adjustSystemPowerLevel(-runQuietPowerLoss);
            return true;
        },
        remove: (system) => {
            system.adjustSystemPowerLevel(runQuietPowerLoss);
        },
        tick: (system) => {
            // Charge has a max level, so this adds nothing to a system that's full.
            system.adjustEffectLevel('charge', 1);
        },
    },
    shieldReduced: {
        apply: (system) => {
            if (system.system === 'hull') {
                return false;
            }

            system.removeEffect('shieldFocus', 'expired');
            system.shieldPassThroughModifier += 10;
            return true;
        },
        remove: (system, removal) => {
            system.shieldPassThroughModifier -= 10;
            if (removal === 'early') {
                for (const s of system.systemState.getShip().engineerState.systems) {
                    s.removeEffect('shieldFocus', 'expired');
                }
            }
        },
    },
    resetting: {
        apply: (system) => {
            system.adjustSystemPowerLevel(-100);
            return true;
        },
        remove: (system, removal) => {
            system.adjustSystemPowerLevel(100);

            // When everything is being cleared away, the other effects are going anyway, without moving anywhere as they would if the reset removed them.
            if (removal !== 'cleared') {
                system.removeAllEffects();
            }
        },
    },
    relocating: {
        apply: () => {
            return true;
        },
        remove: () => {
        },
    },
    overcharge: {
        apply: (system) => {
            system.adjustSystemPowerLevel(3);
            return true;
        },
        remove: (system) => {
            system.adjustSystemPowerLevel(-3);
        },
        tick: (system) => {
            system.adjustSystemHealth(-1);
        },
    },
    // Distribute Power: target loses power (hub), neighbors gain power (spokes).
    distributePowerLoss: createTransferHubEffect('distributePowerGain', -1),
    distributePowerGain: createTransferSpokeEffect('distributePowerLoss', 1),
    // Draw Power: target gains power (hub), neighbors lose power (spokes).
    drawPowerGain: createTransferHubEffect('drawPowerLoss', 1),
    drawPowerLoss: createTransferSpokeEffect('drawPowerGain', -1),
    // Divert All Power: target gains power (hub), all others lose power (spokes).
    divertAllPowerGain: createTransferHubEffect('divertAllPowerLoss', 1),
    divertAllPowerLoss: createTransferSpokeEffect('divertAllPowerGain', -1),
    // Divert Helm/Science/Tactical: 1:1 pairs between source and target.
    divertHelmGain: createOneToOneTransferEffect('divertHelmLoss', 1),
    divertHelmLoss: createOneToOneTransferEffect('divertHelmGain', -1),
    divertScienceGain: createOneToOneTransferEffect('divertScienceLoss', 1),
    divertScienceLoss: createOneToOneTransferEffect('divertScienceGain', -1),
    divertTacticalGain: createOneToOneTransferEffect('divertTacticalLoss', 1),
    divertTacticalLoss: createOneToOneTransferEffect('divertTacticalGain', -1),
    // Nothing to do here: the cards that spend Charge look for it on their target system.
    charge: {
        apply: () => true,
        remove: () => {},
    },
    flux: {
        apply: (system, level) => {
            // Flux that starts at the limit is never added: the system overloads straight away.
            if (level >= fluxLimit) {
                fluxOverload(system);
                return false;
            }
            return true;
        },
        remove: () => {},
        onLevelChanged: (system, newLevel) => {
            if (newLevel >= fluxLimit) {
                system.removeEffect('flux', 'expired');
                fluxOverload(system);
            }
        },
    },
    bankingPower: {
        apply: (system) => {
            system.adjustSystemPowerLevel(-bankPowerLoss);
            return true;
        },
        remove: (system, removal) => {
            system.adjustSystemPowerLevel(bankPowerLoss);

            // Only banking that runs its full time pays out.
            if (removal === 'expired') {
                system.adjustEffectLevel('charge', bankPowerCharge);
            }
        },
    },
    discharging: {
        apply: (system, level) => {
            system.adjustSystemPowerLevel(level * dischargePowerPerLevel);
            return true;
        },
        remove: (system, _removal, level) => {
            system.adjustSystemPowerLevel(-level * dischargePowerPerLevel);
        },
        onLevelChanged: (system, newLevel, oldLevel) => {
            system.adjustSystemPowerLevel((newLevel - oldLevel) * dischargePowerPerLevel);
        },
    },
    redlining: {
        apply: (system) => {
            system.adjustSystemPowerLevel(redlinePowerGain);
            return true;
        },
        remove: (system) => {
            system.adjustSystemPowerLevel(-redlinePowerGain);
        },
        tick: (system) => {
            system.adjustEffectLevel('flux', 1);
        },
    },
    // Takes all the hull's power, as a reset does, as unpowered shields absorb nothing.
    shieldsVented: {
        apply: (system) => {
            if (system.system !== 'hull') {
                return false;
            }

            system.adjustSystemPowerLevel(-100);
            return true;
        },
        remove: (system) => {
            system.adjustSystemPowerLevel(100);
        },
    },
    railFeed: {
        apply: (system) => {
            system.adjustSystemPowerLevel(railFeedPowerGain);
            return true;
        },
        remove: (system) => {
            system.adjustSystemPowerLevel(-railFeedPowerGain);
        },
    },
    buffered: {
        apply: (system) => {
            // Watches the damage done to this system by each hit. One that would damage a card, while there's Charge to spend, does nothing.
            system.systemState.applyDamage.addHandler(bufferHandlerId, false, (amount) => {
                if (Math.round(amount) <= 0 || system.getEffectLevel('charge') <= 0) {
                    return amount;
                }

                system.adjustEffectLevel('charge', -1);
                system.removeEffect('buffered', 'expired');
                return 0;
            });
            return true;
        },
        remove: (system) => {
            system.systemState.applyDamage.removeHandler(bufferHandlerId);
        },
    },
    autoDestructing: {
        apply: system => system.system === 'engineer',
        remove: (system, removal) => {
            const ship = system.systemState.getShip();
            removeAbortCards(ship);

            // Only a countdown that runs its full time sets the ship off.
            if (removal === 'expired') {
                explode(ship);
            }
        },
    },
    // Nothing to do here: the Graft card looks for this, to find how many cards it can repair.
    cannibalised: {
        apply: () => true,
        remove: () => {},
    },
    emergencyPower: {
        apply: (system) => {
            system.adjustSystemPowerLevel(emergencyPowerGain);
            return true;
        },
        remove: (system, removal) => {
            system.adjustSystemPowerLevel(-emergencyPowerGain);

            // Only power that runs its full time leaves Flux behind.
            if (removal === 'expired') {
                system.adjustEffectLevel('flux', emergencyPowerFlux);
            }
        },
    },
});
