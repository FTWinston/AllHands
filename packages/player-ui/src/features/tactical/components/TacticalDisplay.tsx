import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { GameObjectInfo, TargetVulnerabilities, WeaponSlotInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getFiringSolution } from 'common-data/features/space/utils/getFiringSolution';
import { MinimalReadonlyArray } from 'common-data/types/MinimalArray';
import { Screen } from 'common-ui/components/Screen';
import crewStyles from 'common-ui/CrewColors.module.css';
import { useTimeProvider } from 'common-ui/hooks/useTimeProvider';
import { ComponentProps, useState } from 'react';
import { CardUI } from 'src/features/cardui/components/CardUI';
import { useRootClassName } from 'src/hooks/useRootClassName';
import { CrewHeader } from '../../header';
import { TacticalTargetList } from './TacticalTargetList';
import { WeaponSlots } from './WeaponSlots';

type Props = Omit<ComponentProps<typeof CrewHeader>, 'crew' | 'handSize'> & {
    playCard: (cardId: number, cardType: CardType, targetType: CardTargetType, targetId: string) => void;
    cards: MinimalReadonlyArray<CardInstance>;
    slots: MinimalReadonlyArray<WeaponSlotInfo>;
    shipMotion: GameObjectInfo['motion'];
    targets: MinimalReadonlyArray<GameObjectInfo>;
    vulnerabilitiesByTarget: Record<string, TargetVulnerabilities>;
};

export const TacticalDisplay = (props: Props) => {
    const { cards, slots, playCard, targets, vulnerabilitiesByTarget, ...headerProps } = props;

    useRootClassName(crewStyles.tactical);

    const timeProvider = useTimeProvider();

    const [currentTarget, setCurrentTarget] = useState<GameObjectInfo | null>(null);

    const currentTime = timeProvider.getServerTime();
    const firingSolution = currentTarget === null
        ? null
        : getFiringSolution(props.shipMotion, currentTarget.motion, currentTime);

    return (
        <Screen>
            <CardUI playCard={playCard} cardHand={cards} availablePower={headerProps.power}>
                <CrewHeader
                    crew="tactical"
                    handSize={cards.length}
                    {...headerProps}
                />

                <TacticalTargetList
                    targets={targets}
                    vulnerabilitiesByTarget={vulnerabilitiesByTarget}
                    onVisibleTargetChange={setCurrentTarget}
                    targetAspect={firingSolution?.targetAspect}
                />

                <WeaponSlots slots={slots} firingSolution={firingSolution} />
            </CardUI>
        </Screen>
    );
};
