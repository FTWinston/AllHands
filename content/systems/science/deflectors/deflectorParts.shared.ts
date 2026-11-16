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
    /** What it does to the shields of each ship it hits, as well as leaving its effect, if anything. */
    shields?: SubstanceShields;
}

/** What a substance does to the shields of each ship it hits, at a Beam's strength. */
interface SubstanceShields {
    /** The percentage of the ship's full shields that a hostile deflector drains, or an Inverted one restores. */
    percent: number;
    /** How many cards that try to tune the shields are wasted, because a hostile deflector scrambles them (see `HullState.scrambleShields`). */
    scrambleCards: number;
}

export const deflectorSubstanceParts: Record<DeflectorEffectSubstance, SubstancePart> = {
    // Damage taken, in percent.
    Antiproton: { effect: 'antiprotonResidue', invertedEffect: 'antiprotonShielding', level: 40, duration: 15_000, wholeShip: false },
    // Chance to be hit, in percentage points, and the shields.
    Tetryon: { effect: 'tetryonSaturation', invertedEffect: 'tetryonScattering', level: 30, duration: 15_000, wholeShip: false, shields: { percent: 20, scrambleCards: 3 } },
    // Card draws: every other one fails, or brings an extra card.
    Chroniton: { effect: 'chronitonSaturation', invertedEffect: 'chronitonAcceleration', level: null, duration: 30_000, wholeShip: false },
    // Power.
    Polaron: { effect: 'polaronBombardment', invertedEffect: 'polaronCharge', level: 2, duration: 10_000, wholeShip: false },
    // Manoeuvre speed, in percent.
    Graviton: { effect: 'gravitonDrag', invertedEffect: 'gravitonLift', level: 40, duration: 15_000, wholeShip: true },
};

/** How far from the ship firing it a Burst reaches. */
export const deflectorBurstRadius = 6;

/** The long and short radii of the oval a Field leaves, in map units. */
export const deflectorFieldRadiusAlong = 4;
export const deflectorFieldRadiusAcross = 2.5;

/** How long a Field lasts, in milliseconds, before its modifier lengthens it. */
export const deflectorFieldDuration = 20_000;

/** How often a Field acts on the ships inside it, in milliseconds. */
export const deflectorFieldInterval = 1000;

/** How long each of a Field's effects lasts, in milliseconds. It's renewed every `deflectorFieldInterval`, so it fades soon after a ship leaves. */
export const deflectorFieldEffectDuration = 2000;

/** What a Field's drain (or restoring) of shields is multiplied by, as it happens every `deflectorFieldInterval` rather than once. */
export const deflectorFieldShieldScale = 0.25;

/** A deflector's delivery is its shape: which ships and systems it hits, and how strongly. */
interface DeliveryPart {
    /**
     * Whether it hits the ship it's fired at (or, Inverted, the ship firing it), every ship within `deflectorBurstRadius` of the ship firing it,
     * or every ship inside a field that it leaves around that ship, for as long as it lasts.
     */
    ships: 'target' | 'nearby' | 'zone';
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
    // A field's effects are renewed for as long as a ship is inside it, so its strength is that of a Pulse.
    Field: { ships: 'zone', systems: 'all', strength: 0.5, durationMultiplier: 1 },
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
    /**
     * Which ships it hits: the one it's fired at (or, if friendly, the one firing it), every one within `deflectorBurstRadius` of the one firing it,
     * or every one inside the field it leaves around the one it's fired at (or, if friendly, the one firing it).
     */
    ships: 'target' | 'nearby' | 'zone';
    /** Which systems of each of those ships it hits: one, every one, or only the helm (for an effect on the whole ship). */
    systems: 'one' | 'all' | 'helm';
    /** The level of the effect it leaves, or null if the effect has no levels. */
    level: number | null;
    /** How long the effect it leaves lasts, in milliseconds. */
    duration: number;
    /** How long the field it leaves lasts, in milliseconds, or null if it doesn't leave one. */
    fieldDuration: number | null;
    /** What it does to the shields of each ship it hits, or null if nothing. Not weakened by shields. */
    shields: OutcomeShields | null;
    /** Whether hostile ships' shields weaken it (see `deflectorShieldDampening`). */
    weakenedByShields: boolean;
}

/** What a deflector does to the shields of each ship it hits. */
export interface OutcomeShields {
    /** Whether it restores them, rather than draining them. */
    restores: boolean;
    /** The percentage of the ship's full shields that it drains or restores, each time it acts. */
    percent: number;
    /** How many cards that try to tune the shields are wasted, because they're scrambled; 0 if it doesn't scramble them. */
    scrambleCards: number;
}

/** Work out what a deflector loaded with the given parts does, from what each part means. */
export function getDeflectorOutcome({ modifier, substance, delivery }: DeflectorParts): DeflectorOutcome {
    const substancePart = deflectorSubstanceParts[substance];
    const deliveryPart = deflectorDeliveryParts[delivery];
    const modifierPart = deflectorModifierParts[modifier];

    const isField = deliveryPart.ships === 'zone';
    const baseDuration = isField
        ? deflectorFieldEffectDuration
        : substancePart.duration * deliveryPart.durationMultiplier * modifierPart.durationMultiplier;

    return {
        effect: modifierPart.inverted ? substancePart.invertedEffect : substancePart.effect,
        friendly: modifierPart.inverted,
        ships: deliveryPart.ships,
        systems: substancePart.wholeShip ? 'helm' : deliveryPart.systems,
        level: substancePart.level === null ? null : weakenLevel(substancePart.level, deliveryPart.strength),
        duration: substancePart.level === null && !isField ? weakenDuration(baseDuration, deliveryPart.strength) : baseDuration,
        fieldDuration: isField ? deflectorFieldDuration * deliveryPart.durationMultiplier * modifierPart.durationMultiplier : null,
        shields: substancePart.shields
            ? {
                restores: modifierPart.inverted,
                percent: substancePart.shields.percent * deliveryPart.strength * (isField ? deflectorFieldShieldScale : 1),
                scrambleCards: modifierPart.inverted ? 0 : weakenLevel(substancePart.shields.scrambleCards, deliveryPart.strength),
            }
            : null,
        weakenedByShields: !modifierPart.ignoresShields,
    };
}

/** How many shield points a deflector with the given outcome drains or restores each time it acts, on a ship with the given full shields, but at least 1. */
export function getShieldAmount(shields: OutcomeShields, maxShield: number) {
    return Math.max(1, Math.round(maxShield * shields.percent / 100));
}

/** Multiply an effect's level by a strength, keeping it a whole number, and at least 1. */
export function weakenLevel(level: number, strength: number) {
    return Math.max(1, Math.round(level * strength));
}

/** Multiply an effect's duration by a strength, keeping it to whole seconds, and at least one. */
export function weakenDuration(duration: number, strength: number) {
    return Math.max(1, Math.round(duration * strength / 1000)) * 1000;
}
