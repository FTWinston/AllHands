import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { distance } from 'common-data/features/space/utils/vectors';
import { defineEngineEffects } from 'engine/content/EngineContent';
import { effects as sharedEffects, holdFireLockGain } from './tacticalEffects.shared';
import type { EffectRemoval } from 'engine/effects/EngineSystemEffectDefinition';
import type { CardState } from 'engine/state/CardState';
import type { GameState } from 'engine/state/GameState';
import type { Ship } from 'engine/state/Ship';
import type { EngineerSystemTile } from 'engine/state/systems/engineer/EngineerSystemTile';

/** A tractor beam that one ship holds another in. */
type TractorBeam = {
    gameState: GameState;
    source: Ship;
    target: Ship;
    /** How far apart the ships can get before the beam breaks. */
    range: number;
};

/** The id of the listener on a held ship's helm that has it break free (see `engageTractorBeam`). */
const breakFreeListenerId = 'tractorBeam';

/** The tractor beam that each ship's helm is holding, or is held by, keyed by that helm's tile. */
const beamsBySourceHelm = new WeakMap<EngineerSystemTile, TractorBeam>();
const beamsByTargetHelm = new WeakMap<EngineerSystemTile, TractorBeam>();

/** The id of the listener on a held ship's helm that marks cards added to its hand as caught (see `markCaught`). */
const caughtListenerId = 'caught';

/** The cards in each held helm's hand that its tractor beam marked as caught, keyed by that helm's tile. */
const caughtCards = new WeakMap<EngineerSystemTile, Set<CardState>>();

/** Mark every card in a held helm's hand, and every card added to it while it's held, as caught, so helm can see the ship is in a tractor beam. */
function markCaught(helm: EngineerSystemTile) {
    const caught = new Set<CardState>();
    caughtCards.set(helm, caught);

    const mark = (card: CardState) => {
        if (!card.hasTrait('caught')) {
            card.addTrait('caught', ExtraTraitType.Negative);
            caught.add(card);
        }
    };

    for (const card of helm.systemState.hand) {
        mark(card);
    }

    helm.systemState.cardAddedToHand.addListener(caughtListenerId, mark);
}

/** Once a helm is no longer held, the cards its beam marked as caught aren't any more, wherever they've gone. */
function unmarkCaught(helm: EngineerSystemTile) {
    helm.systemState.cardAddedToHand.removeListener(caughtListenerId);

    for (const card of caughtCards.get(helm) ?? []) {
        card.removeTrait('caught');
    }

    caughtCards.delete(helm);
}

function getHelmTile(ship: Ship) {
    return ship.engineerState.systems.find(tile => tile.system === 'helm') ?? null;
}

/** Whether a beam's ships are both still there, and close enough together for it to hold. */
function beamHolds(beam: TractorBeam) {
    const { objects, currentTime } = beam.gameState;
    return objects.get(beam.source.id) === beam.source
        && objects.get(beam.target.id) === beam.target
        && distance(beam.source.getPosition(currentTime), beam.target.getPosition(currentTime)) <= beam.range;
}

/**
 * Have one ship hold another in its tractor beam: the target's current manoeuvre is cut short, and both ships' manoeuvres are slowed by the given percentages,
 * until the beam is released (see `releaseTractorBeam`), or breaks as the ships get too far apart.
 * Any beam the ship was already holding on another ship is released first. Returns false if the target isn't within range, or either ship has no helm.
 */
export function engageTractorBeam(source: Ship, target: Ship, range: number, targetSlowdown: number, ownSlowdown: number): boolean {
    const sourceHelm = getHelmTile(source);
    const targetHelm = getHelmTile(target);
    if (!sourceHelm || !targetHelm || source === target) {
        return false;
    }

    const beam: TractorBeam = { gameState: sourceHelm.systemState.getGameState(), source, target, range };
    if (!beamHolds(beam)) {
        return false;
    }

    const existing = beamsBySourceHelm.get(sourceHelm);
    if (existing && existing.target !== target) {
        sourceHelm.removeEffect('tractorBeamEngaged', 'early');
    }

    // The maps are set first, as each effect's apply looks them up. Adding an effect that's already there starts its time over.
    beamsBySourceHelm.set(sourceHelm, beam);
    beamsByTargetHelm.set(targetHelm, beam);
    targetHelm.addEffect('heldByTractorBeam', targetSlowdown);
    sourceHelm.addEffect('tractorBeamEngaged', ownSlowdown);

    target.helmState.cancelActiveManeuver();

    // A held ship that starts a manoeuvre with more power at its helm than the holder has at its tactical breaks the beam.
    target.helmState.maneuverStarted.addListener(breakFreeListenerId, () => {
        if (target.helmState.powerLevel > source.tacticalState.powerLevel) {
            releaseTractorBeam(source, target);
        }
    });
    return true;
}

/** Have a ship break free of any tractor beam that holds it, whatever the power levels at its helm and the holder's tactical. Does nothing if it isn't held. */
export function breakFreeOfTractorBeam(ship: Ship) {
    getHelmTile(ship)?.removeEffect('heldByTractorBeam', 'early');
}

/** Whether a ship is still holding a target in its tractor beam. */
export function isHoldingInTractorBeam(source: Ship, target: Ship): boolean {
    const sourceHelm = getHelmTile(source);
    return !!sourceHelm && beamsBySourceHelm.get(sourceHelm)?.target === target && sourceHelm.hasEffect('tractorBeamEngaged');
}

/** Have a ship let go of a target held in its tractor beam, removing the effects from both ships. Does nothing if its beam is on another ship, or none. */
export function releaseTractorBeam(source: Ship, target: Ship) {
    const sourceHelm = getHelmTile(source);
    if (sourceHelm && beamsBySourceHelm.get(sourceHelm)?.target === target) {
        sourceHelm.removeEffect('tractorBeamEngaged', 'early');
    }
}

/** Undo what a tractor beam's effect did to its ship's manoeuvres, and break the beam: the effect on the other ship goes too, if it's still from this beam. */
function releaseBeam(helm: EngineerSystemTile, level: number, removal: EffectRemoval, ownBeams: WeakMap<EngineerSystemTile, TractorBeam>) {
    helm.systemState.getShip().helmState.maneuverSpeedModifier += level;

    const beam = ownBeams.get(helm);
    ownBeams.delete(helm);
    if (ownBeams === beamsByTargetHelm) {
        const { helmState } = helm.systemState.getShip();
        helmState.maneuverStarted.removeListener(breakFreeListenerId);
        unmarkCaught(helm);
    }
    if (!beam) {
        return;
    }

    const holdingSource = ownBeams === beamsBySourceHelm;
    const otherHelm = getHelmTile(holdingSource ? beam.target : beam.source);
    const otherBeams = holdingSource ? beamsByTargetHelm : beamsBySourceHelm;
    if (otherHelm && otherBeams.get(otherHelm) === beam) {
        otherHelm.removeEffect(holdingSource ? 'heldByTractorBeam' : 'tractorBeamEngaged', removal);
    }
}

/** The effects at each end of a tractor beam: each slows its own ship's manoeuvres by its level percent (see `applyMotionCard`), and they're removed together once the beam breaks. */
function tractorBeamEffect(ownBeams: WeakMap<EngineerSystemTile, TractorBeam>) {
    return {
        apply: (system: EngineerSystemTile, level: number) => {
            if (system.system !== 'helm') {
                return false;
            }

            system.systemState.getShip().helmState.maneuverSpeedModifier -= level;
            if (ownBeams === beamsByTargetHelm) {
                markCaught(system);
            }
            return true;
        },
        remove: (system: EngineerSystemTile, removal: EffectRemoval, level: number) => releaseBeam(system, level, removal, ownBeams),
        onLevelChanged: (system: EngineerSystemTile, newLevel: number, oldLevel: number) => {
            system.systemState.getShip().helmState.maneuverSpeedModifier -= newLevel - oldLevel;
        },
        // The beam breaks if the ships get too far apart, or either one is gone.
        tick: (system: EngineerSystemTile) => {
            const beam = ownBeams.get(system);
            if (!beam || !beamHolds(beam)) {
                system.removeEffect(ownBeams === beamsBySourceHelm ? 'tractorBeamEngaged' : 'heldByTractorBeam', 'early');
            }
        },
    };
}

export const effects = defineEngineEffects(sharedEffects, {
    // Nothing to do here: an encounter that cares whether a flare is burning looks for this on a ship's tactical system.
    flareBurning: {
        apply: system => system.system === 'tactical',
        remove: () => {},
    },
    // The tactical system keeps its own count of Lock, for its client to see and its weapons to use, so it's told of every change to the level.
    lock: {
        apply: (system, level) => {
            if (system.system !== 'tactical') {
                return false;
            }

            system.systemState.getShip().tacticalState.lockLevelChanged(level);
            return true;
        },
        remove: system => system.systemState.getShip().tacticalState.lockLevelChanged(0),
        onLevelChanged: (system, newLevel) => system.systemState.getShip().tacticalState.lockLevelChanged(newLevel),
    },
    holdingFire: {
        apply: (system) => {
            if (system.system !== 'tactical') {
                return false;
            }

            system.systemState.getShip().tacticalState.holdFireChanged(true);
            return true;
        },
        // Lock is only gained if the effect ran its course.
        remove: (system, removal) => system.systemState.getShip().tacticalState.holdFireChanged(false, removal === 'expired', holdFireLockGain),
    },
    calledShot: {
        apply: system => system.system === 'tactical',
        remove: system => system.systemState.getShip().tacticalState.calledShotEnded(),
    },
    heldByTractorBeam: tractorBeamEffect(beamsByTargetHelm),
    tractorBeamEngaged: tractorBeamEffect(beamsBySourceHelm),
});
