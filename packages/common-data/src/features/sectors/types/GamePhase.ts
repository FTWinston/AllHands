/** Game flow phase within a running game; the engine's `GameStatus` covers setup, pause and the end of the game. */
export type GamePhase = 'sectorIntro' | 'map' | 'encounter' | 'sectorOutro';

export type GameOutcome = 'victory' | 'defeat';
