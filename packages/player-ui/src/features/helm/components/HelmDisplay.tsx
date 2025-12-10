import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { GameObjectInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ITimeProvider } from 'common-data/features/space/types/ITimeProvider';
import { Keyframes } from 'common-data/features/space/types/Keyframes';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { MinimalArray } from 'common-data/types/MinimalArray';
import { Screen } from 'common-ui/components/Screen';
import crewStyles from 'common-ui/CrewColors.module.css';
import { ComponentProps } from 'react';
import { DragCardProvider } from 'src/features/cardhand/components/DragCardProvider';
import { useRootClassName } from 'src/hooks/useRootClassName';
import { CardHand } from '../../cardhand/components/CardHand';
import { CrewHeader } from '../../header';
import { HelmSpaceMap } from './HelmSpaceMap';

type Props = Omit<ComponentProps<typeof CrewHeader>, 'crew' | 'handSize'> & {
    playCard: (cardId: number, targetType: CardTargetType, targetId: string) => void;
    cards: MinimalArray<CardInstance>;
    center: Keyframes<Vector2D>;
    objects: GameObjectInfo[];
    timeProvider: ITimeProvider;
};

export const HelmDisplay = (props: Props) => {
    const { cards, playCard, center, objects, timeProvider, ...headerProps } = props;

    useRootClassName(crewStyles.helm);

    return (
        <Screen>
            <DragCardProvider onCardDropped={playCard}>
                <CrewHeader
                    crew="helm"
                    handSize={cards.length}
                    {...headerProps}
                />

                <HelmSpaceMap
                    timeProvider={timeProvider}
                    center={center}
                    objects={objects}
                />

                <CardHand cards={cards} />
            </DragCardProvider>
        </Screen>
    );
};
