import NoSleep from 'nosleep.js';
import { useEffect } from 'react';

/**
 * Keep the screen from dimming or locking while this is mounted.
 * Phones load the game over plain http on the local network, where browsers don't offer the Wake Lock API,
 * so NoSleep falls back to playing a tiny silent video. Playing that needs a user gesture, so it's (re)enabled on taps.
 */
export function useWakeLock() {
    useEffect(() => {
        const noSleep = new NoSleep();

        const enable = () => {
            if (!noSleep.isEnabled) {
                noSleep.enable().catch(() => {
                    // Refused, e.g. by battery saver. The screen will just behave as normal, and the next tap tries again.
                });
            }
        };

        enable();
        document.addEventListener('pointerup', enable, { capture: true, passive: true });

        return () => {
            document.removeEventListener('pointerup', enable, { capture: true });
            noSleep.disable();
        };
    }, []);
}
