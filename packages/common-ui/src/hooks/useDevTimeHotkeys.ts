import { useEffect } from 'react';
import type { Room } from '@colyseus/sdk';

/** What the dev time hotkeys ask the server to do; the type is also the name of the message sent. */
export type DevTimeHotkeyAction
    = | { type: 'adjustTimeScale'; timeScale: number }
        | { type: 'pause' }
        | { type: 'resume' };

/** The time scales the number keys pick. Keys are matched by position (`code`), so they work on layouts where digits need shift. */
const timeScaleKeys: Record<string, number> = {
    Digit1: 0.25,
    Numpad1: 0.25,
    Digit2: 0.5,
    Numpad2: 0.5,
    Digit3: 1,
    Numpad3: 1,
};

type HotkeyEvent = Pick<KeyboardEvent, 'code' | 'repeat' | 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey' | 'defaultPrevented' | 'target'>;

/** Whether typing here is text entry (or a control that uses these keys itself), so a hotkey would get in the way. */
function isTypingTarget(target: EventTarget | null) {
    const element = target as Partial<HTMLElement> | null;
    const tag = element?.tagName?.toUpperCase();
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || !!element?.isContentEditable;
}

/**
 * What a key press should do, or null if it isn't a dev time hotkey (or shouldn't act right now).
 * `gameStatus` decides whether Space pauses or resumes; it does nothing when the game isn't running or paused.
 */
export function getDevTimeHotkeyAction(event: HotkeyEvent, gameStatus: string): DevTimeHotkeyAction | null {
    if (event.repeat || event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey || isTypingTarget(event.target)) {
        return null;
    }

    const timeScale = timeScaleKeys[event.code];
    if (timeScale !== undefined) {
        return { type: 'adjustTimeScale', timeScale };
    }

    if (event.code === 'Space') {
        if (gameStatus === 'active') {
            return { type: 'pause' };
        }
        if (gameStatus === 'paused') {
            return { type: 'resume' };
        }
    }

    return null;
}

/**
 * Dev tools: 1, 2 and 3 set the time scale to 0.25x, 0.5x and 1x, and Space pauses or resumes, for playtesting from whichever window has focus.
 * Does nothing unless `enabled`. The server only honours the time scale when it has dev tools on too.
 */
export function useDevTimeHotkeys(room: Room | null, enabled: boolean, gameStatus: string) {
    useEffect(() => {
        if (!enabled || !room) {
            return;
        }

        // A focused button clicks when Space is released, which would add to the pause toggle, so swallow that release too.
        let swallowSpaceRelease = false;

        const onKeyDown = (event: KeyboardEvent) => {
            const action = getDevTimeHotkeyAction(event, gameStatus);
            if (!action) {
                return;
            }

            if (event.code === 'Space') {
                event.preventDefault();
                swallowSpaceRelease = true;
            }

            if (action.type === 'adjustTimeScale') {
                room.send(action.type, { timeScale: action.timeScale });
            } else {
                room.send(action.type);
            }
        };

        const onKeyUp = (event: KeyboardEvent) => {
            if (event.code === 'Space' && swallowSpaceRelease) {
                swallowSpaceRelease = false;
                event.preventDefault();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, [room, enabled, gameStatus]);
}
