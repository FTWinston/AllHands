import { Room } from '@colyseus/sdk';
import { WeaponEffect } from 'common-data/features/space/types/WeaponEffect';
import { useEffect, useRef } from 'react';

/**
 * Listen for weapon effect messages from the server and maintain a list of active effects.
 * Expired effects are pruned each time a new effect arrives or when read.
 */
export function useWeaponEffects(room: Room | null) {
    const effectsRef = useRef<WeaponEffect[]>([]);

    useEffect(() => {
        if (!room) {
            return;
        }

        const handler = room.onMessage<WeaponEffect>('weaponEffect', (effect) => {
            effectsRef.current.push(effect);
        });

        return () => {
            handler();
            effectsRef.current = [];
        };
    }, [room]);

    return effectsRef;
}
