import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { MinimalArray } from 'common-data/types/MinimalArray';
import { Screen } from 'common-ui/components/Screen';
import crewStyles from 'common-ui/CrewColors.module.css';
import { ComponentProps } from 'react';
import { DragCardProvider } from 'src/features/cardhand/components/DragCardProvider';
import { useRootClassName } from 'src/hooks/useRootClassName';
import { CardHand } from '../../cardhand/components/CardHand';
import { CrewHeader } from '../../header';

type Props = Omit<ComponentProps<typeof CrewHeader>, 'crew' | 'handSize'> & {
    playCard: (cardId: number, targetType: CardTargetType, targetId: string) => void;
    cards: MinimalArray<CardInstance>;
};

export const SensorsDisplay = (props: Props) => {
    const { cards, playCard, ...headerProps } = props;

    useRootClassName(crewStyles.sensors);

    return (
        <Screen>
            <DragCardProvider onCardDropped={playCard}>
                <CrewHeader
                    crew="sensors"
                    handSize={cards.length}
                    {...headerProps}
                />

                <p style={{ textAlign: 'center', padding: '2em' }}>(not implemented yet)</p>

                <CardHand cards={cards} />
            </DragCardProvider>
        </Screen>
    );
};
