import { IArray, IMap } from '@colyseus/react';
import { CardType } from '../utils/cardDefinitions';
import { CardTrait } from './CardTrait';

export type CardInstance = {
    id: number;
    type: CardType;
    modifiers?: IMap<string, number>;
    extraTraits?: IArray<CardTrait>;
};
