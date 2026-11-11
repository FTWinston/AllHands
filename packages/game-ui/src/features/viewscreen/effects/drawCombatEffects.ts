import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { ImpactEffect, ShotEffect, WeaponEffect } from 'common-data/features/space/types/WeaponEffect';
import { getSvgBitmap } from 'common-ui/features/spacemap/utils/svgBitmapCache';
import { getWeaponVisual } from 'common-ui/features/spacemap/utils/weaponVisuals';
import { getBlastSize } from './blastSize';
import { drawCombatLabels, warpedAwayTagDuration } from './drawCombatLabels';
import { drawExplosion, drawWreck, wreckDuration } from './drawExplosion';
import { drawHullHit, drawShieldHit, hullFireDuration } from './drawImpacts';
import { drawBeam, drawDeflector, drawProjectile } from './drawShots';
import { drawWarpAway, warpAwayDuration, warpAwayHideDuration } from './drawWarpAway';
import { getEngineOffset } from './engineOffset';
import { getLayer, glow } from './light';
import { ObjectTracker, TrackedObject, litShipColor } from './objectTracker';
import { findBeamImpact, getEffectSeed, getShotAim } from './shotPaths';

/** How long an effect's shot stays around after it's finished, for what comes after it, in milliseconds. */
const shotLinger = 1200;

const bloomScale = 4;
const bloomBlur = 'blur(5px)';
const bloomStrength = 0.65;

function getExpiry(effect: WeaponEffect) {
    switch (effect.type) {
        case 'shot':
            return effect.startTime + getWeaponVisual(effect.weapon).duration + shotLinger;
        case 'impact':
            return effect.startTime + hullFireDuration;
        case 'warpAway':
            // Kept for as long as its tag shows, and as its ship stays hidden.
            return effect.startTime + Math.max(warpAwayDuration, warpAwayHideDuration, warpedAwayTagDuration);
        default:
            return effect.startTime + wreckDuration;
    }
}

/** Where each projectile was launched from. It keeps flying from there, even if the ship that launched it moves on or is destroyed. */
const launchPoints = new WeakMap<ShotEffect, Vector2D>();

/** Which way each hit came from. It stays that way, however the ships involved move on while it's playing out. */
const contactAngles = new WeakMap<ImpactEffect, number>();

function getContactAngle(impact: ImpactEffect, target: Vector2D, tracker: ObjectTracker) {
    let angle = contactAngles.get(impact);

    if (angle === undefined) {
        const source = tracker.get(impact.sourceId);

        // If whoever fired can't be seen, the hit could have come from anywhere.
        angle = source
            ? Math.atan2(source.y - target.y, source.x - target.x)
            : getEffectSeed(impact) % 628 / 100;

        contactAngles.set(impact, angle);
    }

    return angle;
}

function drawShot(ctx: CanvasRenderingContext2D, shot: ShotEffect, effects: readonly WeaponEffect[], tracker: ObjectTracker, time: number) {
    const source = tracker.get(shot.sourceId);
    const visual = getWeaponVisual(shot.weapon);

    if (!source) {
        return;
    }

    const target = (shot.targetId ? tracker.get(shot.targetId) : undefined) ?? shot.targetPosition;
    const elapsed = time - shot.startTime;

    if (visual.kind === 'projectile') {
        let launch = launchPoints.get(shot);

        if (!launch) {
            launch = { x: source.x, y: source.y };
            launchPoints.set(shot, launch);
        }

        if (elapsed >= 0) {
            drawProjectile(ctx, shot, visual, getShotAim(shot, source, target), launch, time);
        }
    } else if (elapsed >= 0 && elapsed <= visual.duration) {
        const aim = getShotAim(shot, source, target, findBeamImpact(shot, effects));

        if (visual.kind === 'beam') {
            drawBeam(ctx, shot, visual, aim, time);
        } else {
            drawDeflector(ctx, shot, visual, aim, time);
        }
    }
}

function drawImpact(ctx: CanvasRenderingContext2D, impact: ImpactEffect, tracker: ObjectTracker, time: number) {
    const target = tracker.get(impact.targetId);

    if (!target) {
        return;
    }

    const contactAngle = getContactAngle(impact, target, tracker);
    const dt = time - impact.startTime;

    if (impact.damage > 0) {
        drawHullHit(ctx, impact, target, target.isPresent, contactAngle, dt);
    } else {
        drawShieldHit(ctx, target, contactAngle, dt);
    }
}

/** A small, soft glow at the back of a moving ship. */
function drawEngineGlow(ctx: CanvasRenderingContext2D, ship: TrackedObject, time: number) {
    const strength = Math.min(1, ship.speed / 2);

    if (strength > 0.02) {
        const flicker = 0.88 + 0.12 * Math.sin(time * 0.05 + ship.x);
        const engineOffset = getEngineOffset(ship.appearance);
        const x = ship.x - Math.cos(ship.angle) * engineOffset;
        const y = ship.y + Math.sin(ship.angle) * engineOffset;

        glow(ctx, x, y, 0.4 * flicker, '#6ea8ff', 0.25 + strength * 0.45);
    }
}

/** How much light is falling on a ship from nearby explosions and from being hit, from 0 to 1. */
function getLightOnShip(ship: TrackedObject, shipId: string, effects: readonly WeaponEffect[], time: number) {
    let light = 0;

    for (const effect of effects) {
        const dt = time - effect.startTime;

        if (effect.type === 'impact' && effect.targetId === shipId && dt >= 0 && dt < 240) {
            light += (1 - dt / 240) * 0.6;
        } else if (effect.type === 'explosion' && dt >= 0 && dt < 900) {
            const distance = Math.hypot(effect.position.x - ship.x, effect.position.y - ship.y);
            light += (1 - dt / 900) * getBlastSize(effect.appearance) * 6 / (10 + distance * distance);
        }
    }

    return Math.min(1, light);
}

function drawLitShip(ctx: CanvasRenderingContext2D, ship: TrackedObject, light: number) {
    const bitmap = getSvgBitmap(ship.appearance, litShipColor, litShipColor);

    if (bitmap) {
        ctx.save();
        ctx.globalAlpha = light * 0.7;
        ctx.translate(ship.x, ship.y);
        ctx.rotate(-ship.angle);
        ctx.drawImage(bitmap, -1, -1, 2, 2);
        ctx.restore();
    }
}

let vignetteSize = '';

/** A soft darkening towards the corners, to draw the eye inwards. This is only drawn once for each screen size. */
function getVignette(width: number, height: number) {
    const layer = getLayer('combatVignette', width, height);
    const size = `${width}x${height}`;

    if (size !== vignetteSize) {
        vignetteSize = size;

        const ctx = layer.getContext('2d')!;
        const vignette = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.45, width / 2, height / 2, Math.max(width, height) * 0.75);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);
    }

    return layer;
}

/** Draw the given light to the canvas with a bloom around it: a small, blurred copy of it, drawn back over everything. */
function drawWithBloom(ctx: CanvasRenderingContext2D, energy: HTMLCanvasElement) {
    const { width, height } = energy;
    const bloomWidth = Math.ceil(width / bloomScale);
    const bloomHeight = Math.ceil(height / bloomScale);
    const bloom = getLayer('combatBloom', bloomWidth, bloomHeight);
    const bloomCtx = bloom.getContext('2d')!;

    bloomCtx.clearRect(0, 0, bloomWidth, bloomHeight);
    bloomCtx.filter = bloomBlur;
    bloomCtx.drawImage(energy, 0, 0, bloomWidth, bloomHeight);
    bloomCtx.filter = 'none';

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = bloomStrength;
    ctx.drawImage(bloom, 0, 0, width, height);
    ctx.globalAlpha = 1;
    ctx.drawImage(energy, 0, 0);
    ctx.restore();
}

function drawEngineGlows(ctx: CanvasRenderingContext2D, tracker: ObjectTracker, time: number) {
    for (const tracked of tracker.values()) {
        if (tracked.isPresent && tracked.isShip) {
            drawEngineGlow(ctx, tracked, time);
        }
    }
}

/** Draw everything that gives off light. There's only much of that to draw when something's going on, which is when this is needed. */
function drawActiveEffects(ctx: CanvasRenderingContext2D, effects: readonly WeaponEffect[], tracker: ObjectTracker, time: number, allowFlashes: boolean) {
    const { width, height } = ctx.canvas;

    // Wrecks don't give off any light, so they go straight onto the canvas.
    for (const effect of effects) {
        if (effect.type === 'explosion') {
            drawWreck(ctx, effect, time - effect.startTime);
        }
    }

    const energy = getLayer('combatEnergy', width, height);
    const energyCtx = energy.getContext('2d')!;

    energyCtx.setTransform(1, 0, 0, 1, 0, 0);
    energyCtx.clearRect(0, 0, width, height);
    energyCtx.setTransform(ctx.getTransform());
    energyCtx.globalCompositeOperation = 'lighter';

    drawEngineGlows(energyCtx, tracker, time);

    if (allowFlashes) {
        for (const [id, tracked] of tracker) {
            if (tracked.isPresent && tracked.isShip) {
                const light = getLightOnShip(tracked, id, effects, time);

                if (light > 0.01) {
                    drawLitShip(energyCtx, tracked, light);
                }
            }
        }
    }

    for (const effect of effects) {
        if (effect.type === 'shot') {
            drawShot(energyCtx, effect, effects, tracker, time);
        } else if (effect.type === 'impact') {
            drawImpact(energyCtx, effect, tracker, time);
        } else if (effect.type === 'warpAway') {
            drawWarpAway(energyCtx, effect, time - effect.startTime, allowFlashes);
        } else {
            drawExplosion(energyCtx, effect, time - effect.startTime, allowFlashes);
        }
    }

    energyCtx.globalAlpha = 1;
    energyCtx.globalCompositeOperation = 'source-over';

    drawWithBloom(ctx, energy);
}

export type CombatEffectsOptions = {
    /** Show short text labels saying what's going on. */
    showLabels: boolean;
    /** Allow sudden bright flashes. */
    allowFlashes: boolean;
};

/**
 * Draw everything that gives off light in a fight, with a bloom around it, over the ships. Also prunes expired effects.
 * Call this as a `drawExtraForeground` callback on SpaceMap.
 *
 * @param ctx - Canvas context, already in world coordinates
 * @param effects - Mutable array of active effects (expired ones will be pruned)
 * @param tracker - Where objects are, including those that have gone
 * @param time - Current server time
 */
export function drawCombatEffects(ctx: CanvasRenderingContext2D, effects: WeaponEffect[], tracker: ObjectTracker, time: number, options: CombatEffectsOptions) {
    for (let i = effects.length - 1; i >= 0; i--) {
        if (time > getExpiry(effects[i])) {
            effects.splice(i, 1);
        }
    }

    if (effects.length > 0) {
        drawActiveEffects(ctx, effects, tracker, time, options.allowFlashes);
    } else {
        // With nothing going on, all that's left to light up is engines, so there's no need for bloom.
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        drawEngineGlows(ctx, tracker, time);
        ctx.restore();
    }

    const { width, height } = ctx.canvas;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(getVignette(width, height), 0, 0);
    ctx.restore();

    if (options.showLabels) {
        drawCombatLabels(ctx, effects, tracker, time);
    }
}
