import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { MinimalReadonlyArray } from 'common-data/types/MinimalArray';
import { Screen } from 'common-ui/components/Screen';
import crewStyles from 'common-ui/CrewColors.module.css';
import { ComponentProps } from 'react';
import { CardUI } from 'src/features/cardui/components/CardUI';
import { useRootClassName } from 'src/hooks/useRootClassName';
import { CrewHeader } from '../../header';

type Props = Omit<ComponentProps<typeof CrewHeader>, 'crew' | 'handSize'> & {
    playCard: (cardId: number, cardType: CardType, targetType: CardTargetType, targetId: string) => void;
    cards: MinimalReadonlyArray<CardInstance>;
};

export const SensorsDisplay = (props: Props) => {
    const { cards, playCard, ...headerProps } = props;

    useRootClassName(crewStyles.sensors);

    return (
        <Screen>
            <CardUI playCard={playCard} cardHand={cards}>
                <CrewHeader
                    crew="sensors"
                    handSize={cards.length}
                    {...headerProps}
                />

                <p style={{ textAlign: 'center', padding: '2em' }}>(not implemented yet)</p>
            </CardUI>
        </Screen>
    );
};
