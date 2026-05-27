import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { GameObjectInfo } from 'common-data/features/space/types/GameObjectInfo';
import { MinimalReadonlyArray } from 'common-data/types/MinimalArray';
import { Screen } from 'common-ui/components/Screen';
import crewStyles from 'common-ui/CrewColors.module.css';
import { ComponentProps } from 'react';
import { CardUI } from 'src/features/cardui/components/CardUI';
import { useRootClassName } from 'src/hooks/useRootClassName';
import { CrewHeader } from '../../header';
import { DeflectorDisplay } from './DeflectorDisplay';
import { ScienceTargetList } from './ScienceTargetList';

type Props = Omit<ComponentProps<typeof CrewHeader>, 'crew' | 'handSize'> & {
    playCard: (cardId: number, cardType: CardType, targetType: CardTargetType, targetId: string) => void;
    cards: MinimalReadonlyArray<CardInstance>;
    targets: MinimalReadonlyArray<GameObjectInfo>;
    modifierSlot: CardType | null;
    substanceSlot: CardType | null;
    deliverySlot: CardType | null;
    deflectorCard: CardInstance | null;
};

export const ScienceDisplay = (props: Props) => {
    const { cards, playCard, targets, modifierSlot, substanceSlot, deliverySlot, deflectorCard, ...headerProps } = props;

    useRootClassName(crewStyles.science);

    return (
        <Screen>
            <CardUI playCard={playCard} cardHand={cards} availablePower={headerProps.power}>
                <CrewHeader
                    crew="science"
                    handSize={cards.length}
                    {...headerProps}
                />

                <ScienceTargetList targets={targets} />

                <DeflectorDisplay
                    modifierSlot={modifierSlot}
                    substanceSlot={substanceSlot}
                    deliverySlot={deliverySlot}
                    deflectorCard={deflectorCard}
                    availablePower={headerProps.power}
                />
            </CardUI>
        </Screen>
    );
};
