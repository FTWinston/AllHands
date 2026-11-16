import type { DeflectorEffectDelivery, DeflectorEffectModifier, DeflectorEffectSubstance } from 'common-data/features/cards/types/CardDefinition';
import type { effects } from 'content/systems/science/effects/scienceEffects.shared';

/** What a deflector is loaded with: one part from each of its three slots. */
export interface DeflectorParts {
    modifier: DeflectorEffectModifier;
    substance: DeflectorEffectSubstance;
    delivery: DeflectorEffectDelivery;
}

export const deflectorModifiers = ['Modulated', 'Phased', 'Coherent', 'Inverted'] as const satisfies readonly DeflectorEffectModifier[];
export const deflectorSubstances = ['Antiproton', 'Tetryon', 'Chroniton', 'Polaron', 'Graviton'] as const satisfies readonly DeflectorEffectSubstance[];
export const deflectorDeliveries = ['Beam', 'Pulse', 'Burst', 'Field'] as const satisfies readonly DeflectorEffectDelivery[];

/** The deflector card that each combination of parts plays as. */
export type DeflectorCardType = `deflector${DeflectorEffectModifier}${DeflectorEffectSubstance}${DeflectorEffectDelivery}`;

/** Make something for the deflector card of every combination of parts, keyed by that card's type. */
export function mapDeflectorCards<T>(make: (parts: DeflectorParts) => T): Record<DeflectorCardType, T> {
    const result: Partial<Record<DeflectorCardType, T>> = {};

    for (const modifier of deflectorModifiers) {
        for (const substance of deflectorSubstances) {
            for (const delivery of deflectorDeliveries) {
                result[`deflector${modifier}${substance}${delivery}`] = make({ modifier, substance, delivery });
            }
        }
    }

    return result as Record<DeflectorCardType, T>;
}

type ScienceEffect = keyof typeof effects;

/** A deflector's substance is what it does: the effect it leaves on each system it hits. */
interface SubstancePart {
    /** The effect left on the systems of hostile ships. */
    effect: ScienceEffect;
    /** The beneficial opposite, left on the systems of friendly ships by an Inverted deflector. */
    invertedEffect: ScienceEffect;
    /** The level a Beam leaves both effects at, or null if they don't use levels, in which case a weaker delivery makes them last less time instead. */
    level: number | null;
    /** How long a Beam's effect lasts, in milliseconds. */
    duration: number;
    /** Whether the effect is about the whole ship, so goes on its helm once, rather than on each system that's hit. */
    wholeShip: boolean;
}

export const deflectorSubstanceParts: Record<DeflectorEffectSubstance, SubstancePart> = {
    // Damage taken, in percent.
    Antiproton: { effect: 'antiprotonResidue', invertedEffect: 'antiprotonShielding', level: 40, duration: 15_000, wholeShip: false },
    // Chance to be hit, in percentage points.
    Tetryon: { effect: 'tetryonSaturation', invertedEffect: 'tetryonScattering', level: 30, duration: 15_000, wholeShip: false },
    // Every other card draw fails, or brings an extra card.
    Chroniton: { effect: 'chronitonSaturation', invertedEffect: 'chronitonAcceleration', level: null, duration: 30_000, wholeShip: false },
    // Power.
    Polaron: { effect: 'polaronBombardment', invertedEffect: 'polaronCharge', level: 2, duration: 10_000, wholeShip: false },
    // Manoeuvre speed, in percent.
    Graviton: { effect: 'gravitonDrag', invertedEffect: 'gravitonLift', level: 40, duration: 15_000, wholeShip: true },
};

/** How far from the ship firing it a Burst reaches. */
export const deflectorBurstRadius = 6;

/** A deflector's delivery is its shape: which ships and systems it hits, and how strongly. */
interface DeliveryPart {
    /** Whether it hits the ship it's fired at (or, Inverted, the ship firing it), or every ship within `deflectorBurstRadius` of the ship firing it. */
    ships: 'target' | 'nearby';
    /** Whether it hits one system of each of those ships, or every system. */
    systems: 'one' | 'all';
    /** What the substance's level (or duration, where it has no levels) is multiplied by. */
    strength: number;
    /** What the substance's duration is multiplied by. */
    durationMultiplier: number;
}

export const deflectorDeliveryParts: Record<DeflectorEffectDelivery, DeliveryPart> = {
    Beam: { ships: 'target', systems: 'one', strength: 1, durationMultiplier: 1 },
    Pulse: { ships: 'target', systems: 'all', strength: 0.5, durationMultiplier: 1 },
    Burst: { ships: 'nearby', systems: 'all', strength: 0.25, durationMultiplier: 1 },
    // There's nothing in space for a field to linger in, so it lingers on the ship instead: weak, but long lasting.
    Field: { ships: 'target', systems: 'all', strength: 0.25, durationMultiplier: 3 },
};

/**
 * The most that a hostile ship's shields weaken a deflector that doesn't ignore them, when they're full: they weaken it in proportion to how full they are.
 * It's the level (or duration, where there are no levels) that's weakened.
 */
export const deflectorShieldDampening = 0.5;

/** A deflector's modifier is its twist. */
interface ModifierPart {
    /** Whether hostile ships' shields don't weaken it. */
    ignoresShields: boolean;
    /** What the substance's duration is multiplied by. */
    durationMultiplier: number;
    /** Whether it leaves the beneficial opposite of its substance's effect on friendly ships, rather than its effect on hostile ones. */
    inverted: boolean;
}

export const deflectorModifierParts: Record<DeflectorEffectModifier, ModifierPart> = {
    Modulated: { ignoresShields: false, durationMultiplier: 1, inverted: false },
    Phased: { ignoresShields: true, durationMultiplier: 1, inverted: false },
    Coherent: { ignoresShields: false, durationMultiplier: 2, inverted: false },
    // Your own ship's shields don't stand in the way of what your deflector gives it.
    Inverted: { ignoresShields: true, durationMultiplier: 1, inverted: true },
};

/** What a deflector loaded with a given set of parts does, before any shields weaken it. */
export interface DeflectorOutcome {
    /** The effect it leaves. */
    effect: ScienceEffect;
    /** Whether it hits friendly ships (your own included), rather than hostile ones. */
    friendly: boolean;
    /** Which ships it hits: the one it's fired at (or, if friendly, the one firing it), or every one within `deflectorBurstRadius` of the one firing it. */
    ships: 'target' | 'nearby';
    /** Which systems of each of those ships it hits: one, every one, or only the helm (for an effect on the whole ship). */
    systems: 'one' | 'all' | 'helm';
    /** The level of the effect it leaves, or null if the effect has no levels. */
    level: number | null;
    /** How long the effect it leaves lasts, in milliseconds. */
    duration: number;
    /** Whether hostile ships' shields weaken it (see `deflectorShieldDampening`). */
    weakenedByShields: boolean;
}

/** Work out what a deflector loaded with the given parts does, from what each part means. */
export function getDeflectorOutcome({ modifier, substance, delivery }: DeflectorParts): DeflectorOutcome {
    const substancePart = deflectorSubstanceParts[substance];
    const deliveryPart = deflectorDeliveryParts[delivery];
    const modifierPart = deflectorModifierParts[modifier];

    const baseDuration = substancePart.duration * deliveryPart.durationMultiplier * modifierPart.durationMultiplier;

    return {
        effect: modifierPart.inverted ? substancePart.invertedEffect : substancePart.effect,
        friendly: modifierPart.inverted,
        ships: deliveryPart.ships,
        systems: substancePart.wholeShip ? 'helm' : deliveryPart.systems,
        level: substancePart.level === null ? null : weakenLevel(substancePart.level, deliveryPart.strength),
        duration: substancePart.level === null ? weakenDuration(baseDuration, deliveryPart.strength) : baseDuration,
        weakenedByShields: !modifierPart.ignoresShields,
    };
}

/** Multiply an effect's level by a strength, keeping it a whole number, and at least 1. */
export function weakenLevel(level: number, strength: number) {
    return Math.max(1, Math.round(level * strength));
}

/** Multiply an effect's duration by a strength, keeping it to whole seconds, and at least one. */
export function weakenDuration(duration: number, strength: number) {
    return Math.max(1, Math.round(duration * strength / 1000)) * 1000;
}
