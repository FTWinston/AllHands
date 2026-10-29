import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const storageKey = 'allhands.knownCardTypes';

function createStorage(initial: Record<string, string> = {}) {
    const values = new Map(Object.entries(initial));
    return {
        getItem: vi.fn((key: string) => values.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
            values.set(key, value);
        }),
    };
}

/** Import a fresh copy of the module, so it loads from whatever storage is stubbed in. */
async function importKnownCards() {
    vi.resetModules();
    return await import('./knownCardStorage');
}

describe('known cards', () => {
    beforeEach(() => {
        vi.stubGlobal('localStorage', createStorage());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('starts with nothing known', async () => {
        const { getKnownCardTypes } = await importKnownCards();

        expect(getKnownCardTypes().size).toBe(0);
    });

    it('loads known cards from storage, dropping any that are not knowable', async () => {
        vi.stubGlobal('localStorage', createStorage({ [storageKey]: JSON.stringify(['phaserCannon', 'removedCard', 'auxPower', 3]) }));
        const { getKnownCardTypes } = await importKnownCards();

        expect([...getKnownCardTypes()]).toEqual(['phaserCannon']);
    });

    it('ignores invalid stored data', async () => {
        vi.stubGlobal('localStorage', createStorage({ [storageKey]: '{not json' }));
        const { getKnownCardTypes } = await importKnownCards();

        expect(getKnownCardTypes().size).toBe(0);
    });

    it('adds and stores newly known cards, ignoring expendable, campaign and already known cards', async () => {
        const storage = createStorage();
        vi.stubGlobal('localStorage', storage);
        const { addKnownCardTypes, getKnownCardTypes } = await importKnownCards();

        expect(addKnownCardTypes(['phaserCannon', 'auxPower', 'warpAway'])).toBe(true);
        expect(addKnownCardTypes(['phaserCannon', 'auxPower'])).toBe(false);
        expect(addKnownCardTypes(['sweep'])).toBe(true);

        expect([...getKnownCardTypes()]).toEqual(['phaserCannon', 'sweep']);
        expect(storage.setItem).toHaveBeenCalledTimes(2);
        expect(JSON.parse(storage.setItem.mock.lastCall![1])).toEqual(['phaserCannon', 'sweep']);
    });

    it('remembers known cards across sessions', async () => {
        const storage = createStorage();
        vi.stubGlobal('localStorage', storage);

        const first = await importKnownCards();
        first.addKnownCardTypes(['phaserCannon']);

        const second = await importKnownCards();
        expect([...second.getKnownCardTypes()]).toEqual(['phaserCannon']);
    });

    it('still tracks known cards for this session when storage is unavailable', async () => {
        vi.stubGlobal('localStorage', {
            getItem: () => {
                throw new Error('unavailable');
            },
            setItem: () => {
                throw new Error('unavailable');
            },
        });
        const { addKnownCardTypes, getKnownCardTypes } = await importKnownCards();

        expect(getKnownCardTypes().size).toBe(0);
        expect(addKnownCardTypes(['phaserCannon'])).toBe(true);
        expect(getKnownCardTypes().has('phaserCannon')).toBe(true);
    });

    it('gives a new set when it changes, but the same one otherwise', async () => {
        const { addKnownCardTypes, getKnownCardTypes } = await importKnownCards();
        const before = getKnownCardTypes();

        expect(getKnownCardTypes()).toBe(before);
        addKnownCardTypes(['phaserCannon']);
        expect(getKnownCardTypes()).not.toBe(before);
    });
});
