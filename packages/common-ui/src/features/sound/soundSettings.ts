import { useSyncExternalStore } from 'react';

const storageKey = 'allhands.soundEnabled';

function loadEnabled() {
    try {
        return localStorage.getItem(storageKey) !== 'false';
    } catch {
        return true;
    }
}

let enabled = loadEnabled();
const listeners = new Set<() => void>();

/** Whether sound effects and vibration are enabled on this device. Remembered between sessions. */
export function isSoundEnabled() {
    return enabled;
}

export function setSoundEnabled(value: boolean) {
    enabled = value;

    try {
        localStorage.setItem(storageKey, String(value));
    } catch {
        // Storage can be unavailable, e.g. in private browsing. The setting just won't be remembered.
    }

    for (const listener of listeners) {
        listener();
    }
}

export function toggleSoundEnabled() {
    setSoundEnabled(!enabled);
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function useSoundEnabled() {
    return useSyncExternalStore(subscribe, isSoundEnabled);
}
