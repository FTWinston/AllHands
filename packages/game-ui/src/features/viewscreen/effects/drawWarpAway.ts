import { WarpAwayEffect, WeaponEffect, warpAwayWindUp } from 'common-data/features/space/types/WeaponEffect';
import { getSvgBitmap } from 'common-ui/features/spacemap/utils/svgBitmapCache';
import { getBlastSize } from './blastSize';
import { glow, line } from './light';
import { warpColor } from './objectTracker';

/** How long the jump itself takes, once the ship has gathered itself, in milliseconds. */
const jumpDuration = 450;

/** How long a jump to warp takes to play out altogether, in milliseconds. */
export const warpAwayDuration = warpAwayWindUp + jumpDuration + 350;

/**
 * How long a ship that has jumped to warp stays hidden for, if it's still there, in milliseconds. Our own ship is,
 * until the scene changes, which is well within this. It isn't much longer than that, so the ship is back for the next encounter.
 */
export const warpAwayHideDuration = 2000;

/** How far a ship is drawn travelling before it's gone, in world units. */
const jumpDistance = 70;

/** The IDs of the ships that have jumped to warp, so shouldn't be drawn any more, even if they're still there. */
export function getWarpedAwayIds(effects: readonly WeaponEffect[], time: number) {
    const ids = new Set<string>();

    for (const effect of effects) {
        if (effect.type === 'warpAway' && time >= effect.startTime && time <= effect.startTime + warpAwayHideDuration) {
            ids.add(effect.sourceId);
        }
    }

    return ids;
}

/**
 * Draw a ship jumping to warp, as light: it stretches out ahead of itself as it gathers itself, then streaks away
 * the way it was facing, leaving a trail that fades and (unless flashes are to be avoided) a flash where it was.
 * The ship itself is no longer drawn by now, so this draws it.
 */
export function drawWarpAway(ctx: CanvasRenderingContext2D, effect: WarpAwayEffect, dt: number, allowFlash: boolean) {
    if (dt < 0 || dt > warpAwayDuration) {
        return;
    }

    const { x, y, angle } = effect.position;
    const size = getBlastSize(effect.appearance);
    const forwardX = Math.cos(angle);
    const forwardY = -Math.sin(angle);

    // Before the jump, the ship stretches a little. During it, it stretches a lot, and covers a lot of ground.
    const windUp = Math.min(1, dt / warpAwayWindUp);
    const jump = Math.max(0, Math.min(1, (dt - warpAwayWindUp) / jumpDuration));
    const stretch = 1 + windUp * windUp * 0.6 + jump * jump * 30;
    const travelled = jump * jump * jumpDistance;

    const bitmap = jump < 1 ? getSvgBitmap(effect.appearance, warpColor, warpColor) : null;

    if (bitmap) {
        ctx.save();
        ctx.globalAlpha = (0.55 + windUp * 0.45) * (1 - jump);
        ctx.translate(x, y);
        ctx.rotate(-angle);
        // Ships are drawn nose-right. Its tail stays put while it gathers itself, so it's only the nose that stretches forward.
        ctx.translate(travelled + stretch - 1, 0);
        ctx.scale(stretch, 1 / (1 + jump * 2));
        ctx.drawImage(bitmap, -1, -1, 2, 2);
        ctx.restore();
    }

    // A growing glow at the engines as it gathers itself.
    if (jump === 0) {
        glow(ctx, x - forwardX * 0.8, y - forwardY * 0.8, (0.5 + windUp) * size * 0.6, warpColor, windUp * 0.8);
    }

    if (jump > 0) {
        const sinceJump = dt - warpAwayWindUp;
        const fade = Math.max(0, 1 - sinceJump / (warpAwayDuration - warpAwayWindUp));

        // The trail it leaves, from where it was to where it's got to.
        line(ctx, x, y, x + forwardX * travelled, y + forwardY * travelled, 0.12 * size * fade, warpColor, fade * 0.9);

        if (allowFlash) {
            glow(ctx, x, y, (1.5 + sinceJump / 150) * Math.sqrt(size), warpColor, fade * fade);
        }
    }
}
