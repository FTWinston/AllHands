import { CardInstance, CardTargetType } from 'common-types';
import { Screen } from 'common-ui/components/Screen';
import crewStyles from 'common-ui/CrewColors.module.css';
import { ITimeSynchronizer } from 'common-ui/types/ITimeSynchronizer';
import { ComponentProps } from 'react';
import { DragCardProvider } from 'src/components/DragCardProvider';
import { useRootClassName } from 'src/hooks/useRootClassName';
import { CardHand } from '../../../components/CardHand';
import { CrewHeader } from '../../header';
import { HelmSpaceMap } from './HelmSpaceMap';

type Props = Omit<ComponentProps<typeof CrewHeader>, 'crew'> & {
    playCard: (cardId: number, targetType: CardTargetType, targetId: string) => void;
    cards: CardInstance[];
    timeSynchronzier: ITimeSynchronizer;
};

export const HelmDisplay = (props: Props) => {
    const { cards, timeSynchronzier, ...headerProps } = props;

    useRootClassName(crewStyles.helm);

    return (
        <Screen>
            <DragCardProvider onCardDropped={props.playCard}>
                <CrewHeader
                    crew="helm"
                    {...headerProps}
                />

                <HelmSpaceMap
                    timeSynchronizer={timeSynchronzier}
                />

                <CardHand cards={cards} />
            </DragCardProvider>
        </Screen>
    );
};
