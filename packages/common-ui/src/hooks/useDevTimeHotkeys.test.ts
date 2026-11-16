import { describe, expect, it } from 'vitest';
import { getDevTimeHotkeyAction } from './useDevTimeHotkeys';

type HotkeyEvent = Parameters<typeof getDevTimeHotkeyAction>[0];

function key(code: string, overrides: Partial<HotkeyEvent> = {}): HotkeyEvent {
    return {
        code,
        repeat: false,
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        shiftKey: false,
        defaultPrevented: false,
        target: null,
        ...overrides,
    };
}

/** Stands in for a focused element, as these tests run without a DOM. */
function element(tagName: string, isContentEditable = false) {
    return { tagName, isContentEditable } as unknown as EventTarget;
}

describe('getDevTimeHotkeyAction', () => {
    it.each([
        ['Digit1', 0.25],
        ['Numpad1', 0.25],
        ['Digit2', 0.5],
        ['Numpad2', 0.5],
        ['Digit3', 1],
        ['Numpad3', 1],
    ])('%s sets the time scale to %s', (code, timeScale) => {
        expect(getDevTimeHotkeyAction(key(code), 'active')).toEqual({ type: 'adjustTimeScale', timeScale });
    });

    it('sets the time scale while paused too', () => {
        expect(getDevTimeHotkeyAction(key('Digit2'), 'paused')).toEqual({ type: 'adjustTimeScale', timeScale: 0.5 });
    });

    it('Space pauses a running game and resumes a paused one', () => {
        expect(getDevTimeHotkeyAction(key('Space'), 'active')).toEqual({ type: 'pause' });
        expect(getDevTimeHotkeyAction(key('Space'), 'paused')).toEqual({ type: 'resume' });
    });

    it.each(['setup', 'ended'])('Space does nothing when the game is in %s', (gameStatus) => {
        expect(getDevTimeHotkeyAction(key('Space'), gameStatus)).toBeNull();
    });

    it('ignores other keys', () => {
        expect(getDevTimeHotkeyAction(key('Digit4'), 'active')).toBeNull();
        expect(getDevTimeHotkeyAction(key('KeyP'), 'active')).toBeNull();
    });

    it.each([
        ['a held key repeating', { repeat: true }],
        ['ctrl', { ctrlKey: true }],
        ['alt', { altKey: true }],
        ['meta', { metaKey: true }],
        ['shift', { shiftKey: true }],
        ['an event something else has handled', { defaultPrevented: true }],
    ] as const)('ignores %s', (_name, overrides) => {
        expect(getDevTimeHotkeyAction(key('Space', overrides), 'active')).toBeNull();
        expect(getDevTimeHotkeyAction(key('Digit1', overrides), 'active')).toBeNull();
    });

    it.each(['input', 'TEXTAREA', 'select'])('ignores keys typed into a %s', (tagName) => {
        expect(getDevTimeHotkeyAction(key('Digit1', { target: element(tagName) }), 'active')).toBeNull();
    });

    it('ignores keys typed into editable content', () => {
        expect(getDevTimeHotkeyAction(key('Space', { target: element('div', true) }), 'active')).toBeNull();
    });

    it('acts when a button has focus', () => {
        expect(getDevTimeHotkeyAction(key('Space', { target: element('BUTTON') }), 'active')).toEqual({ type: 'pause' });
    });
});
