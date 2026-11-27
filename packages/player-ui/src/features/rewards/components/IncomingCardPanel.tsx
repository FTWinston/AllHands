import { Snapshot } from '@colyseus/react';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { cardSellPrice } from 'common-data/features/ships/utils/antimatter';
import { Button } from 'common-ui/components/Button';
import { classNames } from 'common-ui/utils/classNames';
import { FC } from 'react';
import cardGridStyles from 'src/features/cardui/components/CardGrid.module.css';
import { GridCard } from 'src/features/cardui/components/GridCard';
import shopStyles from 'src/features/shop/components/ShopPanel.module.css';
import styles from './RewardPanels.module.css';

type Props = {
    card: Snapshot<CardInstance>;
    /** How many cards are waiting for room, including this one. */
    count: number;
    deckCards: Snapshot<CardInstance[]>;
    maxDeckSize: number;
    replaceDeckCard: (cardId: number) => void;
    discardIncomingCard: () => void;
};

/**
 * A card this crew member gained while their deck was full. They replace one of their deck cards with it, or discard it,
 * and either way the card that goes is sold. It waits for as long as it takes, outside of an encounter.
 */
export const IncomingCardPanel: FC<Props> = ({ card, count, deckCards, maxDeckSize, replaceDeckCard, discardIncomingCard }) => (
    <section className={classNames(shopStyles.panel, styles.incoming, cardGridStyles.scale)} aria-label="Deck full">
        <h2 className={shopStyles.title}>Deck full</h2>

        <p className={shopStyles.instructions}>
            {`Your deck holds ${maxDeckSize} cards. Choose a card to replace with this new one, or discard the new one. The card that goes is sold for ${cardSellPrice} antimatter.`}
            {count > 1 && <strong className={styles.more}>{`${count - 1} more waiting after this.`}</strong>}
        </p>

        <div className={styles.newCard}>
            <ul className={classNames(cardGridStyles.grid, styles.single)} aria-label="New card">
                <li className={cardGridStyles.item}>
                    <GridCard card={card} />
                </li>
            </ul>
            <Button palette="danger" outlined onClick={discardIncomingCard}>Discard new card</Button>
        </div>

        <ul className={classNames(cardGridStyles.grid, cardGridStyles.centred)} aria-label="Cards to replace">
            {deckCards.map(deckCard => (
                <li key={deckCard.id} className={cardGridStyles.item}>
                    <GridCard card={deckCard} action={<Button palette="energy" onClick={() => replaceDeckCard(deckCard.id)}>Replace</Button>} />
                </li>
            ))}
        </ul>
    </section>
);
