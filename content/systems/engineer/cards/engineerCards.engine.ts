import { SystemEffectCategory } from 'common-data/features/ships/types/SystemEffectDefinition';
import { LeveledSystemEffectType, SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { distributePowerEvaluator, powerBoostEvaluator } from 'engine/ai/evaluators/engineer';
import { getReactorCardTypeForSystem } from 'engine/cards/getReactorCardTypeForSystem';
import { defineEngineCards } from 'engine/content/EngineContent';
import { getSystemEffectDefinition } from 'engine/effects/getEngineSystemEffectDefinition';
import { CardState } from 'engine/state/CardState';
import { CooldownState } from 'engine/state/CooldownState';
import { EngineerSystemTile } from 'engine/state/systems/engineer/EngineerSystemTile';
import { chargeMaxLevel, transferPowerRange, cards as sharedCards } from './engineerCards.shared';

/**
 * Apply a set of saved effects onto a system, consolidating leveled effects where they already exist.
 * Used by the Shunt card to transfer effects between systems while preserving cooldowns.
 */
function applySwappedEffects(
    system: EngineerSystemTile,
    effects: Array<{ type: SystemEffectType; level: number; progress: CooldownState | null }>
) {
    for (const saved of effects) {
        if (system.hasEffect(saved.type)) {
            // Consolidate: increase level of existing effect.
            const def = getSystemEffectDefinition(saved.type);
            if (def.usesLevels) {
                system.adjustEffectLevel(saved.type as LeveledSystemEffectType, saved.level);
            }
            // Keep the longer-lasting cooldown.
            const existing = system.effects.find(e => e.type === saved.type);
            if (existing && saved.progress) {
                if (!existing.progress || saved.progress.endTime > existing.progress.endTime) {
                    existing.progress = saved.progress;
                }
            }
        } else {
            system.addEffect(saved.type, saved.level);
            // Override cooldown with preserved one.
            const added = system.effects.find(e => e.type === saved.type);
            if (added && saved.progress) {
                added.progress = saved.progress;
            }
        }
    }
}

/** Take all the Charge from a system, and return how much there was. */
function spendAllCharge(system: EngineerSystemTile): number {
    const level = system.getEffectLevel('charge');
    system.removeEffect('charge', 'expired');
    return level;
}

/** Have a system draw that many cards from its deck, as it does when the reactor powers it. */
function drawCards(system: EngineerSystemTile, count: number) {
    for (let i = 0; i < count; i++) {
        system.systemState.scheduledDraw.invoke();
    }
}

export const cards = defineEngineCards(sharedCards, {
    smokeScreen: {
        play: (_ship) => {
            console.log('played smokeScreen'); return true;
        },
    },
    auxPower: {
        aiEvaluator: powerBoostEvaluator('auxPower', 30, 'auxPower'),
        play: (_gameState, _ship, system) => {
            return system.addEffect('auxPower');
        },
    },
    swapHorizontal: {
        play: (_gameState, ship, system) => {
            const systemIndex = ship.engineerState.systems.indexOf(system);
            const otherSystemIndex = systemIndex % 2 == 0 ? systemIndex + 1 : systemIndex - 1;
            const otherSystem = ship.engineerState.systems[otherSystemIndex];
            ship.engineerState.systems[systemIndex] = otherSystem;
            ship.engineerState.systems[otherSystemIndex] = system;
            return true;
        },
    },
    swapUp: {
        play: (_gameState, ship, system) => {
            const systemIndex = ship.engineerState.systems.indexOf(system);
            if (systemIndex < 2) {
                return false;
            }

            const otherSystemIndex = systemIndex - 2;
            const otherSystem = ship.engineerState.systems[otherSystemIndex];
            ship.engineerState.systems[systemIndex] = otherSystem;
            ship.engineerState.systems[otherSystemIndex] = system;
            return true;
        },
    },
    swapDown: {
        play: (_gameState, ship, system) => {
            const systemIndex = ship.engineerState.systems.indexOf(system);
            if (systemIndex >= 4) {
                return false;
            }

            const otherSystemIndex = systemIndex + 2;
            const otherSystem = ship.engineerState.systems[otherSystemIndex];
            ship.engineerState.systems[systemIndex] = otherSystem;
            ship.engineerState.systems[otherSystemIndex] = system;
            return true;
        },
    },
    purge: {
        synergy: { wants: ['flux'] },
        play: (_gameState, _ship, system) => {
            const negativeEffect = system.effects.find(
                e => getSystemEffectDefinition(e.type).category === SystemEffectCategory.Negative
            );

            if (!negativeEffect) {
                return false;
            }

            system.removeEffect(negativeEffect.type, 'early');
            return true;
        },
    },
    reset: {
        synergy: { wants: ['flux'] },
        play: (_gameState, _ship, system) => {
            system.addEffect('resetting');
            return true;
        },
    },
    extendShields: {
        play: (_gameState, ship) => {
            const hull = ship.engineerState.systems.find(tile => tile.system === 'hull');
            if (!hull) {
                return false;
            }

            // Playing it again while it's running starts its time over, as adding an effect that's already there does.
            hull.addEffect('shieldsExtended');
            return true;
        },
    },
    transferPower: {
        play: (_gameState, ship) => {
            const hull = ship.nearestFriendlyShip(transferPowerRange)?.engineerState.systems.find(tile => tile.system === 'hull');
            if (!hull) {
                return false;
            }

            // Playing it again while it's running starts its time over, as adding an effect that's already there does.
            hull.addEffect('powerReceived');
            return true;
        },
    },
    runQuiet: {
        synergy: { provides: ['charge'] },
        play: (_gameState, _ship, system) => {
            // The same card brings it back.
            return system.hasEffect('runningQuiet')
                ? system.removeEffect('runningQuiet', 'early')
                : system.addEffect('runningQuiet');
        },
    },
    focusShields: {
        play: (_gameState, ship, system) => {
            if (system.system === 'hull') {
                return false;
            }

            system.addEffect('shieldFocus');

            for (const otherSystem of ship.engineerState.systems) {
                if (otherSystem !== system && otherSystem.system !== 'hull') {
                    otherSystem.addEffect('shieldReduced');
                }
            }
            return true;
        },
    },
    relocateSystem: {
        play: (_gameState, ship, system) => {
            const alreadyRelocating = ship.engineerState.systems.some(s => s.effects.some(e => e.type === 'relocating'));
            if (alreadyRelocating) {
                return false;
            }

            system.addEffect('relocating');
            ship.engineerState.addCard('relocateHere');
            return true;
        },
    },
    relocateHere: {
        play: (_gameState, ship, system) => {
            if (system.effects.some(e => e.type === 'relocating')) {
                return false;
            }

            const relocatingSystem = ship.engineerState.systems.find(s => s.effects.some(e => e.type === 'relocating'));
            if (!relocatingSystem) {
                return false;
            }

            const systemIndex = ship.engineerState.systems.indexOf(system);
            const relocatingIndex = ship.engineerState.systems.indexOf(relocatingSystem);
            ship.engineerState.systems[systemIndex] = relocatingSystem;
            ship.engineerState.systems[relocatingIndex] = system;
            relocatingSystem.removeEffect('relocating', 'early');
            return true;
        },
    },
    sustain: {
        play: (gameState, _ship, system) => {
            const currentTime = gameState.currentTime;
            let restarted = false;
            for (const effect of system.effects) {
                if (effect.progress) {
                    const def = getSystemEffectDefinition(effect.type);
                    const duration = def.duration ?? (effect.progress.endTime - effect.progress.startTime);
                    effect.progress = new CooldownState(currentTime, currentTime + duration);
                    if (def.tickInterval) {
                        effect.lastTickTime = currentTime;
                    }
                    restarted = true;
                }
            }
            return restarted;
        },
    },
    distributePower: {
        aiEvaluator: distributePowerEvaluator('distributePower'),
        play: (_gameState, ship, system, parameters) => {
            const systemIndex = ship.engineerState.systems.indexOf(system);
            const adjacent = ship.engineerState.getAdjacentSystems(systemIndex);
            const powerChange = parameters['powerChange'] ?? 1;
            system.addEffect('distributePowerLoss', powerChange * adjacent.length);

            // Increase each adjacent system's power by powerChange.
            for (const adj of adjacent) {
                adj.addEffect('distributePowerGain', powerChange);
            }
            return true;
        },
    },
    drawPower: {
        aiEvaluator: powerBoostEvaluator('drawPower', 25),
        play: (_gameState, ship, system, parameters) => {
            const systemIndex = ship.engineerState.systems.indexOf(system);
            const adjacent = ship.engineerState.getAdjacentSystems(systemIndex);
            const powerChange = parameters['powerChange'] ?? 1;
            system.addEffect('drawPowerGain', powerChange * adjacent.length);

            // Decrease each adjacent system's power by powerChange.
            for (const adj of adjacent) {
                adj.addEffect('drawPowerLoss', powerChange);
            }
            return true;
        },
    },
    divertAllPower: {
        play: (_gameState, ship, system, parameters) => {
            const lossPerSystem = parameters['lossPerSystem'] ?? 1;
            const targetGain = parameters['targetGain'] ?? 5;

            // All other systems lose power.
            for (const otherSystem of ship.engineerState.systems) {
                if (otherSystem !== system) {
                    otherSystem.addEffect('divertAllPowerLoss', lossPerSystem);
                }
            }

            // Target system gains power.
            system.addEffect('divertAllPowerGain', targetGain);
            return true;
        },
    },
    divertHelm: {
        play: (_gameState, ship, system, parameters) => {
            if (system.system === 'helm') {
                return false;
            }
            const helmTile = ship.engineerState.systems.find(s => s.system === 'helm')!;
            const maxAmount = parameters['maxAmount'] ?? 3;
            const amount = Math.min(maxAmount, helmTile.power);
            if (amount <= 0) {
                return false;
            }
            helmTile.addEffect('divertHelmLoss', amount);
            system.addEffect('divertHelmGain', amount);
            return true;
        },
    },
    divertScience: {
        play: (_gameState, ship, system, parameters) => {
            if (system.system === 'science') {
                return false;
            }
            const scienceTile = ship.engineerState.systems.find(s => s.system === 'science')!;
            const maxAmount = parameters['maxAmount'] ?? 3;
            const amount = Math.min(maxAmount, scienceTile.power);
            if (amount <= 0) {
                return false;
            }
            scienceTile.addEffect('divertScienceLoss', amount);
            system.addEffect('divertScienceGain', amount);
            return true;
        },
    },
    divertTactical: {
        play: (_gameState, ship, system, parameters) => {
            if (system.system === 'tactical') {
                return false;
            }
            const tacticalTile = ship.engineerState.systems.find(s => s.system === 'tactical')!;
            const maxAmount = parameters['maxAmount'] ?? 3;
            const amount = Math.min(maxAmount, tacticalTile.power);
            if (amount <= 0) {
                return false;
            }
            tacticalTile.addEffect('divertTacticalLoss', amount);
            system.addEffect('divertTacticalGain', amount);
            return true;
        },
    },
    overcharge: {
        aiEvaluator: powerBoostEvaluator('overcharge', 35, 'overcharge'),
        play: (_gameState, _ship, system) => {
            return system.addEffect('overcharge');
        },
    },
    shunt: {
        play: (_gameState, ship, system) => {
            const systemIndex = ship.engineerState.systems.indexOf(system);
            const neighborIndex = systemIndex ^ 1;
            const neighbor = ship.engineerState.systems[neighborIndex];

            // Banking power, emergency power and an auto-destruct countdown do something when they're removed, vented shields are only ever the hull's,
            // and a cannibalised system is where its parts came from, so none of them can move.
            const UNTRANSFERABLE: ReadonlySet<SystemEffectType> = new Set([
                'resetting', 'reactorBreach', 'relocating', 'bankingPower', 'shieldsVented', 'autoDestructing', 'cannibalised', 'emergencyPower',
            ]);

            // Save transferable effects from both systems.
            type SavedEffect = { type: SystemEffectType; level: number; progress: CooldownState | null };
            const systemEffects: SavedEffect[] = [];
            const neighborEffects: SavedEffect[] = [];

            for (const e of system.effects) {
                if (!UNTRANSFERABLE.has(e.type)) {
                    systemEffects.push({ type: e.type, level: e.level, progress: e.progress });
                }
            }
            for (const e of neighbor.effects) {
                if (!UNTRANSFERABLE.has(e.type)) {
                    neighborEffects.push({ type: e.type, level: e.level, progress: e.progress });
                }
            }

            // Remove transferable effects from both systems (properly undoes power adjustments etc.)
            for (const e of systemEffects) {
                system.removeEffect(e.type, 'expired');
            }
            for (const e of neighborEffects) {
                neighbor.removeEffect(e.type, 'expired');
            }

            // Add neighbor's old effects to system (and vice versa), consolidating leveled effects.
            applySwappedEffects(system, neighborEffects);
            applySwappedEffects(neighbor, systemEffects);

            return true;
        },
    },
    drawPriority: {
        play: (_gameState, ship, system) => {
            const cardType = getReactorCardTypeForSystem(system.system);

            // Before every non-expendable card in the reactor deck, add an expendable copy of this system's corresponding reactor card.
            for (let index = 0; index < ship.reactorState.deck.length; index++) {
                const destinationCard = ship.reactorState.deck[index];
                if (!destinationCard.hasTrait('expendable')) {
                    const newCard = CardState.createExpendable(cardType, ship.getCardId());
                    ship.reactorState.deck.splice(index, 0, newCard);
                    index++;
                }
            }

            // Recalculate each system's card generation cooldowns after modifying the reactor deck.
            ship.updateCardGeneration();

            return true;
        },
    },
    trickleCharge: {
        synergy: { provides: ['charge'] },
        play: (_gameState, _ship, system, parameters) => {
            // A system that's already full has no room for more.
            if (system.getEffectLevel('charge') >= chargeMaxLevel) {
                return false;
            }

            system.adjustEffectLevel('charge', parameters['charge'] ?? 1);
            return true;
        },
    },
    bankPower: {
        synergy: { provides: ['charge'] },
        play: (_gameState, _ship, system) => {
            // Playing it again while it's running would only start its time over.
            if (system.hasEffect('bankingPower')) {
                return false;
            }

            return system.addEffect('bankingPower');
        },
    },
    discharge: {
        synergy: { wants: ['charge'] },
        play: (_gameState, _ship, system) => {
            const level = spendAllCharge(system);
            if (level <= 0) {
                return false;
            }

            // Adds to a discharge that's already running, and starts its time over.
            system.adjustEffectLevel('discharging', level);
            system.addEffect('discharging');
            return true;
        },
    },
    surgeDraw: {
        synergy: { wants: ['charge'] },
        play: (_gameState, _ship, system, parameters) => {
            const level = spendAllCharge(system);
            if (level <= 0) {
                return false;
            }

            drawCards(system, level * (parameters['cardsPerLevel'] ?? 1));
            return true;
        },
    },
    redline: {
        synergy: { provides: ['flux'] },
        play: (_gameState, _ship, system) => {
            // The same card stops it.
            return system.hasEffect('redlining')
                ? system.removeEffect('redlining', 'early')
                : system.addEffect('redlining');
        },
    },
    vent: {
        synergy: { wants: ['flux'] },
        play: (_gameState, ship) => {
            const hull = ship.engineerState.systems.find(tile => tile.system === 'hull');
            const fluxedSystems = ship.engineerState.systems.filter(tile => tile.hasEffect('flux'));

            // With no Flux anywhere, there's nothing to vent.
            if (!hull || fluxedSystems.length === 0) {
                return false;
            }

            for (const system of fluxedSystems) {
                system.removeEffect('flux', 'early');
            }

            hull.addEffect('shieldsVented');
            return true;
        },
    },
    railFeed: {
        play: (_gameState, ship, system) => {
            // The grid is 2 wide and 3 tall, numbered along each row in turn, so a column is every system whose index has the same parity as this one's.
            const column = ship.engineerState.systems.indexOf(system) % 2;

            ship.engineerState.systems
                .filter((_tile, index) => index % 2 === column)
                .forEach(tile => tile.addEffect('railFeed'));
            return true;
        },
    },
    priorityFeed: {
        play: (_gameState, _ship, system, parameters) => {
            drawCards(system, parameters['cards'] ?? 1);
            return true;
        },
    },
    buffer: {
        synergy: { wants: ['charge'] },
        play: (_gameState, _ship, system) => {
            if (system.hasEffect('buffered')) {
                return false;
            }

            return system.addEffect('buffered');
        },
    },
    hotStart: {
        synergy: { provides: ['flux'] },
        play: (_gameState, _ship, system, parameters) => {
            drawCards(system, parameters['cards'] ?? 2);
            system.adjustEffectLevel('flux', parameters['flux'] ?? 1);
            return true;
        },
    },
    extremeMeasures: {
        synergy: { provides: ['flux'] },
    },
    autoDestruct: {
        play: (_gameState, ship) => {
            const engineer = ship.engineerState.systems.find(tile => tile.system === 'engineer');
            if (!engineer || engineer.hasEffect('autoDestructing')) {
                return false;
            }

            engineer.addEffect('autoDestructing');

            // Room is made for it, so the countdown can always be stopped.
            ship.engineerState.addCard('abortAutoDestruct', true);
            return true;
        },
    },
    abortAutoDestruct: {
        play: (_gameState, ship) => {
            const engineer = ship.engineerState.systems.find(tile => tile.system === 'engineer');
            return engineer?.removeEffect('autoDestructing', 'early') === true;
        },
    },
    cannibalise: {
        play: (_gameState, ship, system) => {
            // The hull can't be stripped: with every card of it damaged, the ship is destroyed.
            const alreadyCannibalised = ship.engineerState.systems.some(tile => tile.hasEffect('cannibalised'));
            const damaged = system.systemState.health;
            if (system.system === 'hull' || alreadyCannibalised || damaged <= 0) {
                return false;
            }

            system.adjustSystemHealth(-damaged);
            system.adjustEffectLevel('cannibalised', damaged);
            ship.engineerState.addCard('graft');
            return true;
        },
    },
    graft: {
        play: (_gameState, ship, system) => {
            if (system.hasEffect('cannibalised')) {
                return false;
            }

            const cannibalisedSystem = ship.engineerState.systems.find(tile => tile.hasEffect('cannibalised'));
            if (!cannibalisedSystem || system.systemState.health >= system.systemState.maxHealth) {
                return false;
            }

            system.systemState.fullyRepairCards(cannibalisedSystem.getEffectLevel('cannibalised'));
            cannibalisedSystem.removeEffect('cannibalised', 'early');
            return true;
        },
    },
    emergencyPower: {
        play: (_gameState, ship) => {
            for (const tile of ship.engineerState.systems) {
                tile.addEffect('emergencyPower');
            }
            return true;
        },
    },
});
