import { CardTrait } from 'common-data/features/cards/types/CardTrait';
import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { FC } from 'react';
import { getCardDefinition } from '../utils/getUiCardDefinition';
import { CardDisplay } from './CardDisplay';

type Props = {
    type: CardType;
    className?: string;
    slotted?: boolean;
    disabled?: boolean;
    damaged?: boolean;
    highlighted?: boolean;
    modifiers?: Partial<Record<string, number>>;
    extraTraits?: Partial<Record<CardTrait, ExtraTraitType>>;
    showTraitDescriptions?: boolean;
};

export const Card: FC<Props> = (props) => {
    const { type, ...otherProps } = props;

    const definition = getCardDefinition(type);

    return <CardDisplay {...definition} {...otherProps} />;
};
