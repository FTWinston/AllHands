import { IMap } from '@colyseus/react';
import { CardType } from '../utils/cardDefinitions';
import { CardTrait } from './CardTrait';
import { ExtraTraitType } from './ExtraTraitType';

export type CardInstance = {
    id: number;
    type: CardType;
    damaged?: boolean;
    modifiers?: IMap<string, number>;
    extraTraits?: IMap<CardTrait, ExtraTraitType>;
};
