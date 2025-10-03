import { CardProps } from 'common-ui/Card';
import crewStyles from 'common-ui/CrewColors.module.css';
import { Screen } from 'common-ui/Screen';
import { CardHand } from '../../components/CardHand';
import { CrewHeader } from '../../components/CrewHeader';

type Props = {
    cards: CardProps[];
    onPause: () => void;
};

export const EngineerDisplay = (props: Props) => {
    return (
        <Screen className={crewStyles.engineer}>
            <CrewHeader
                crew="engineer"
                onPause={props.onPause}
            />

            <p style={{ textAlign: 'center', padding: '2em' }}>(not implemented yet)</p>

            <CardHand cards={props.cards} />
        </Screen>
    );
};
