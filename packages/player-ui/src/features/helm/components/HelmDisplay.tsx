import { CardInstance } from 'common-data/types/CardInstance';
import { CardTargetType } from 'common-data/types/CardTargetType';
import { GameObjectInfo } from 'common-data/types/GameObjectInfo';
import { ITimeProvider } from 'common-data/types/ITimeProvider';
import { Keyframes } from 'common-data/types/Keyframes';
import { Vector2D } from 'common-data/types/Vector2D';
import { Screen } from 'common-ui/components/Screen';
import crewStyles from 'common-ui/CrewColors.module.css';
import { ComponentProps } from 'react';
import { DragCardProvider } from 'src/features/cardhand/components/DragCardProvider';
import { useRootClassName } from 'src/hooks/useRootClassName';
import { CardHand } from '../../cardhand/components/CardHand';
import { CrewHeader } from '../../header';
import { HelmSpaceMap } from './HelmSpaceMap';

type Props = Omit<ComponentProps<typeof CrewHeader>, 'crew'> & {
    playCard: (cardId: number, targetType: CardTargetType, targetId: string) => void;
    cards: CardInstance[];
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
