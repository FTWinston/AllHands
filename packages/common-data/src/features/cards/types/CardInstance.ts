import { IMap } from '@colyseus/react';
import { CardType } from '../utils/cardDefinitions';

export type CardInstance = {
    id: number;
    type: CardType;
    modifiers?: IMap<string, number>;
    highlighted?: boolean;
};
