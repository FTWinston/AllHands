import { CardProps } from 'common-ui/Card';
import crewStyles from 'common-ui/CrewColors.module.css';
import { Screen } from 'common-ui/Screen';
import { ComponentProps } from 'react';
import { DragCardProvider } from 'src/components/DragCardProvider';
import { useRootClassName } from 'src/hooks/useRootClassName';
import { CardHand } from '../../../components/CardHand';
import { CrewHeader } from '../../header';
import { SystemInfo } from './System';
import { SystemList } from './SystemList';

type Props = Omit<ComponentProps<typeof CrewHeader>, 'crew'> & {
    cards: CardProps[];
    systems: SystemInfo[];
};

export const EngineerDisplay = (props: Props) => {
    const { cards, systems, ...headerProps } = props;

    const handleCardDropped = (cardId: number, targetId: string | null) => {
        console.log(`dropped card ${cardId} on target ${targetId}`);
    };

    useRootClassName(crewStyles.engineer);

    return (
        <Screen>
            <DragCardProvider onCardDropped={handleCardDropped}>
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
