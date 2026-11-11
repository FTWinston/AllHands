import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { WeaponEffect } from 'common-data/features/space/types/WeaponEffect';
import { getColors } from 'common-ui/features/spacemap/utils/relationshipColors';
import { getWeaponVisual } from 'common-ui/features/spacemap/utils/weaponVisuals';
import { ObjectTracker } from './objectTracker';

const tagDuration = 1100;
const destroyedDuration = 3600;
/** How long the tag saying that a ship has jumped to warp shows for, in milliseconds. */
export const warpedOutTagDuration = 3600;

const missColor = '#9fb4bf';
const shieldColor = '#7fe3ff';
const damageColor = '#ff5a4a';

/** Where tags go relative to the ship they're about, in world units, and how far apart they stack, in pixels. */
const tagOffset = { x: 1.6, y: -1.5 };
const tagSpacing = 22;

const nameOffset = { x: 1.35, y: 1.15 };

const backgroundColor = '#02070c';

/** Draw short text labels saying what's going on: which ship is which, what each shot did, and what torpedoes have left to fly. */
export function drawCombatLabels(ctx: CanvasRenderingContext2D, effects: readonly WeaponEffect[], tracker: ObjectTracker, time: number) {
    const transform = ctx.getTransform();

    const draw = (x: number, y: number, text: string, color: string, alpha: number, size: number, stackIndex = 0) => {
        if (alpha <= 0) {
            return;
        }

        const point = transform.transformPoint({ x, y });
        const screenY = point.y - stackIndex * tagSpacing;

        ctx.globalAlpha = Math.min(1, alpha);
        ctx.font = `${size}px "Share Tech Mono", monospace`;
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(point.x - 3, screenY - size * 0.7, ctx.measureText(text).width + 6, size * 1.4);
        ctx.fillStyle = color;
        ctx.fillText(text, point.x, screenY);
    };

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (const tracked of tracker.values()) {
        if (tracked.isPresent && tracked.isShip) {
            draw(tracked.x + nameOffset.x, tracked.y + nameOffset.y, tracked.name.toUpperCase(), getColors(tracked.relationship)[1], 0.75, 13);
        }
    }

    // Tags about the same ship stack up, rather than overlapping.
    const tagCounts = new Map<string, number>();

    const drawTag = (targetId: string, text: string, color: string, dt: number, duration: number) => {
        const target = tracker.get(targetId);

        if (target && dt >= 0 && dt <= duration) {
            const stackIndex = tagCounts.get(targetId) ?? 0;
            tagCounts.set(targetId, stackIndex + 1);

            // Hold at full strength for most of their time, then fade out.
            draw(target.x + tagOffset.x, target.y + tagOffset.y, text, color, (1 - dt / duration) * 3, 15, stackIndex);
        }
    };

    for (const effect of effects) {
        const dt = time - effect.startTime;

        if (effect.type === 'explosion') {
            const name = tracker.get(effect.sourceId)?.name ?? 'Target';
            drawTag(effect.sourceId, `${name.toUpperCase()} DESTROYED`, damageColor, dt, destroyedDuration);
        } else if (effect.type === 'warpOut') {
            const source = tracker.get(effect.sourceId);

            // There's nobody left to read it if it was us that jumped.
            if (source && source.relationship !== RelationshipType.Self) {
                drawTag(effect.sourceId, `${source.name.toUpperCase()} WARPED OUT`, missColor, dt, warpedOutTagDuration);
            }
        } else if (effect.type === 'impact') {
            // Once a ship has gone, that's all there is to say about it.
            if (tracker.get(effect.targetId)?.isPresent) {
                if (effect.damage > 0) {
                    drawTag(effect.targetId, 'HULL DAMAGE', damageColor, dt, tagDuration);
                } else {
                    drawTag(effect.targetId, 'SHIELDS HOLD', shieldColor, dt, tagDuration);
                }
            }
        } else if (effect.targetId) {
            const { kind, duration, color, label } = getWeaponVisual(effect.weapon);

            if (kind === 'deflector') {
                drawTag(effect.targetId, label.toUpperCase(), color, dt, duration);
            } else if (effect.missed) {
                drawTag(effect.targetId, 'MISS', missColor, kind === 'projectile' ? dt - duration : dt, tagDuration);
            }
        }
    }

    ctx.restore();
}
