import { Cooldown } from 'common-types';
import { useEffect, useState } from 'react';

export const useCooldownFraction = (cooldown?: Cooldown) => {
    let startTime: number;
    let endTime: number;

    if (!cooldown) {
        startTime = 0;
        endTime = 0;
    } else {
        startTime = cooldown.startTime;
        endTime = cooldown.endTime;
    }

    let [fraction, setFraction] = useState(0);

    useEffect(() => {
        const updateFraction = () => {
            const now = Date.now();
            if (endTime > now && endTime > startTime && startTime < now) {
                setFraction((now - startTime) / (endTime - startTime));
            } else {
                setFraction(0);
            }
        };

        updateFraction();
        const interval = setInterval(updateFraction, 50);

        return () => clearInterval(interval);
    }, [startTime, endTime]);

    return fraction;
};
