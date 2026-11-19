import { WeaponEffect } from 'common-data/features/space/types/WeaponEffect';
import { useEffect, useRef, useState } from 'react';
import { addShotResult, getShotOutcome, pruneShotResults, ShotResult, shotResultLifetime } from '../utils/shotResults';
import type { Room } from '@colyseus/sdk';

/**
 * Listen for the weapon effects of the given ship's own shots, and keep the results (hit, absorbed or missed) that are recent enough to show.
 * Each result goes by itself once its time is up.
 */
export function useShotResults(room: Room | null, shipId: string): ShotResult[] {
    const [results, setResults] = useState<ShotResult[]>([]);
    const nextId = useRef(0);

    useEffect(() => {
        if (!room) {
            return;
        }

        const timeouts = new Set<ReturnType<typeof setTimeout>>();

        const stopListening = room.onMessage<WeaponEffect>('weaponEffect', (effect) => {
            const outcome = getShotOutcome(effect, shipId);
            if (!outcome) {
                return;
            }

            const id = nextId.current++;
            setResults(current => addShotResult(current, outcome, Date.now(), id));

            const timeout = setTimeout(() => {
                timeouts.delete(timeout);
                setResults(current => pruneShotResults(current, Date.now()));
            }, shotResultLifetime + 20);
            timeouts.add(timeout);
        });

        return () => {
            stopListening();
            timeouts.forEach(clearTimeout);
            setResults([]);
        };
    }, [room, shipId]);

    return results;
}
