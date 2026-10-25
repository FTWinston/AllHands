import { Button } from 'common-ui/components/Button';
import { Card } from 'common-ui/features/cards/components/Card';
import { FC } from 'react';
import styles from './ShopPanel.module.css';
import type { ShopModel } from '../types/ShopModel';

/**
 * A station's shop, shown on the crew member's display outside of an encounter: cards to buy for antimatter, which go to the bottom of their deck.
 * Once closed, only a button to reopen it is shown.
 */
export const ShopPanel: FC<ShopModel> = ({ title, cards, price, antimatter, isOpen, buyCard, openShop, closeShop }) => {
    const canAfford = antimatter >= price;

    if (!isOpen) {
        return (
            <section className={styles.panel} aria-label="Shop">
                <h2 className={styles.title}>{title}</h2>
                <Button onClick={openShop}>Open shop</Button>
            </section>
        );
    }

    return (
        <section className={styles.panel} aria-label="Shop">
            <h2 className={styles.title}>{title}</h2>

            <p className={styles.instructions}>
                {`Buy cards for ${price} antimatter each. Bought cards go to the bottom of your deck. You have ${antimatter} antimatter.`}
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
            </div>
        </section>
    );
};
