import { Button } from 'common-ui/components/Button';
import { Card } from 'common-ui/features/cards/components/Card';
import { default as AntimatterIcon } from 'common-ui/icons/antimatter.svg?react';
import { classNames } from 'common-ui/utils/classNames';
import { FC, useState } from 'react';
import { AntimatterAmount } from 'src/components/AntimatterAmount';
import shopStyles from 'src/features/shop/components/ShopPanel.module.css';
import { OrderDialog } from './OrderDialog';
import styles from './OrderPanel.module.css';
import type { OrdersModel } from '../types/OrdersModel';

/**
 * A panel for work orders, outside of an encounter: at a shop station for another crew member, laid out like a shop with a button to place one,
 * even if the ship can't afford one yet, and once one is placed, the card it was placed for until it's delivered at the next station. Shows nothing otherwise.
 */
export const OrderPanel: FC<OrdersModel> = (props) => {
    const [isDialogOpen, setDialogOpen] = useState(false);

    if (props.pendingOrder) {
        return (
            <section className={styles.panel} aria-label="Pending work order">
                <div className={styles.spec}>
                    <Card type={props.pendingOrder} />
                </div>

                <p className={styles.text}>
                    <strong className={styles.heading}>Work order placed</strong>
                    Cards that work well with this one are arriving at the next station.
                </p>
            </section>
        );
    }

    if (!props.canOrder) {
        return null;
    }

    const canAfford = props.antimatter >= props.price;

    return (
        <section className={classNames(shopStyles.panel, styles.order)} aria-label="Order a card">
            <h2 className={shopStyles.title}>Order a card</h2>

            <p className={shopStyles.instructions}>
                Place a work order for a choice of cards that work well with one of yours, delivered at the next station.
                {!canAfford && (
                    <strong className={shopStyles.blocked}>
                        You need
                        {' '}
                        <AntimatterAmount amount={props.price - props.antimatter} />
                        {' '}
                        more to place one, but you can still see what you could order.
                    </strong>
                )}
            </p>

            <Button
                className={shopStyles.buy}
                onClick={() => setDialogOpen(true)}
                aria-label={`Place order for ${props.price} antimatter`}
                endIcon={<AntimatterIcon />}
            >
                {`Place order ${props.price}`}
            </Button>

            <OrderDialog {...props} isOpen={isDialogOpen} setOpen={setDialogOpen} />
        </section>
    );
};
