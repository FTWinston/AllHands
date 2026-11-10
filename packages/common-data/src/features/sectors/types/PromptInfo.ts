import type { Cooldown } from '../../../types/Cooldown';
import type { IArray } from '@colyseus/react';

/** One of the answers that can be given to a prompt. */
export interface PromptOptionInfo {
    id: string;
    /** What the button for it says, in a couple of words. */
    label: string;
}

/**
 * Something said over comms during an encounter that wants an answer. The viewscreen shows it to the whole bridge,
 * and tactical answers it by picking one of its options. If nobody has by the time it runs out, it's answered for them.
 */
export interface PromptInfo {
    /** Who's asking. */
    speaker: string;
    text: string;
    options: IArray<PromptOptionInfo>;
    /** How long there is to answer, in game time, so a faster clock leaves less time to talk it over. */
    countdown: Cooldown;
}
