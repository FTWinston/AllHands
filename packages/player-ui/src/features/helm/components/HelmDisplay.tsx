import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { GameObjectInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ITimeProvider } from 'common-data/features/space/types/ITimeProvider';
import { ReadonlyKeyframes } from 'common-data/features/space/types/Keyframes';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { CardCooldown } from 'common-data/types/Cooldown';
import { MinimalReadonlyArray } from 'common-data/types/MinimalArray';
import { Screen } from 'common-ui/components/Screen';
import crewStyles from 'common-ui/CrewColors.module.css';
import { ComponentProps } from 'react';
import { CardUI } from 'src/features/cardui/components/CardUI';
import { useRootClassName } from 'src/hooks/useRootClassName';
import { CrewHeader } from '../../header';
import { HelmSpaceMap } from './HelmSpaceMap';

type Props = Omit<ComponentProps<typeof CrewHeader>, 'crew' | 'handSize'> & {
    playCard: (cardId: number, cardType: CardType, targetType: CardTargetType, targetId: string) => void;
    cards: MinimalReadonlyArray<CardInstance>;
    center: ReadonlyKeyframes<Vector2D>;
    objects: Record<string, GameObjectInfo>;
    activeManeuver?: CardCooldown | null;
    timeProvider: ITimeProvider;
};

export const HelmDisplay = (props: Props) => {
    const { cards, playCard, center, objects, timeProvider, activeManeuver, ...headerProps } = props;

    useRootClassName(crewStyles.helm);

    return (
        <Screen>
            <CardUI playCard={playCard} cardHand={cards} power={headerProps.power}>
                <CrewHeader
                    crew="helm"
                    handSize={cards.length}
                    {...headerProps}
                />

                <HelmSpaceMap
                    timeProvider={timeProvider}
                    center={center}
                    objects={objects}
                    activeManeuver={activeManeuver}
                />
            </CardUI>
        </Screen>
    );
};
