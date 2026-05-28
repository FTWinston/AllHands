import { Cooldown } from 'common-data/types/Cooldown';
import { useContext, useEffect, useState } from 'react';
import { TimeProviderContext } from '../contexts/TimeProviderContext';

export const useCooldownFraction = (cooldown?: Cooldown | null) => {
    const timeProvider = useContext(TimeProviderContext);

    if (!timeProvider) {
        throw new Error('useCooldownFraction must be used within a TimeProviderContext.Provider');
    }

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
            const now = timeProvider.getServerTime();
            if (endTime > now && endTime > startTime && startTime < now) {
                setFraction((now - startTime) / (endTime - startTime));
            } else {
                setFraction(0);
            }
        };

        updateFraction();
        const interval = setInterval(updateFraction, 50);

        return () => clearInterval(interval);
    }, [startTime, endTime, timeProvider]);

    return fraction;
};
