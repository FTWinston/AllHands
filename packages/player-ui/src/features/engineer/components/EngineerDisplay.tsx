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
import { SystemInfo } from './System';
import { SystemList } from './SystemList';

type Props = Omit<ComponentProps<typeof CrewHeader>, 'crew' | 'handSize'> & {
    playCard: (cardId: number, targetType: CardTargetType, targetId: string) => void;
    cards: MinimalArray<CardInstance>;
    systems: SystemInfo[];
};

export const EngineerDisplay = (props: Props) => {
    const { cards, systems, playCard, ...headerProps } = props;

    useRootClassName(crewStyles.engineer);

    return (
        <Screen>
            <DragCardProvider onCardDropped={playCard}>
                <CrewHeader
                    crew="engineer"
                    handSize={cards.length}
                    {...headerProps}
                />

                <SystemList systems={systems} />

                <CardHand cards={cards} />
            </DragCardProvider>
        </Screen>
    );
};
