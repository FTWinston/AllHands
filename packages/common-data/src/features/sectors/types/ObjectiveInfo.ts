/**
 * What an encounter asks of the crew. Only the encounter itself decides when that's been met or failed: this is just how it's described.
 * - clear: no hostile ships remain, whether they were destroyed or driven off.
 * - survive: hold out for a set time.
 * - boss: defeat the sector's boss.
 * - protect: keep the named `subject` safe.
 * - shutDown: stop the named `subject`, without destroying it.
 */
export type ObjectiveInfo
    = | { type: 'clear' }
        | { type: 'survive'; durationMs: number }
        | { type: 'boss' }
        | { type: 'protect'; subject: string }
        | { type: 'shutDown'; subject: string };

export type ObjectiveType = ObjectiveInfo['type'];

/** How an encounter ended, other than by losing the ship. Failing one doesn't end the game: the crew just gets nothing for it. */
export type EncounterOutcome = 'success' | 'failure';
