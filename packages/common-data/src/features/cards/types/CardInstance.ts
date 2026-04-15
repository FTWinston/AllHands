import { CardType } from '../utils/cardDefinitions';
import { CardParameters } from './CardParameters';

export type CardInstance = {
    id: number;
    type: CardType;
    modifiers?: CardParameters;
};
