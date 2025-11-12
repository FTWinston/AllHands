import { CardInstance, CardTargetType, Vulnerability } from 'common-types';
import crewStyles from 'common-ui/CrewColors.module.css';
import { Screen } from 'common-ui/Screen';
import { ComponentProps, useEffect, useMemo, useState } from 'react';
import { DragCardProvider } from 'src/components/DragCardProvider';
import { useRootClassName } from 'src/hooks/useRootClassName';
import { CardHand } from '../../../components/CardHand';
import { CrewHeader } from '../../header';
import { ListTargetInfo, TargetList } from './TargetList';
import { SlotProps, WeaponSlots } from './WeaponSlots';

type SlotPropsNoTarget = Omit<SlotProps, 'currentTargetState'>;

type Props = Omit<ComponentProps<typeof CrewHeader>, 'crew'> & {
    playCard: (cardId: number, targetType: CardTargetType, targetId: string) => void;
    slotFired: (slotIndex: number) => void;
    slotDeactivated: (slotIndex: number) => void;
    cards: CardInstance[];
    slots: SlotPropsNoTarget[];
    targets: ListTargetInfo[];
};

export const TacticalDisplay = (props: Props) => {
    const { cards, slots, targets, ...headerProps } = props;

    useRootClassName(crewStyles.tactical);

    const [currentTarget, setCurrentTarget] = useState<ListTargetInfo | null>(null);
    const [currentVulnerability, setCurrentVulnerability] = useState<Vulnerability | null>(null);

    useEffect(() => {
        if (currentTarget === null) {
            setCurrentVulnerability(null);
        }
    }, [currentTarget]);

    const slotsWithTargetState = useMemo<SlotProps[]>(
        () => slots.map((slot, index) => ({
            ...slot,
            noFireReason: currentTarget?.slotNoFireReasons[index],
        })),
        [currentTarget, slots]
    );

    return (
        <Screen>
            <DragCardProvider onCardDropped={props.playCard}>
                <CrewHeader
                    crew="tactical"
                    {...headerProps}
                />

                <TargetList
                    targets={targets}
                    visibleTarget={currentTarget}
                    onVisibleTargetChange={setCurrentTarget}
                    selectedVulnerability={currentVulnerability}
                    onSelectVulnerability={setCurrentVulnerability}
                />

                <WeaponSlots
                    slots={slotsWithTargetState}
                    onFired={props.slotFired}
                    onDeactivate={props.slotDeactivated}
                />

                <CardHand cards={cards} />
            </DragCardProvider>
        </Screen>
    );
};
