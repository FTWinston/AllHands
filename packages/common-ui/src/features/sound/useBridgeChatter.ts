import { useEffect } from 'react';
import { sounds } from './sounds';

/** Seconds between bursts of chatter, at least and at most. */
const minGap = 3;
const maxGap = 9;

/** While active, play quiet computer chatter every few seconds, so the bridge always sounds busy. */
export function useBridgeChatter(active: boolean) {
    useEffect(() => {
        if (!active) {
            return;
        }

        let timeout: ReturnType<typeof setTimeout>;

        const scheduleNext = () => {
            timeout = setTimeout(() => {
                sounds.bridgeChatter();
                scheduleNext();
            }, (minGap + Math.random() * (maxGap - minGap)) * 1000);
        };

        scheduleNext();

        return () => clearTimeout(timeout);
    }, [active]);
}
