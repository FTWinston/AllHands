import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createStoredToggle } from './storedToggle';

const key = 'test.toggle';

describe('createStoredToggle', () => {
    let stored: Map<string, string>;

    beforeEach(() => {
        stored = new Map();
        vi.stubGlobal('localStorage', {
            getItem: (name: string) => stored.get(name) ?? null,
            setItem: (name: string, value: string) => stored.set(name, value),
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it.each([true, false])('starts as the default of %s, until a choice is made', (defaultValue) => {
        expect(createStoredToggle(key, defaultValue).get()).toBe(defaultValue);
        expect(stored.size).toBe(0);
    });

    it.each([true, false])('prefers an earlier choice over a default of %s', (defaultValue) => {
        createStoredToggle(key, defaultValue).set(!defaultValue);

        expect(createStoredToggle(key, defaultValue).get()).toBe(!defaultValue);
    });

    it('remembers a choice that matches the default, so a later change of default won\'t affect it', () => {
        createStoredToggle(key, true).set(true);

        expect(createStoredToggle(key, false).get()).toBe(true);
    });

    it('toggles', () => {
        const toggle = createStoredToggle(key, false);

        toggle.toggle();

        expect(toggle.get()).toBe(true);
    });

    it('falls back on the default if storage is unavailable', () => {
        vi.stubGlobal('localStorage', undefined);

        expect(createStoredToggle(key, true).get()).toBe(true);
    });
});
