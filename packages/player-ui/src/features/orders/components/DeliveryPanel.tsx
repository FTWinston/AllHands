import { Snapshot } from '@colyseus/react';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { Button } from 'common-ui/components/Button';
import { classNames } from 'common-ui/utils/classNames';
import { FC } from 'react';
import cardGridStyles from 'src/features/cardui/components/CardGrid.module.css';
import { GridCard } from 'src/features/cardui/components/GridCard';
import shopStyles from 'src/features/shop/components/ShopPanel.module.css';
import styles from './DeliveryPanel.module.css';

type Props = {
    cards: Snapshot<CardInstance[]>;
    takeDelivery: (cardId: number) => void;
};

/**
 * The cards delivered by a crew member's work order, laid out like a shop: they can take one for free, which goes to the bottom of their deck.
 * The delivery is lost if their ship leaves first, and only they are warned of this, so they have to tell the helm to wait.
 */
export const DeliveryPanel: FC<Props> = ({ cards, takeDelivery }) => (
    <section className={classNames(shopStyles.panel, styles.panel, cardGridStyles.scale)} aria-label="Work order delivery">
        <h2 className={shopStyles.title}>Work order delivery</h2>

        <p className={shopStyles.instructions}>
            Choose one card to take for free. It goes to the bottom of your deck.
            <strong className={shopStyles.blocked}>Choose a card before your ship leaves, or your delivery will be lost.</strong>
        </p>

        <ul className={classNames(cardGridStyles.grid, cardGridStyles.centred)} aria-label="Delivered cards">
            {cards.map(card => (
                <li key={card.id} className={cardGridStyles.item}>
                    {/* Its button only shows once it's focused, as it would otherwise be covered by the zoomed-in card. */}
                    <GridCard card={card} action={<Button palette="good" onClick={() => takeDelivery(card.id)}>Take</Button>} />
                </li>
            ))}
        </ul>
    </section>
);
