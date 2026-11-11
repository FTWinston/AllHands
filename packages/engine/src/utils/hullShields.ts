import { getShieldAbsorption, getShieldDrainPercent, shieldCollapsePercent, tunedReductionPercent } from 'common-data/features/ships/utils/shieldStats';

/** What's needed of a hull card, to work out what it contributes to the shields. */
export interface ShieldStatCard {
    readonly isDamaged: boolean;
    getParameter(parameter: string): number;
}

/** The shields' capacity: the total of every undamaged hull card's. */
export function getShieldCapacity(cards: Iterable<ShieldStatCard>): number {
    let total = 0;

    for (const card of cards) {
        if (!card.isDamaged) {
            total += card.getParameter('shieldCapacity');
        }
    }

    return Math.max(0, total);
}

/** What the shields' current tuning does to a hit. */
export interface ShieldHitModifiers {
    /** Whether the shields are tuned against one of the hit's weapon traits. */
    tuned: boolean;
    reinforced: boolean;
}

export interface ShieldHitResult {
    /** How much the shields are drained by. When they collapse, this is all they had left. */
    drain: number;
    /** The damage that gets past the shields. */
    passedThrough: number;
    /** Whether the hit left the shields too weak to hold, so they failed. */
    collapsed: boolean;
}

/**
 * Work out how a hit is split between the shields and what gets past them.
 * - Shields tuned against one of the hit's weapon traits reduce the hit itself.
 * - The shields then absorb a share of what's left, set by the hull's power level. The rest gets past them.
 * - Absorbing drains the shields: by less at higher hull power, and by less again while they're reinforced.
 * - If that leaves the shields below `shieldCollapsePercent` of their capacity, they collapse, losing the rest.
 */
export function resolveShieldHit(amount: number, shield: number, maxShield: number, powerLevel: number, modifiers: ShieldHitModifiers): ShieldHitResult {
    const reduced = modifiers.tuned
        ? amount - Math.round(amount * tunedReductionPercent / 100)
        : amount;

    let absorbed = shield > 0
        ? Math.round(reduced * getShieldAbsorption(powerLevel) / 100)
        : 0;

    if (absorbed <= 0) {
        return { drain: 0, passedThrough: reduced, collapsed: false };
    }

    const drainPercent = getShieldDrainPercent(powerLevel, modifiers.reinforced);
    let drain = Math.round(absorbed * drainPercent / 100);

    if (drain > shield) {
        // The shields can't absorb their whole share: only what they have left pays for.
        drain = shield;
        absorbed = Math.min(absorbed, Math.floor(shield * 100 / drainPercent));
    }

    const collapsed = shield - drain < maxShield * shieldCollapsePercent / 100;

    return {
        drain: collapsed ? shield : drain,
        passedThrough: reduced - absorbed,
        collapsed,
    };
}
