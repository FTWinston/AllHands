import { Snapshot } from '@colyseus/react';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { GameObjectInfo, ScannedEngineerInfo, ScannedHelmInfo, ScannedScienceInfo, ScannedSystemOrderInfo, ScannedTacticalInfo } from 'common-data/features/space/types/GameObjectInfo';
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
    cards: Snapshot<CardInstance[]>;
    targets: Snapshot<GameObjectInfo[]>;
    scannedShipId: string | null;
    systemOrderByTarget: Record<string, ScannedSystemOrderInfo>;
    scannedHelm: Snapshot<ScannedHelmInfo> | null;
    scannedTactical: Snapshot<ScannedTacticalInfo> | null;
    scannedScience: Snapshot<ScannedScienceInfo> | null;
    scannedEngineer: Snapshot<ScannedEngineerInfo> | null;
    modifierSlot: CardType | null;
    substanceSlot: CardType | null;
    deliverySlot: CardType | null;
    deflectorCard: Snapshot<CardInstance> | null;
};

export const ScienceDisplay = (props: Props) => {
    const { cards, playCard, targets, scannedShipId, systemOrderByTarget, modifierSlot, substanceSlot, deliverySlot, deflectorCard, ...headerProps } = props;

    useRootClassName(crewStyles.science);

    return (
        <Screen>
            <CardUI playCard={playCard} cardHand={cards} availablePower={headerProps.power}>
                <CrewHeader
                    crew="science"
                    handSize={cards.length}
                    {...headerProps}
                />

                <ScienceTargetList
                    targets={targets}
                    scannedShipId={scannedShipId}
                    systemOrderByTarget={systemOrderByTarget}
                    scannedHelm={headerProps.scannedHelm}
                    scannedTactical={headerProps.scannedTactical}
                    scannedScience={headerProps.scannedScience}
                    scannedEngineer={headerProps.scannedEngineer}
                />

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
