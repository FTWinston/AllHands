import { Button } from 'common-ui/components/Button';
import { Card } from 'common-ui/features/cards/components/Card';
import { CardBack } from 'common-ui/features/cards/components/CardBack';
import { default as AntimatterIcon } from 'common-ui/icons/antimatter.svg?react';
import { classNames } from 'common-ui/utils/classNames';
import { FC, useState } from 'react';
import { AntimatterAmount } from 'src/components/AntimatterAmount';
import { FullScreenDialog } from 'src/components/FullScreenDialog';
import cardGridStyles from 'src/features/cardui/components/CardGrid.module.css';
import { ShopCard } from 'src/features/shop/components/ShopCard';
import styles from './OrderDialog.module.css';
import type { OrdersModel } from '../types/OrdersModel';

type Props = OrdersModel & {
    isOpen: boolean;
    setOpen: (open: boolean) => void;
};

/**
 * Places a work order: first pick a deck card to be the order's spec, then see every card the order could deliver before paying for it.
 * Cards with nothing to match them can't be picked. Possible deliveries the crew hasn't come across yet are shown as unknown designs.
 */
export const OrderDialog: FC<Props> = (props) => {
    const [specCardId, setSpecCardId] = useState<number | null>(null);
    const spec = props.deckCards.find(card => card.id === specCardId);
    const canAfford = props.antimatter >= props.price;

    const setOpen = (open: boolean) => {
        props.setOpen(open);
        if (!open) {
            setSpecCardId(null);
        }
    };

    const pickSpec = (cardId: number) => {
        setSpecCardId(cardId);
        props.previewOrder(cardId);
    };

    return (
        <FullScreenDialog title="Order a card" isOpen={props.isOpen} setOpen={setOpen} bodyClassName={styles.body}>
            <p className={styles.instructions}>
                {spec
                    ? 'You\'ll choose one of three of these at the next station. Cards you don\'t have come first.'
                    : 'Choose a card to order more that work well with it. It stays in your deck.'}
                {!canAfford && (
                    <strong className={styles.blocked}>
                        You need
                        {' '}
                        <AntimatterAmount amount={props.price} />
                        {' '}
                        to place a work order.
                    </strong>
                )}
            </p>

            {spec
                ? (
                    <>
                        <div className={styles.actions}>
                            <Button onClick={() => setSpecCardId(null)}>Choose another card</Button>

                            <Button
                                palette="good"
                                disabled={!canAfford}
                                onClick={() => props.placeOrder(spec.id)}
                                aria-label={`Order for ${props.price} antimatter`}
                                endIcon={<AntimatterIcon />}
                            >
                                {`Order ${props.price}`}
                            </Button>
                        </div>

                        <div className={cardGridStyles.scale}>
                            {props.previewCardId === spec.id
                                ? (
                                    <ul className={classNames(cardGridStyles.grid, cardGridStyles.centred)} aria-label="Possible deliveries">
                                        {props.preview.map((card, index) => (
                                            <li key={card.type ?? `unknown${index}`} className={cardGridStyles.item}>
                                                {card.type
                                                    ? <ShopCard card={{ id: index, type: card.type }} />
                                                    : <CardBack system={props.crew} className={styles.unknown} />}

                                                <span className={classNames(styles.label, card.owned ? styles.owned : null)}>
                                                    {!card.type ? 'Unknown design' : card.owned ? 'In your deck' : 'New'}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )
                                : <p className={styles.instructions}>Checking what could be delivered…</p>}
                        </div>
                    </>
                )
                : (
                    <div className={cardGridStyles.scale}>
                        <ul className={cardGridStyles.grid} aria-label="Deck">
                            {props.deckCards.map((card) => {
                                const orderable = props.orderableCardIds.includes(card.id);

                                return (
                                    <li key={card.id} className={cardGridStyles.item}>
                                        {orderable
                                            ? <ShopCard card={card} />
                                            : <Card type={card.type} modifiers={card.modifiers} extraTraits={card.extraTraits} disabled />}

                                        <Button
                                            disabled={!orderable}
                                            onClick={() => pickSpec(card.id)}
                                        >
                                            {orderable ? 'Choose' : 'No matches'}
                                        </Button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
        </FullScreenDialog>
    );
};
