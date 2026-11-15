import { Snapshot } from '@colyseus/react';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType, EnemyTargetedCardType } from 'common-data/features/cards/utils/cardDefinitions';
import { GameObjectInfo, RelationshipViewer, ScannedEngineerInfo, ScannedHelmInfo, ScannedHullInfo, ScannedScienceInfo, ScannedSystemOrderInfo, ScannedTacticalInfo } from 'common-data/features/space/types/GameObjectInfo';
import { Screen } from 'common-ui/components/Screen';
import crewStyles from 'common-ui/CrewColors.module.css';
import { ComponentProps, useCallback } from 'react';
import { CardUI } from 'src/features/cardui/components/CardUI';
import { useRootClassName } from 'src/hooks/useRootClassName';
import { CrewHeader } from '../../header';
import { isScienceCardPlayable } from '../utils/isScienceCardPlayable';
import { DeflectorDisplay } from './DeflectorDisplay';
import { InsightMeter } from './InsightMeter';
import { ScienceTargetList } from './ScienceTargetList';

type Props = Omit<ComponentProps<typeof CrewHeader>, 'crew' | 'handSize'> & {
    power: number;
    playCard: (cardId: number, cardType: CardType, targetType: CardTargetType, targetId: string) => void;
    cards: Snapshot<CardInstance[]>;
    targets: Snapshot<GameObjectInfo[]>;
    scannedShipId: string | null;
    systemOrderByTarget: Partial<Record<string, ScannedSystemOrderInfo>>;
    identifiedVulnerability: EnemyTargetedCardType | null;
    scannedHelm: Snapshot<ScannedHelmInfo> | null;
    scannedTactical: Snapshot<ScannedTacticalInfo> | null;
    scannedScience: Snapshot<ScannedScienceInfo> | null;
    scannedEngineer: Snapshot<ScannedEngineerInfo> | null;
    /** The hull of the ship being scanned, if any. */
    scannedHull: ScannedHullInfo | null;
    modifierSlot: CardType | null;
    substanceSlot: CardType | null;
    deliverySlot: CardType | null;
    deflectorCard: Snapshot<CardInstance>;
    viewer: RelationshipViewer;
    /** How much Insight science holds, which some of its cards spend. */
    insight: number;
    closeRevealedSystem: () => void;
    unmountDeflectorModifier: () => void;
    unmountDeflectorSubstance: () => void;
    unmountDeflectorDelivery: () => void;
};

export const ScienceDisplay = (props: Props) => {
    const {
        cards, playCard, targets, scannedShipId, systemOrderByTarget, modifierSlot, substanceSlot, deliverySlot,
        deflectorCard, viewer, scannedHelm, scannedTactical, scannedScience, scannedEngineer, scannedHull, identifiedVulnerability,
        insight, closeRevealedSystem, ...headerProps
    } = props;

    useRootClassName(crewStyles.science);

    const isScanningShip = scannedShipId !== null;
    const isScanningSystem = isScanningShip && (scannedHelm !== null || scannedTactical !== null || scannedScience !== null || scannedEngineer !== null);

    const isCardPlayable = useCallback(
        (card: Snapshot<CardInstance>) => isScienceCardPlayable(card, { insight, isScanningShip, isScanningSystem }),
        [insight, isScanningShip, isScanningSystem]
    );

    return (
        <Screen>
            <CardUI
                playCard={playCard}
                cardHand={cards}
                availablePower={headerProps.power}
                isCardPlayable={isCardPlayable}
            >
                <CrewHeader
                    crew="science"
                    {...headerProps}
                />

                <InsightMeter insight={insight} />

                <ScienceTargetList
                    targets={targets}
                    scannedShipId={scannedShipId}
                    systemOrderByTarget={systemOrderByTarget}
                    identifiedVulnerability={identifiedVulnerability}
                    scannedHelm={scannedHelm}
                    scannedTactical={scannedTactical}
                    scannedScience={scannedScience}
                    scannedEngineer={scannedEngineer}
                    scannedHull={scannedHull}
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
