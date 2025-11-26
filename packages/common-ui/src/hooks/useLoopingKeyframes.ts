import { getFirstFutureIndex, ITimeProvider, Keyframes } from 'common-types';
import { SetStateAction, useEffect } from 'react';

/** Update the given keyframes, moving past values onto the end and increasing their timestamp, so the given frames loop indefinitely. */
export function useLoopingKeyframes<T>(
    setValue: (value: SetStateAction<Keyframes<T>>) => void,
    timeProvider: ITimeProvider,
    loopDuration: number,
    checkInterval = 1000) {
    useEffect(() => {
        const interval = setInterval(() => {
            setValue((keyframes) => {
                const now = timeProvider.getServerTime();
                const firstFutureIndex = getFirstFutureIndex(keyframes, now);

                if (firstFutureIndex < 2) {
                    return keyframes;
                }

                const moveToEnd = keyframes.splice(0, firstFutureIndex - 2)
                    .map(item => ({ ...item, time: item.time + loopDuration }));

                return [...keyframes, ...moveToEnd];
            });
        }, checkInterval);
        return () => clearInterval(interval);
    }, [timeProvider, loopDuration, checkInterval, setValue]);
};
