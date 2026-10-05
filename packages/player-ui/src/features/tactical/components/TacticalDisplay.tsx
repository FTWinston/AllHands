import { Snapshot } from '@colyseus/react';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { GameObjectInfo, RelationshipViewer, TargetSubTargets, WeaponSlotInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getFiringSolution } from 'common-data/features/space/utils/getFiringSolution';
import { Screen } from 'common-ui/components/Screen';
import crewStyles from 'common-ui/CrewColors.module.css';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { useTimeProvider } from 'common-ui/hooks/useTimeProvider';
import { ComponentProps, useCallback, useState } from 'react';
import { CardUI } from 'src/features/cardui/components/CardUI';
import { useRootClassName } from 'src/hooks/useRootClassName';
import { CrewHeader } from '../../header';
import { TacticalTargetList } from './TacticalTargetList';
import { WeaponSlots } from './WeaponSlots';

type Props = Omit<ComponentProps<typeof CrewHeader>, 'crew' | 'handSize'> & {
    playCard: (cardId: number, cardType: CardType, targetType: CardTargetType, targetId: string) => void;
    cards: Snapshot<CardInstance[]>;
    slots: Snapshot<WeaponSlotInfo[]>;
    shipMotion: GameObjectInfo['motion'];
    targets: Snapshot<GameObjectInfo[]>;
    subTargetsByTarget: Partial<Record<string, TargetSubTargets>>;
    viewer: RelationshipViewer;
    pendingDrawChoice: Snapshot<CardInstance[]>;
    resolveDrawChoice: (cardId: number) => void;
};

export const TacticalDisplay = (props: Props) => {
    const { cards, slots, playCard, targets, subTargetsByTarget, viewer, pendingDrawChoice, resolveDrawChoice, ...headerProps } = props;

    useRootClassName(crewStyles.tactical);

    const timeProvider = useTimeProvider();

    // Store the index, not the target: snapshots go stale when targets move, die or are replaced.
    const [currentTargetIndex, setCurrentTargetIndex] = useState(0);
    const currentTarget = targets[Math.min(currentTargetIndex, targets.length - 1)] ?? null;

    const currentTime = timeProvider.getServerTime();
    const firingSolution = currentTarget === null
        ? null
        : getFiringSolution(props.shipMotion, currentTarget.motion, currentTime);

    // A card is highlighted if it can prime at least one unprimed weapon slot.
    const isCardHighlighted = useCallback(
        (card: Snapshot<CardInstance>) => {
            const definition = getCardDefinition(card.type);
            if (definition.targetType !== 'weapon') {
                return false;
            }

            const { requiredWeaponTrait } = definition;
            return slots.some((slot) => {
                if (!slot.card || slot.primed) {
                    return false;
                }
                if (requiredWeaponTrait === undefined) {
                    return true;
                }
                return getCardDefinition(slot.card.type).traits?.includes(requiredWeaponTrait) ?? false;
            });
        },
        [slots]
    );

    return (
        <Screen>
            <CardUI
                playCard={playCard}
                cardHand={cards}
                availablePower={headerProps.power}
                pendingDrawChoice={pendingDrawChoice}
                resolveDrawChoice={resolveDrawChoice}
                isCardHighlighted={isCardHighlighted}
            >
                <CrewHeader
                    crew="tactical"
                    {...headerProps}
                />

                <TacticalTargetList
                    targets={targets}
                    subTargetsByTarget={subTargetsByTarget}
                    onVisibleTargetChange={setCurrentTargetIndex}
                    targetAspect={firingSolution?.targetAspect}
                    viewer={viewer}
                />

                <WeaponSlots slots={slots} firingSolution={firingSolution} />
            </CardUI>
        </Screen>
    );
};
