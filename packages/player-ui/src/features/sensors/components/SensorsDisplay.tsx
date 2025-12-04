import { CardInstance } from 'common-data/types/CardInstance';
import { CardTargetType } from 'common-data/types/CardTargetType';
import crewStyles from 'common-ui/CrewColors.module.css';
import { Screen } from 'common-ui/components/Screen';
import { ComponentProps } from 'react';
import { DragCardProvider } from 'src/features/cardhand/components/DragCardProvider';
import { useRootClassName } from 'src/hooks/useRootClassName';
import { CardHand } from '../../cardhand/components/CardHand';
import { CrewHeader } from '../../header';

type Props = Omit<ComponentProps<typeof CrewHeader>, 'crew'> & {
    playCard: (cardId: number, targetType: CardTargetType, targetId: string) => void;
    cards: CardInstance[];
};

export const SensorsDisplay = (props: Props) => {
    const { cards, playCard, ...headerProps } = props;

    useRootClassName(crewStyles.sensors);

    return (
        <Screen>
            <DragCardProvider onCardDropped={playCard}>
                <CrewHeader
                    crew="sensors"
                    {...headerProps}
                />

                <p style={{ textAlign: 'center', padding: '2em' }}>(not implemented yet)</p>

                <CardHand cards={cards} />
            </DragCardProvider>
        </Screen>
    );
};
