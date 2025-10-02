import { CardProps } from 'common-ui/Card';
import crewStyles from 'common-ui/CrewColors.module.css';
import { Screen } from 'common-ui/Screen';
import { CardHand } from '../../components/CardHand';
import { CrewHeader } from '../../components/CrewHeader';

type Props = {
    cards: CardProps[];
    onPause: () => void;
};

export const SensorsDisplay = (props: Props) => {
    return (
        <Screen className={crewStyles.sensors}>
            <CrewHeader
                crew="sensors"
                onPause={props.onPause}
            />

            <p>(not implemented yet)</p>

            <CardHand cards={props.cards} />
        </Screen>
    );
};
