import { CardInstance } from 'common-types';
import { Card } from 'common-ui/Card';
import { CardBase } from 'common-ui/CardBase';
import { classNames } from 'common-ui/classNames';
import { Button } from 'common-ui/index';
import { getCardDefinition } from 'common-ui/uiCardDefinitions';
import { CardDropTarget } from 'src/components/CardDropTarget';
import { default as DiscardIcon } from '../assets/discard.svg?react';
import { RechargeIndicator } from './RechargeIndicator';
import styles from './WeaponSlot.module.css';

export type SlotProps = {
    name: string;
    costToReactivate?: number;
    card: CardInstance | null;
};

type Props = SlotProps & {
    onFired: () => void;
    onDeactivate: () => void;
};

export const WeaponSlot = (props: Props) => {
    const isRecharging = !!props.costToReactivate;

    const cardDefinition = props.card ? getCardDefinition(props.card.type) : null;

    const rechargeBar = (isRecharging && props.costToReactivate && cardDefinition?.cost) ? (
        <RechargeIndicator current={cardDefinition.cost - props.costToReactivate} max={cardDefinition.cost} />
    ) : null;

    const cardElement = props.card
        ? (
            <Card className={classNames(styles.card, isRecharging ? styles.rechargingCard : null)} {...props.card} slotted={true} />
        )
        : (
            <CardBase className={styles.card}>
                <div className={styles.noCardLabel}>No card</div>
            </CardBase>
        );

    const cardWrapper = props.card
        ? (
            <div className={styles.cardWrapper}>
                {cardElement}
                {rechargeBar}
            </div>
        )
        : (
            <CardDropTarget
                className={styles.cardWrapper}
                targetType="weapon-slot"
                id={props.name}
            >
                {cardElement}
            </CardDropTarget>
        );

    const content = (
        <>
            <div className={styles.slotName}>{props.name}</div>
            {cardWrapper}
            <Button onClick={props.onFired} className={classNames(styles.button, styles.fireButton)} disabled={!props.card || isRecharging}>
                Fire
            </Button>
            <Button onClick={props.onDeactivate} className={classNames(styles.button, styles.discardButton)} disabled={!props.card}>
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
