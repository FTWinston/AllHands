import { IMap } from '@colyseus/react';
import { CardType } from '../utils/cardDefinitions';
import { CardTrait } from './CardTrait';
import { ExtraTraitType } from './ExtraTraitType';
import { RouteCardInfo } from './RouteCardInfo';

export type CardInstance = {
    id: number;
    type: CardType;
    modifiers?: IMap<string, number>;
    extraTraits?: IMap<CardTrait, ExtraTraitType>;
    /** Only on 'route' cards. */
    route?: RouteCardInfo;
};
