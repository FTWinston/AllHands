import { type } from '@colyseus/schema';
import { CrewSystemSetupInfo, ScienceSystemInfo } from 'common-data/features/space/types/GameObjectInfo';
import { CardState } from './CardState';
import { CrewSystemState } from './CrewSystemState';
import { GameState } from './GameState';
import { Ship } from './Ship';

export class ScienceState extends CrewSystemState implements ScienceSystemInfo {
    constructor(setup: CrewSystemSetupInfo, gameState: GameState, ship: Ship, getCardId: () => number) {
        super(setup, gameState, ship, getCardId);
    }

    @type(CardState) deflectorCard1: CardState | null = null;
    @type(CardState) deflectorCard2: CardState | null = null;
    @type(CardState) deflectorCard3: CardState | null = null;
}
