import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { WeaponEffect } from 'common-data/features/space/types/WeaponEffect';

/** How long a shot result stays on screen, in milliseconds. */
export const shotResultLifetime = 1500;

/** The most results shown at once. Beyond that, the oldest go early. */
export const maxShotResults = 3;

export type ShotOutcome = 'hit' | 'absorbed' | 'miss';

/** What happened to one of our shots (or to several in a row, that all came out the same). */
export interface ShotOutcomeInfo {
    outcome: ShotOutcome;
    targetId: string;
    /** The system a hit landed on, if known. */
    system?: ShipSystem;
}

export interface ShotResult extends ShotOutcomeInfo {
    /** Changes whenever the result does, so that a repeated result is shown afresh. */
    id: number;
    /** How many shots in a row this result stands for. */
    count: number;
    /** The time (in `Date.now()` terms) that this result goes away. */
    expiresAt: number;
}

/**
 * What a weapon effect tells us about a shot fired by our own ship, or null if it says nothing of the sort.
 * A miss is known as soon as the shot is fired. A hit isn't known until it lands, when the impact says how much got through the shields, and where.
 */
export function getShotOutcome(effect: WeaponEffect, shipId: string): ShotOutcomeInfo | null {
    if (effect.sourceId !== shipId) {
        return null;
    }

    if (effect.type === 'shot') {
        return effect.missed && effect.targetId
            ? { outcome: 'miss', targetId: effect.targetId }
            : null;
    }

    if (effect.type === 'impact') {
        return {
            outcome: effect.damage > 0 ? 'hit' : 'absorbed',
            targetId: effect.targetId,
            system: effect.damage > 0 ? effect.system : undefined,
        };
    }

    return null;
}

/** The results that haven't yet expired. */
export function pruneShotResults(results: readonly ShotResult[], now: number): ShotResult[] {
    return results.filter(result => result.expiresAt > now);
}

/**
 * Add a shot's outcome to the results being shown, dropping any that have expired.
 * An outcome the same as the latest one (a volley) adds to that result's count, rather than starting another.
 */
export function addShotResult(results: readonly ShotResult[], outcome: ShotOutcomeInfo, now: number, id: number): ShotResult[] {
    const live = pruneShotResults(results, now);
    const latest = live[live.length - 1];
    const expiresAt = now + shotResultLifetime;

    if (latest && latest.outcome === outcome.outcome && latest.targetId === outcome.targetId && latest.system === outcome.system) {
        return [...live.slice(0, -1), { ...latest, id, count: latest.count + 1, expiresAt }];
    }

    return [...live, { ...outcome, id, count: 1, expiresAt }].slice(-maxShotResults);
}

const systemLabels: Record<ShipSystem, string> = {
    hull: 'Hull',
    reactor: 'Reactor',
    helm: 'Helm',
    science: 'Science',
    tactical: 'Tactical',
    engineer: 'Engineer',
};

/**
 * The words for a result, e.g. "Hit · Helm", "Absorbed by shields", "Miss ×3".
 * A shot at any target but the one being shown names its target too.
 */
export function describeShotResult(result: ShotResult, currentTargetId: string | null, targetName: string | undefined): string {
    let text: string;

    if (result.outcome === 'hit') {
        text = result.system ? `Hit · ${systemLabels[result.system]}` : 'Hit';
    } else if (result.outcome === 'absorbed') {
        text = 'Absorbed by shields';
    } else {
        text = 'Miss';
    }

    if (result.count > 1) {
        text += ` ×${result.count}`;
    }

    if (result.targetId !== currentTargetId && targetName) {
        text += ` · ${targetName}`;
    }

    return text;
}
