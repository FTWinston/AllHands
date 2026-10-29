import { Button } from 'common-ui/components/Button';
import { Card } from 'common-ui/features/cards/components/Card';
import { default as AntimatterIcon } from 'common-ui/icons/antimatter.svg?react';
import { FC, useState } from 'react';
import { OrderDialog } from './OrderDialog';
import styles from './OrderPanel.module.css';
import type { OrdersModel } from '../types/OrdersModel';

/**
 * A compact panel for work orders, outside of an encounter: at a shop station for another crew member, a button to place one,
 * and once one is placed, the card it was placed for until it's delivered at the next station. Shows nothing otherwise.
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

    return (
        <section className={styles.panel} aria-label="Work order">
            <p className={styles.text}>
                <strong className={styles.heading}>Work order</strong>
                Pay for a choice of cards that work well with one of yours, delivered at the next station.
            </p>

            <Button
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
