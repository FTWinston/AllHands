import { ShipHit } from 'common-data/features/ships/types/ShipHit';
import { WeaponEffect } from 'common-data/features/space/types/WeaponEffect';
import { sounds } from 'common-ui/features/sound/sounds';
import { getWeaponVisual } from 'common-ui/features/spacemap/utils/weaponVisuals';
import { useEffect, useRef } from 'react';
import type { Room } from '@colyseus/sdk';
import type { GameOutcome, GamePhase } from 'common-data/features/sectors/types/GamePhase';

/**
 * Play the viewscreen's sound effects: weapons fire, explosions, our ship being hit, moving around the sector map,
 * and the end of the game. The outcome should be null until the game has ended.
 */
export function useViewscreenEffects(room: Room, shipId: string, phase: GamePhase | null, outcome: GameOutcome | null) {
    useEffect(() => room.onMessage<WeaponEffect>('weaponEffect', (effect) => {
        if (effect.type === 'explosion') {
            sounds.explosion();
        } else if (effect.type === 'shot') {
            const isOwnShip = effect.sourceId === shipId;

            if (getWeaponVisual(effect.weapon).kind === 'projectile') {
                sounds.projectileFired(isOwnShip);
            } else {
                sounds.beamFired(isOwnShip);
            }
        }
    }), [room, shipId]);

    useEffect(() => room.onMessage<ShipHit>('shipHit', ({ damage }) => {
        if (damage > 0) {
            sounds.shipHit(damage);
        }
    }), [room]);

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
