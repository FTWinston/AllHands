/** Game flow phase; independent of the engine's `GameStatus` (setup/active/paused/ended). */
export type GamePhase = 'setup' | 'sectorIntro' | 'map' | 'encounter' | 'sectorOutro' | 'ended';

export type GameOutcome = 'victory' | 'defeat';
