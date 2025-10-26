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
import { SlotProps, WeaponSlots } from './WeaponSlots';

type Props = Omit<ComponentProps<typeof CrewHeader>, 'crew'> & {
    cards: CardProps[];
    slots: SlotProps[];
    targets: TargetInfo[];
};

export const TacticalDisplay = (props: Props) => {
    const { cards, slots, targets, ...headerProps } = props;

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

                <WeaponSlots slots={slots} />

                <CardHand cards={cards} />
            </DragCardProvider>
        </Screen>
    );
};
