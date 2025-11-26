import { CardInstance, CardTargetType } from 'common-types';
import crewStyles from 'common-ui/CrewColors.module.css';
import { Screen } from 'common-ui/components/Screen';
import { ComponentProps } from 'react';
import { DragCardProvider } from 'src/components/DragCardProvider';
import { useRootClassName } from 'src/hooks/useRootClassName';
import { CardHand } from '../../../components/CardHand';
import { CrewHeader } from '../../header';
import { SystemInfo } from './System';
import { SystemList } from './SystemList';

type Props = Omit<ComponentProps<typeof CrewHeader>, 'crew'> & {
    playCard: (cardId: number, targetType: CardTargetType, targetId: string) => void;
    cards: CardInstance[];
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
                    {...headerProps}
                />

                <SystemList systems={systems} />

                <CardHand cards={cards} />
            </DragCardProvider>
        </Screen>
    );
};
