import { CardProps } from 'common-ui/Card';
import crewStyles from 'common-ui/CrewColors.module.css';
import { Screen } from 'common-ui/Screen';
import { ComponentProps } from 'react';
import { CardHand } from '../../components/CardHand';
import { CrewHeader } from '../header';

type Props = Omit<ComponentProps<typeof CrewHeader>, 'crew'> & {
    cards: CardProps[];
};

export const TacticalDisplay = (props: Props) => {
    const { cards, ...headerProps } = props;

    return (
        <Screen className={crewStyles.tactical}>
            <CrewHeader
                crew="tactical"
                {...headerProps}
            />

            <p style={{ textAlign: 'center', padding: '2em' }}>(not implemented yet)</p>

            <CardHand cards={cards} />
        </Screen>
    );
};
