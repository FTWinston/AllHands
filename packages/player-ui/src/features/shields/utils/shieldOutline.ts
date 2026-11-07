import { shipAppearances, type ObjectAppearance, type ShipAppearance } from 'common-data/features/space/types/ObjectAppearance';
import { shieldOutlines } from './shieldOutlines.generated';

/** How many dots go round a ship's shield outline, so each one stands for an equal share of its shields. */
export const shieldDotCount = 60;

/** The dots' diameter, in the ship drawings' units (each is 512 across). */
export const shieldDotSize = 11;

/**
 * How far, in the same units, the dots can reach outside the ship drawing's box. Ships fill most of their drawings, so the outline around them can't always fit inside.
 * Anything drawing a shield should leave this much room around the ship.
 */
export const shieldOverhang = 16;

/** The outline that a ship's shields are drawn along, or null for anything that isn't a ship design. */
export function getShieldPath(appearance: ObjectAppearance): string | null {
    return (shipAppearances as readonly ObjectAppearance[]).includes(appearance)
        ? shieldOutlines[appearance as ShipAppearance]
        : null;
}

/**
 * A dash pattern for a path with a pathLength of 100, drawing a round dot (a zero-length dash) at each lit position:
 * the share of all `shieldDotCount` dots that `level` (0-100) amounts to, centred on the start of the path, which is the ship's nose.
 * Partial shields always light at least one dot, and never all of them, so neither looks like empty or full shields.
 * Null when no dots are lit.
 */
export function getShieldDotPattern(level: number): { dasharray: string; dashoffset: number } | null {
    const spacing = 100 / shieldDotCount;
    const lit = level <= 0
        ? 0
        : level >= 100
            ? shieldDotCount
            : Math.max(1, Math.min(shieldDotCount - 1, Math.round(level / 100 * shieldDotCount)));

    if (lit <= 0) {
        return null;
    }

    if (lit >= shieldDotCount) {
        return { dasharray: `0 ${spacing}`, dashoffset: 0 };
    }

    // Dots evenly spaced, then one long gap round the rest of the outline, back to the first dot.
    const dashes = Array.from({ length: lit - 1 }, () => `0 ${spacing}`);
    dashes.push(`0 ${100 - spacing * (lit - 1)}`);

    // Move the pattern along so the dots sit either side of the nose, on the same positions as the track's dots.
    // (With an even number lit, one side gets the extra dot.)
    return { dasharray: dashes.join(' '), dashoffset: Math.floor((lit - 1) / 2) * spacing };
}

/** A dash pattern drawing every dot, for the faint track that shows the shields' full extent. */
export const shieldTrackDasharray = `0 ${100 / shieldDotCount}`;
