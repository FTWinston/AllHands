import { Screen } from 'common-ui/Screen';
import crewStyles from 'common-ui/CrewColors.module.css';
import { CrewHeader } from '../../components/CrewHeader';
import { CardProps } from 'common-ui/Card';
import { CardHand } from '../../components/CardHand';

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

            <p>(not implemented yet)</p>
            
            <CardHand cards={props.cards} />
        </Screen>
    );
};
