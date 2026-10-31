import { Button } from 'common-ui/components/Button';
import { default as AntimatterIcon } from 'common-ui/icons/antimatter.svg?react';
import { classNames } from 'common-ui/utils/classNames';
import { FC } from 'react';
import cardGridStyles from 'src/features/cardui/components/CardGrid.module.css';
import { ShopCard } from './ShopCard';
import styles from './ShopPanel.module.css';
import type { ShopModel } from '../types/ShopModel';

/**
 * A station's shop, shown on the crew member's display throughout their stay: cards to buy for antimatter, which go to the bottom of their deck.
 * The ship's antimatter is shown in the crew header.
 */
export const ShopPanel: FC<ShopModel> = ({ cards, price, antimatter, buyCard }) => {
    const canAfford = antimatter >= price;

    return (
        <section className={classNames(styles.panel, cardGridStyles.scale)} aria-label="Buy cards">
            <h2 className={styles.title}>Buy cards</h2>

            <p className={styles.instructions}>
                Bought cards go to the bottom of your deck.
                {!canAfford && cards.length > 0 && (
                    <strong className={styles.blocked}>You don&apos;t have enough antimatter to buy any.</strong>
                )}
            </p>

            {cards.length > 0
                ? (
                    <ul className={classNames(cardGridStyles.grid, cardGridStyles.centred)} aria-label="Cards for sale">
                        {cards.map(card => (
                            <li key={card.id} className={cardGridStyles.item}>
                                <ShopCard card={card} />

                                <Button
                                    className={styles.buy}
                                    palette="good"
                                    disabled={!canAfford}
                                    onClick={() => buyCard(card.id)}
                                    aria-label={`Buy for ${price} antimatter`}
                                    endIcon={<AntimatterIcon />}
                                >
                                    {`Buy ${price}`}
                                </Button>
                            </li>
                        ))}
                    </ul>
                )
                : <p className={styles.soldOut}>Sold out.</p>}
        </section>
    );
};
