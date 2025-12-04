import { CardType } from 'common-data/utils/cardDefinitions';
import { FC } from 'react';
import { getCardDefinition } from '../utils/getCardDefinition';
import { CardDisplay } from './CardDisplay';

type Props = {
    type: CardType;
    className?: string;
    slotted?: boolean;
    disabled?: boolean;
};

export const Card: FC<Props> = (props) => {
    const definition = getCardDefinition(props.type);

    return (
        <CardDisplay
            {...definition}
            className={props.className}
            slotted={props.slotted}
            disabled={props.disabled}
        />
    );
};
