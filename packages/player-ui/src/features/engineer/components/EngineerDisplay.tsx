import { CardProps } from 'common-ui/Card';
import crewStyles from 'common-ui/CrewColors.module.css';
import { Screen } from 'common-ui/Screen';
import { ComponentProps } from 'react';
import { DragCardProvider } from 'src/components/DragCardProvider';
import { CardHand } from '../../../components/CardHand';
import { CrewHeader } from '../../header';

type Props = Omit<ComponentProps<typeof CrewHeader>, 'crew'> & {
    cards: CardProps[];
};

export const EngineerDisplay = (props: Props) => {
    const { cards, ...headerProps } = props;

    const handleCardDropped = (cardId: number, targetId: string | null) => {
        console.log(`dropped card ${cardId} on target ${targetId}`);
    };

    return (
        <Screen className={crewStyles.engineer}>
            <DragCardProvider onCardDropped={handleCardDropped}>
                <CrewHeader
                    crew="engineer"
                    {...headerProps}
                />

                <p style={{ textAlign: 'center', padding: '2em' }}>(not implemented yet)</p>

                <CardHand cards={cards} />
            </DragCardProvider>
        </Screen>
    );
};
