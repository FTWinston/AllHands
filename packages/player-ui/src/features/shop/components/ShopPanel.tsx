import { Button } from 'common-ui/components/Button';
import { Card } from 'common-ui/features/cards/components/Card';
import { FC } from 'react';
import styles from './ShopPanel.module.css';
import type { ShopControl } from '../ShopControl';

/** A station's shop, shown beside the crew member's deck: cards to buy for antimatter, which go to the bottom of the deck. */
export const ShopPanel: FC<ShopControl> = ({ title, cards, price, antimatter, buyCard, closeShop }) => {
    const canAfford = antimatter >= price;

    return (
        <section className={styles.panel} aria-label="Shop">
            <h2 className={styles.title}>{title}</h2>

            <p className={styles.instructions}>
                {`Buy cards for ${price} antimatter each. Bought cards go to the bottom of your deck.`}
                {!canAfford && cards.length > 0 && (
                    <strong className={styles.blocked}>You don&apos;t have enough antimatter to buy any.</strong>
                )}
            </p>

            {cards.length > 0
                ? (
                    <ul className={styles.list} aria-label="Cards for sale">
                        {cards.map(card => (
                            <li key={card.id} className={styles.item}>
                                <Card
                                    type={card.type}
                                    modifiers={card.modifiers}
                                    extraTraits={card.extraTraits}
                                />

                                <Button
                                    className={styles.buy}
                                    palette="good"
                                    disabled={!canAfford}
                                    onClick={() => buyCard(card.id)}
                                >
                                    {`Buy (-${price})`}
                                </Button>
                            </li>
                        ))}
                    </ul>
                )
                : <p className={styles.soldOut}>Sold out.</p>}

            <div className={styles.footer}>
                <Button onClick={closeShop}>Close shop</Button>
                <span className={styles.hint}>Once closed, the shop can&apos;t be reopened.</span>
            </div>
        </section>
    );
};
