import { useSyncExternalStore } from 'react';

/** Make an on/off setting that's remembered on this device between sessions. */
export function createStoredToggle(storageKey: string, defaultValue: boolean) {
    function load() {
        try {
            const stored = localStorage.getItem(storageKey);
            return stored === null ? defaultValue : stored === 'true';
        } catch {
            return defaultValue;
        }
    }

    let value = load();
    const listeners = new Set<() => void>();

    const get = () => value;

    const set = (newValue: boolean) => {
        value = newValue;

        try {
            localStorage.setItem(storageKey, String(newValue));
        } catch {
            // Storage can be unavailable, e.g. in private browsing. The setting just won't be remembered.
        }

        for (const listener of listeners) {
            listener();
        }
    };

    const subscribe = (listener: () => void) => {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    };

    return {
        get,
        set,
        toggle: () => set(!value),
        useValue: () => useSyncExternalStore(subscribe, get),
    };
}
