import { Snapshot } from '@colyseus/react';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { Button } from 'common-ui/components/Button';
import { classNames } from 'common-ui/utils/classNames';
import { FC } from 'react';
import cardGridStyles from 'src/features/cardui/components/CardGrid.module.css';
import { GridCard } from 'src/features/cardui/components/GridCard';
import shopStyles from 'src/features/shop/components/ShopPanel.module.css';
import styles from './RewardPanels.module.css';

type Props = {
    cards: Snapshot<CardInstance[]>;
    takeOutfitCard: (cardId: number) => void;
};

/** The cards offered to a crew member at the first sector's outfitting station, laid out like a shop: they take one for free, and the ship can't leave until everyone has. */
export const OutfitPicksPanel: FC<Props> = ({ cards, takeOutfitCard }) => (
    <section className={classNames(shopStyles.panel, styles.outfitting, cardGridStyles.scale)} aria-label="Outfitting">
        <h2 className={shopStyles.title}>Outfitting</h2>

        <p className={shopStyles.instructions}>
            Choose one card to take for free. It goes to the bottom of your deck.
            <strong className={styles.more}>The ship can&apos;t leave until every crew member has chosen.</strong>
        </p>

        <ul className={classNames(cardGridStyles.grid, cardGridStyles.centred)} aria-label="Outfitting cards">
            {cards.map(card => (
                <li key={card.id} className={cardGridStyles.item}>
                    {/* Its button only shows once it's focused, as it would otherwise be covered by the zoomed-in card. */}
                    <GridCard card={card} action={<Button palette="good" onClick={() => takeOutfitCard(card.id)}>Take</Button>} />
                </li>
            ))}
        </ul>
    </section>
);
