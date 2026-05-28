import { MinimalReadonlyMap } from 'src/types/MinimalArray';
import { CardType } from '../utils/cardDefinitions';

export type CardInstance = {
    id: number;
    type: CardType;
    modifiers?: MinimalReadonlyMap<string, number>;
};
