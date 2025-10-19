import { CardProps } from 'common-ui/Card';
import crewStyles from 'common-ui/CrewColors.module.css';
import { Screen } from 'common-ui/Screen';
import { ComponentProps } from 'react';
import { DragCardProvider } from 'src/components/DragCardProvider';
import { useRootClassName } from 'src/hooks/useRootClassName';
import { CardHand } from '../../../components/CardHand';
import { CrewHeader } from '../../header';
import { TargetInfo } from './Target';
import { TargetList } from './TargetList';

type Props = Omit<ComponentProps<typeof CrewHeader>, 'crew'> & {
    cards: CardProps[];
    targets: TargetInfo[];
};

export const TacticalDisplay = (props: Props) => {
    const { cards, targets, ...headerProps } = props;

    const handleCardDropped = (cardId: number, targetId: string | null) => {
        console.log(`dropped card ${cardId} on target ${targetId}`);
    };

    useRootClassName(crewStyles.tactical);

    return (
        <Screen>
            <DragCardProvider onCardDropped={handleCardDropped}>
                <CrewHeader
                    crew="tactical"
                    {...headerProps}
                />

                <TargetList targets={targets} />

                <p style={{ textAlign: 'center', padding: '2em' }}>(not implemented yet)</p>

                <CardHand cards={cards} />
            </DragCardProvider>
        </Screen>
    );
};
