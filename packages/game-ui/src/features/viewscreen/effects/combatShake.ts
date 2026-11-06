import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { WeaponEffect } from 'common-data/features/space/types/WeaponEffect';
import { getBlastSize } from './blastSize';
import { getEffectSeed } from './shotPaths';

/**
 * How far to shake the view right now, in pixels. Hits on our own ship shake it, more violently the more damage got
 * through, and so do explosions, the nearer and bigger the more so.
 */
export function getCombatShake(effects: readonly WeaponEffect[], ownShipId: string | null, ownPosition: Vector2D, time: number): Vector2D {
    let x = 0;
    let y = 0;

    const add = (effect: WeaponEffect, amplitude: number, decay: number) => {
        const dt = time - effect.startTime;

        if (dt >= 0 && dt <= decay * 6) {
            const seed = getEffectSeed(effect);
            const size = amplitude * Math.exp(-dt / decay);
            x += size * Math.sin(dt * 0.09 + seed);
            y += size * Math.cos(dt * 0.113 + seed * 2);
        }
    };

    for (const effect of effects) {
        if (effect.type === 'impact' && effect.targetId === ownShipId) {
            if (effect.damage > 0) {
                add(effect, Math.min(16, 3 + effect.damage * 1.5), 130);
            } else {
                add(effect, 2, 100);
            }
        } else if (effect.type === 'explosion') {
            const distance = Math.hypot(effect.position.x - ownPosition.x, effect.position.y - ownPosition.y);
            add(effect, getBlastSize(effect.appearance) * 3 * 10 / (10 + distance), 200);
        }
    }

    return { x, y };
}
