import { CardInstance, CardTargetType, ITimeProvider, Keyframes, MapItem, Vector2D } from 'common-types';
import { Screen } from 'common-ui/components/Screen';
import crewStyles from 'common-ui/CrewColors.module.css';
import { ComponentProps } from 'react';
import { DragCardProvider } from 'src/components/DragCardProvider';
import { useRootClassName } from 'src/hooks/useRootClassName';
import { CardHand } from '../../../components/CardHand';
import { CrewHeader } from '../../header';
import { HelmSpaceMap } from './HelmSpaceMap';

type Props = Omit<ComponentProps<typeof CrewHeader>, 'crew'> & {
    playCard: (cardId: number, targetType: CardTargetType, targetId: string) => void;
    cards: CardInstance[];
    center: Keyframes<Vector2D>;
    mapItems: MapItem[];
    timeProvider: ITimeProvider;
};

export const HelmDisplay = (props: Props) => {
    const { cards, playCard, center, mapItems, timeProvider, ...headerProps } = props;

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
                    items={mapItems}
                />

                <CardHand cards={cards} />
            </DragCardProvider>
        </Screen>
    );
};
