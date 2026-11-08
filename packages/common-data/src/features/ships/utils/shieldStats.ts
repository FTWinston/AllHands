/** What's needed of a hull card, to work out what it contributes to the shields. */
export interface ShieldStatCard {
    readonly isDamaged: boolean;
    getParameter(parameter: string): number;
}

export interface ShieldStats {
    /** The shields' max level. */
    capacity: number;
    /** How much the hull's undamaged cards add to each recharge, before its power level is added. */
    cardCharge: number;
    /** How much the shields recharge by, each time an undamaged hull card is drawn. Nothing while the hull is unpowered. */
    charge: number;
    /** How many undamaged hull cards must be drawn after the shields are hit, before they start recharging again. */
    rechargeDelay: number;
}

function sumParameter(cards: Iterable<ShieldStatCard>, parameter: string, includeDamaged: boolean) {
    let total = 0;

    for (const card of cards) {
        if (includeDamaged || !card.isDamaged) {
            total += card.getParameter(parameter);
        }
    }

    return total;
}

/**
 * The hull's cards alone set its shield stats. Emitters give capacity, and add to the recharge delay, even when damaged.
 * Regenerators add to the charge, and delay reduction cards take from the recharge delay, only while undamaged.
 * The hull's power level adds to the charge, but there's no charge at all while it's unpowered.
 */
export function getShieldStats(cards: Iterable<ShieldStatCard>, powerLevel: number): ShieldStats {
    const cardCharge = sumParameter(cards, 'shieldCharge', false);

    return {
        capacity: Math.max(0, sumParameter(cards, 'shieldCapacity', true)),
        cardCharge,
        charge: powerLevel > 0 ? Math.max(0, cardCharge + powerLevel) : 0,
        rechargeDelay: Math.max(0, sumParameter(cards, 'shieldRechargeDelay', true) - sumParameter(cards, 'shieldDelayReduction', false)),
    };
}
