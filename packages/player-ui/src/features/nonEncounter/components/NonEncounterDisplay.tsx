import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { NonEncounterCardInfo } from 'common-data/features/cards/types/NonEncounterCardInfo';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { Screen } from 'common-ui/components/Screen';
import crewStyles from 'common-ui/CrewColors.module.css';
import { ComponentProps, ReactNode } from 'react';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import { CardHand } from 'src/features/cardui/components/CardHand';
import { DragCardProvider } from 'src/features/cardui/components/DragCardProvider';
import { useRootClassName } from 'src/hooks/useRootClassName';
import { CrewHeader } from '../../header';
import { DeliveryPanel } from '../../orders/components/DeliveryPanel';
import { OrderPanel } from '../../orders/components/OrderPanel';
import { ShopPanel } from '../../shop/components/ShopPanel';
import styles from './NonEncounterDisplay.module.css';
import { NonEncounterHand } from './NonEncounterHand';
import type { OrdersModel } from '../../orders/types/OrdersModel';
import type { ShopModel } from '../../shop/types/ShopModel';
import type { Snapshot } from '@colyseus/react';

type Props = ComponentProps<typeof CrewHeader> & {
    /** Cards to offer instead of the crew's usual display; none for crew that only wait on the sector map. */
    cards?: Snapshot<NonEncounterCardInfo[]>;
    playCard?: (cardId: number) => void;
    /** Cards from the crew member's hand that can be played here, e.g. helm's Warp Away card at a station. */
    hand?: Snapshot<CardInstance[]>;
    playHandCard?: (cardId: number, cardType: CardType, targetType: CardTargetType, targetId: string) => void;
    /** The crew member's shop, at a shop station for their role. */
    shop?: ShopModel | null;
    /** The crew member's work orders: placing one at a shop station for another crew member, a pending one, and a delivery to choose from. */
    orders?: OrdersModel | null;
    /** Rendered within the display, e.g. science's long range sensors or tactical's sector message prompt. */
    children?: ReactNode;
};

const noCards: Snapshot<NonEncounterCardInfo[]> = [];
const noHand: Snapshot<CardInstance[]> = [];

/** Replaces a crew's display outside of an encounter, and at a station: a plain background with the usual header, any cards on offer, and any shop. */
export const NonEncounterDisplay = (props: Props) => {
    const { cards = noCards, playCard, hand = noHand, playHandCard, shop, orders, children, ...headerProps } = props;
    const hasDelivery = !!orders && orders.deliveryCards.length > 0;
    const showOrderPanel = !!orders && (orders.pendingOrder !== null || orders.canOrder);

    useRootClassName(crewStyles[headerProps.crew]);

    const dropCard = (cardId: number, cardType: CardType, targetType: CardTargetType, targetId: string) => {
        if (hand.some(card => card.id === cardId)) {
            playHandCard?.(cardId, cardType, targetType, targetId);
        } else {
            playCard?.(cardId);
        }
    };

    return (
        <Screen className={styles.screen}>
            <DragCardProvider onCardDropped={dropCard}>
                <CardDropTarget id="noTarget" targetType="no-target" />

                <CrewHeader {...headerProps} antimatter={shop?.antimatter ?? (orders?.canOrder ? orders.antimatter : undefined)} />

                {(shop || hasDelivery) && (
                    <div className={styles.shop}>
                        {hasDelivery && <DeliveryPanel cards={orders.deliveryCards} takeDelivery={orders.takeDelivery} />}
                        {shop && <ShopPanel {...shop} />}
                    </div>
                )}

                <NonEncounterHand cards={cards} system={headerProps.crew} />

                {/* Every card here costs nothing, as power only matters during an encounter. */}
                <CardHand cards={hand} availablePower={0} />

                {children}

                {/* Between science's long range sensors and helm's route cards. */}
                {showOrderPanel && (
                    <div className={styles.orders}>
                        <OrderPanel {...orders} />
                    </div>
                )}
            </DragCardProvider>
        </Screen>
    );
};
