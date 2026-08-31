import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { cardDefinitions } from 'common-data/features/cards/utils/cardDefinitions';
import { Position } from 'common-data/features/space/types/Position';
import { resolveParameters } from '../../../types/resolveParameters';

/** Minimal weapon slot shape needed to determine a weapon's range and firing arc. */
export type WeaponArcSlotInfo = {
    card: CardInstance | null;
    modifiers?: Record<string, number> | null;
};

/** Alpha for the (quite faint) sector fill. */
const FILL_ALPHA = 0.12;
/** Alpha for the (moderately faint) sector outline. */
const STROKE_ALPHA = 0.35;

/**
 * Shades from the tactical crew's primary color palette (see `CrewColors.module.css` `.tactical`),
 * used to distinguish the local ship's own weapon slots from one another.
 */
export const OWN_WEAPON_ARC_COLORS: readonly string[] = [
    'oklch(0.4 0.13 90)',
    'oklch(0.56 0.12 90)',
    'oklch(0.75 0.14 90)',
    'oklch(0.9 0.147 90)',
];

/**
 * Two shades from the danger color palette (see `baseline.css` `--danger-*`), used to distinguish
 * a scanned enemy's weapon slots from one another.
 */
export const ENEMY_WEAPON_ARC_COLORS: readonly string[] = [
    'oklch(0.3 0.25 10)',
    'oklch(0.715 0.25 10)',
];

/** Resolve a weapon slot's effective range and firing arc half-angle (in radians), or null if unequipped. */
export function getWeaponArcParameters(slot: WeaponArcSlotInfo): { maxRange: number; firingArc: number } | null {
    const { card } = slot;
    if (!card) {
        return null;
    }

    const definition = cardDefinitions[card.type];
    if (definition.targetType !== 'weapon-slot') {
        return null;
    }

    const parameters = resolveParameters(definition.parameters, card.modifiers as Record<string, number> | undefined, slot.modifiers);
    const maxRange = parameters['maxRange'] ?? 0;
    const firingArc = parameters['firingArc'] ?? 0;

    if (maxRange <= 0 || firingArc <= 0) {
        return null;
    }

    return { maxRange, firingArc };
}

/**
 * Draw a single weapon's range and firing arc as a sector of a circle: its point on `position`,
 * rotating to match the ship's current facing, with a faint fill and a slightly bolder outline.
 */
function drawWeaponArc(
    ctx: CanvasRenderingContext2D,
    position: Position,
    maxRange: number,
    firingArc: number,
    color: string,
    pixelSize: number
): void {
    // Firing arc is the maximum allowed absolute bearing relative to the ship's facing, so the
    // sector spans from -firingArc to +firingArc either side of dead ahead.
    const startAngle = -position.angle - firingArc;
    const endAngle = -position.angle + firingArc;

    ctx.save();

    ctx.beginPath();
    ctx.moveTo(position.x, position.y);
    ctx.arc(position.x, position.y, maxRange, startAngle, endAngle);
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.globalAlpha = FILL_ALPHA;
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = pixelSize * 2;
    ctx.globalAlpha = STROKE_ALPHA;
    ctx.stroke();

    ctx.restore();
}

/**
 * Draw the range and firing arc of every equipped weapon slot on a ship, one sector per slot,
 * cycling through `colors` so each slot is visually distinct from the others.
 *
 * @param ctx - Canvas context, already in world coordinates.
 * @param position - The ship's current (interpolated) position and facing.
 * @param slots - The ship's weapon slots.
 * @param colors - Colors to cycle through, one per slot (in slot order, regardless of whether each slot is equipped).
 * @param pixelSize - Size of one pixel in world units (for consistent line widths).
 */
export function drawWeaponArcs(
    ctx: CanvasRenderingContext2D,
    position: Position,
    slots: Iterable<WeaponArcSlotInfo>,
    colors: readonly string[],
    pixelSize: number
): void {
    if (colors.length === 0) {
        return;
    }

    let index = 0;
    for (const slot of slots) {
        const arc = getWeaponArcParameters(slot);
        if (arc) {
            drawWeaponArc(ctx, position, arc.maxRange, arc.firingArc, colors[index % colors.length], pixelSize);
        }
        index++;
    }
}
