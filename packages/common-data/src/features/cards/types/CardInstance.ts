import { CardType } from '../utils/cardDefinitions';
import { MinimalReadonlyMap } from 'src/types/MinimalArray';

export type CardInstance = {
    id: number;
    type: CardType;
    modifiers?: MinimalReadonlyMap<string, number>;
};
