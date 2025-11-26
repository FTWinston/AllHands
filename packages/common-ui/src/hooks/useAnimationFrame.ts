import { useEffect, useState } from 'react';

/** Continually re-render the current component, via repeated calls to useAnimationFrame */
export const useAnimationFrame = () => {
    const [_, setTicker] = useState(false);

    useEffect(() => {
        let frameId: number;
        const loop = () => {
            setTicker(t => !t);
            frameId = requestAnimationFrame(loop);
        };
        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, []);
};
