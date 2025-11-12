import { CardInstance } from 'common-types';
import { Card } from 'common-ui/Card';
import { CardBase } from 'common-ui/CardBase';
import { classNames } from 'common-ui/classNames';
import { getCardDefinition } from 'common-ui/getCardDefinition';
import { Button } from 'common-ui/index';
import { CardDropTarget } from 'src/components/CardDropTarget';
import { DraggableCard } from 'src/components/DraggableCard';
import { default as DiscardIcon } from '../assets/discard.svg?react';
import { StatusIndicator } from './StatusIndicator';
import styles from './WeaponSlot.module.css';

export type SlotProps = {
    name: string;
    costToReactivate?: number;
    card: CardInstance | null;
    noFireReason?: string | null;
};

type Props = SlotProps & {
    onFired: () => void;
    onDeactivate: () => void;
};

function getCardWrapper(props: Props, isRecharging: boolean) {
    if (!props.card) {
        return (
            <CardDropTarget
                className={styles.cardWrapper}
                targetType="weapon-slot"
                id={props.name}
            >
                <CardBase className={classNames(styles.card, styles.cardSpace)}>
                    <div className={styles.noCardLabel}>Drop here</div>
                </CardBase>
            </CardDropTarget>
        );
    }

    if (isRecharging) {
        return (
            <div className={styles.cardWrapper}>
                <Card
                    className={styles.card}
                    {...props.card}
                    slotted={true}
                    disabled={true}
                />
            </div>
        );
    }

    return (
        <>
            <div className={styles.cardWrapper}>
                <CardBase className={classNames(styles.card, styles.cardSpace)}>
                    <div className={styles.noCardLabel}>Drop here</div>
                </CardBase>
            </div>
            <div className={styles.cardWrapper}>
                <DraggableCard
                    index={0}
                    className={classNames(styles.card)}
                    {...props.card}
                    targetType="enemy"
                    slotted={true}
                />
            </div>
        </>
    );
}

export const WeaponSlot = (props: Props) => {
    const isRecharging = !!props.costToReactivate;

    const cardWrapper = getCardWrapper(props, isRecharging);

    const content = (
        <>
            <div className={styles.slotName}>{props.name}</div>
            {cardWrapper}
            <StatusIndicator
                className={styles.statusIndicator}
                chargeRemaining={props.costToReactivate}
                totalCharge={props.card ? getCardDefinition(props.card.type).cost : null}
                cannotFireReason={props.noFireReason}
            />
            <Button
                onClick={props.onDeactivate}
                className={styles.discardButton}
                palette="danger"
                title="Remove card"
                disabled={!props.card}
            >
                <DiscardIcon />
            </Button>
        </>
    );

    return props.card
        ? (
            <CardDropTarget
                render="li"
                className={classNames(styles.weaponSlot, styles.hasCard, isRecharging ? styles.recharging : null)}
                targetType="weapon"
                acceptAnyCardType={isRecharging}
                id={props.name}
            >
                {content}
            </CardDropTarget>
        ) : (
            <li
                className={classNames(styles.weaponSlot, styles.hasNoCard)}
            >
                {content}
            </li>
        );
};
