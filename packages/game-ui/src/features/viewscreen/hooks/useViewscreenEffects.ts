import { ShipHit } from 'common-data/features/ships/types/ShipHit';
import { WeaponEffect } from 'common-data/features/space/types/WeaponEffect';
import { sounds } from 'common-ui/features/sound/sounds';
import { RefObject, useEffect, useRef } from 'react';
import type { Room } from '@colyseus/sdk';
import type { GameOutcome, GamePhase } from 'common-data/features/sectors/types/GamePhase';

/**
 * Play the viewscreen's sound effects: weapons fire, explosions, our ship being hit (which also shakes the element in shakeRef),
 * moving around the sector map, and the end of the game. The outcome should be null until the game has ended.
 */
export function useViewscreenEffects(room: Room, shipId: string, phase: GamePhase | null, outcome: GameOutcome | null, shakeRef: RefObject<HTMLElement | null>) {
    useEffect(() => room.onMessage<WeaponEffect>('weaponEffect', (effect) => {
        const isOwnShip = effect.sourceId === shipId;

        switch (effect.type) {
            case 'beam':
                sounds.beamFired(isOwnShip);
                break;
            case 'projectile':
                sounds.projectileFired(isOwnShip);
                break;
            case 'explosion':
                sounds.explosion();
                break;
        }
    }), [room, shipId]);

    useEffect(() => room.onMessage<ShipHit>('shipHit', ({ damage }) => {
        if (damage > 0) {
            sounds.shipHit(damage);
            shake(shakeRef.current, damage);
        }
    }), [room, shakeRef]);

    usePhaseSounds(phase);

    useEffect(() => {
        if (outcome === 'victory') {
            sounds.victory();
        } else if (outcome === 'defeat') {
            sounds.defeat();
        }
    }, [outcome]);
}

function usePhaseSounds(phase: GamePhase | null) {
    // Starting from null, so the game's opening sector message plays its sound too.
    const previousPhase = useRef<GamePhase | null>(null);

    useEffect(() => {
        const previous = previousPhase.current;
        previousPhase.current = phase;

        if (phase === previous) {
            return;
        }

        if (phase === 'map') {
            sounds.mapShown();
        } else if (phase === 'sectorIntro' || phase === 'sectorOutro') {
            sounds.messageReceived();
        }
    }, [phase]);
}

/** Jolt the element about, more violently for bigger hits. Skipped for anyone who prefers reduced motion. */
function shake(element: HTMLElement | null, damage: number) {
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const distance = Math.min(16, 3 + damage * 1.5);
    const steps = 8;

    const keyframes: { transform: string }[] = [];
    for (let i = 0; i < steps; i++) {
        // Shake less as it settles.
        const scale = distance * (1 - i / steps);
        const x = (Math.random() * 2 - 1) * scale;
        const y = (Math.random() * 2 - 1) * scale;
        keyframes.push({ transform: `translate(${x}px, ${y}px)` });
    }
    keyframes.push({ transform: 'translate(0, 0)' });

    element.animate(keyframes, { duration: 400, easing: 'ease-out' });
}
