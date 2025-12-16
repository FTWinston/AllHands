import { CardDefinition } from 'common-data/features/cards/types/CardDefinition';

export interface CardFunctionality {
    play: () => void;
}

export type EngineCardDefinition = CardDefinition & CardFunctionality;

export type EngineCardInstance = EngineCardDefinition & {
    id: number;
};
