import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { canSellFromDeck, cardSellPrice, minDeckSize } from 'common-data/features/ships/utils/antimatter';
import { FC } from 'react';
import { DeckCardList } from './DeckCardList';
import styles from './DeckPanel.module.css';
import type { Snapshot } from '@colyseus/react';

type Props = {
    cards: Snapshot<CardInstance[]>;
    /** At a station, cards can be re-ordered and sold. */
    atStation: boolean;
    moveCard: (cardId: number, toIndex: number) => void;
    sellCard: (cardId: number) => void;
};

/** The content of the "my deck" view: the deck's cards, which at a station can be re-ordered and sold. Can be shown beside other panels, e.g. a shop. */
export const DeckPanel: FC<Props> = ({ cards, atStation, moveCard, sellCard }) => {
    const canSell = canSellFromDeck(cards.length);

    return (
        <section className={styles.panel} aria-label="Deck cards">
            <p className={styles.instructions}>
                {atStation
                    ? (
                        <>
                            Drag cards to change the order you draw them in, or sell cards for
                            {' '}
                            {cardSellPrice}
                            {' '}
                            antimatter each.
                            {!canSell && (
                                <>
                                    {' '}
                                    <strong className={styles.blocked}>
                                        No more cards can be sold: your deck can&apos;t have fewer than
                                        {' '}
                                        {minDeckSize}
                                        {' '}
                                        cards.
                                    </strong>
                                </>
                            )}
                        </>
                    )
                    : 'Cards are drawn in this order. They can be re-ordered or sold at a station.'}
            </p>

            <DeckCardList
                cards={cards}
                onMoveCard={atStation ? moveCard : undefined}
                onSellCard={atStation ? sellCard : undefined}
                sellPrice={cardSellPrice}
                sellDisabled={!canSell}
            />
        </section>
    );
};
