import { Snapshot } from '@colyseus/react';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType, EnemyTargetedCardType } from 'common-data/features/cards/utils/cardDefinitions';
import { GameObjectInfo, RelationshipViewer, ScannedEngineerInfo, ScannedHelmInfo, ScannedScienceInfo, ScannedSystemOrderInfo, ScannedTacticalInfo } from 'common-data/features/space/types/GameObjectInfo';
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
    identifiedVulnerability: EnemyTargetedCardType | null;
    scannedHelm: Snapshot<ScannedHelmInfo> | null;
    scannedTactical: Snapshot<ScannedTacticalInfo> | null;
    scannedScience: Snapshot<ScannedScienceInfo> | null;
    scannedEngineer: Snapshot<ScannedEngineerInfo> | null;
    modifierSlot: CardType | null;
    substanceSlot: CardType | null;
    deliverySlot: CardType | null;
    deflectorCard: Snapshot<CardInstance>;
    viewer: RelationshipViewer;
    closeRevealedSystem: () => void;
    unmountDeflectorModifier: () => void;
    unmountDeflectorSubstance: () => void;
    unmountDeflectorDelivery: () => void;
};

export const ScienceDisplay = (props: Props) => {
    const {
        cards, playCard, targets, scannedShipId, systemOrderByTarget, modifierSlot, substanceSlot, deliverySlot,
        deflectorCard, viewer, scannedHelm, scannedTactical, scannedScience, scannedEngineer, identifiedVulnerability,
        closeRevealedSystem, ...headerProps
    } = props;

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
                    identifiedVulnerability={identifiedVulnerability}
                    scannedHelm={scannedHelm}
                    scannedTactical={scannedTactical}
                    scannedScience={scannedScience}
                    scannedEngineer={scannedEngineer}
                    viewer={viewer}
                    closeRevealedSystem={closeRevealedSystem}
                />

                <DeflectorDisplay
                    modifierSlot={modifierSlot}
                    substanceSlot={substanceSlot}
                    deliverySlot={deliverySlot}
                    deflectorCard={deflectorCard}
                    availablePower={headerProps.power}
                    unmountModifier={props.unmountDeflectorModifier}
                    unmountSubstance={props.unmountDeflectorSubstance}
                    unmountDelivery={props.unmountDeflectorDelivery}
                />
            </CardUI>
        </Screen>
    );
};
