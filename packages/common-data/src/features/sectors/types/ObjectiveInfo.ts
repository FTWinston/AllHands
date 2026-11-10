export type ObjectiveInfo
    = | { type: 'clear' }
        | { type: 'survive'; durationMs: number }
        | { type: 'boss' };

export type ObjectiveType = ObjectiveInfo['type'];

/** How an encounter ended, other than by losing the ship. Failing one doesn't end the game: the crew just gets nothing for it. */
export type EncounterOutcome = 'success' | 'failure';
