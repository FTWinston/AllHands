import type { PromptInfo } from './PromptInfo';

/** What's coming in over comms that a ship's crew has to deal with. Only synced to the ship's game client and tactical. */
export interface CommsInfo {
    /** What's being asked, which tactical answers; null when nothing is. */
    prompt: PromptInfo | null;
}
