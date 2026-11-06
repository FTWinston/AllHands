import { createStoredToggle } from 'common-ui/utils/storedToggle';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('common-ui/utils/storedToggle', () => ({
    createStoredToggle: vi.fn(() => ({})),
}));

async function getShakeAndFlashesDefault(reducedMotion: boolean) {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: reducedMotion }) });

    await import('./combatEffectSettings');

    return vi.mocked(createStoredToggle).mock.calls.find(([key]) => key === 'allhands.shakeAndFlashes')?.[1];
}

describe('shake and flashes setting', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.mocked(createStoredToggle).mockClear();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('defaults to on, normally', async () => {
        expect(await getShakeAndFlashesDefault(false)).toBe(true);
    });

    it('defaults to off, if the operating system is set to reduce motion', async () => {
        expect(await getShakeAndFlashesDefault(true)).toBe(false);
    });
});
