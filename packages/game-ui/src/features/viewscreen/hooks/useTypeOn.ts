import { useEffect, useState } from 'react';

/** How quickly text is typed on, as if the ship's computer were printing it. */
export const charactersPerSecond = 60;

/**
 * How much of the given text has been "typed" so far, counting up from nothing whenever the text changes.
 * With reduced motion, the whole text shows at once.
 */
export function useTypeOn(text: string): number {
    const [typed, setTyped] = useState(0);

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setTyped(text.length);
            return;
        }

        setTyped(0);
        const started = performance.now();
        let frame = requestAnimationFrame(function tick(now) {
            const count = Math.min(text.length, Math.floor(((now - started) / 1000) * charactersPerSecond));
            setTyped(count);
            if (count < text.length) {
                frame = requestAnimationFrame(tick);
            }
        });

        return () => cancelAnimationFrame(frame);
    }, [text]);

    return typed;
}
