import { Schema, type } from '@colyseus/schema';
import { PromptState } from './PromptState';
import type { CommsInfo } from 'common-data/features/sectors/types/CommsInfo';

/**
 * What's coming in over comms that a player ship's crew has to deal with. It's always there, even when nothing is,
 * as only its viewscreen and tactical are sent it, and a field that's only sent to some clients can't be empty.
 */
export class CommsState extends Schema implements CommsInfo {
    /** What's being asked (see `GameState.prompt`), for the viewscreen to show and tactical to answer; null when nothing is. */
    @type(PromptState) prompt: PromptState | null = null;
}
