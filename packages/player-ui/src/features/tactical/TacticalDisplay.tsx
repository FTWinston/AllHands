import { CardProps } from 'common-ui/Card';
import crewStyles from 'common-ui/CrewColors.module.css';
import { Screen } from 'common-ui/Screen';
import { CardHand } from '../../components/CardHand';
import { CrewHeader } from '../../components/CrewHeader';

type Props = {
    cards: CardProps[];
    onPause: () => void;
};

export const TacticalDisplay = (props: Props) => {
    return (
        <Screen className={crewStyles.tactical}>
            <CrewHeader
                crew="tactical"
                onPause={props.onPause}
            />

            <p style={{ textAlign: 'center', padding: '2em' }}>(not implemented yet)</p>

            <CardHand cards={props.cards} />
        </Screen>
    );
};
