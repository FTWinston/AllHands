import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { MinimalReadonlyArray } from 'common-data/types/MinimalArray';
import { Screen } from 'common-ui/components/Screen';
import crewStyles from 'common-ui/CrewColors.module.css';
import { ComponentProps, useMemo, useState } from 'react';
import { CardUI } from 'src/features/cardui/components/CardUI';
import { useRootClassName } from 'src/hooks/useRootClassName';
import { CrewHeader } from '../../header';
import { ListTargetInfo, TargetList } from './TargetList';
import { SlotProps } from './WeaponSlot';
import { WeaponSlots } from './WeaponSlots';

type Props = Omit<ComponentProps<typeof CrewHeader>, 'crew' | 'handSize'> & {
    playCard: (cardId: number, cardType: CardType, targetType: CardTargetType, targetId: string) => void;
    slotFired: (slotIndex: number) => void;
    cards: MinimalReadonlyArray<CardInstance>;
    slots: SlotProps[];
    targets: ListTargetInfo[];
};

export const TacticalDisplay = (props: Props) => {
    const { cards, slots, playCard, targets, ...headerProps } = props;

    useRootClassName(crewStyles.tactical);

    const [currentTarget, setCurrentTarget] = useState<ListTargetInfo | null>(null);

    const slotsWithTargetState = useMemo<SlotProps[]>(
        () => slots.map((slot, index) => ({
            ...slot,
            noFireReason: currentTarget?.slotNoFireReasons[index],
        })),
        [currentTarget, slots]
    );

    return (
        <Screen>
            <CardUI playCard={playCard} cardHand={cards} availablePower={headerProps.power}>
                <CrewHeader
                    crew="tactical"
                    handSize={cards.length}
                    {...headerProps}
                />

                <TargetList
                    targets={targets}
                    onVisibleTargetChange={setCurrentTarget}
                />

                <WeaponSlots
                    slots={slotsWithTargetState}
                    onFired={props.slotFired}
                />
            </CardUI>
        </Screen>
    );
};
