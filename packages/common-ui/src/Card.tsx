import { CardType } from 'common-types';
import { FC } from 'react';
import { CardDisplay } from './CardDisplay';
import { getCardDefinition } from './uiCardDefinitions';

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
