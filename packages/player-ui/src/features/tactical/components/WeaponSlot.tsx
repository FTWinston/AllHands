import { Card, CardProps } from 'common-ui/Card';
import { CardBase } from 'common-ui/CardBase';
import { classNames } from 'common-ui/classNames';
import { Button } from 'common-ui/index';
import { CardDropTarget } from 'src/components/CardDropTarget';
import { default as DiscardIcon } from '../assets/discard.svg?react';
import styles from './WeaponSlot.module.css';

export type SlotProps = {
    name: string;
    costToReactivate?: number;
    card: CardProps | null;
};

type Props = SlotProps & {
    onFired: () => void;
    onDeactivate: () => void;
};

export const WeaponSlot = (props: Props) => {
    const isTapped = !!props.costToReactivate;

    // Energy charge bar for tapped state
    const energyBar = (props.card && isTapped && props.costToReactivate && props.card.cost) ? (
        <div className={styles.energyBarWrapper}>
            <div
                className={styles.energyBar}
                style={{ width: `${Math.min(100, Math.round((props.costToReactivate / props.card.cost) * 100))}%` }}
            />
            <span className={styles.energyBarLabel}>
                {props.card.cost - props.costToReactivate}
                {' / '}
                {props.card.cost}
            </span>
        </div>
    ) : null;

    const cardElement = props.card
        ? (
            <Card className={classNames(styles.card, isTapped ? styles.tappedCard : null)} {...props.card} slotted={true} />
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
                {energyBar}
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
            <Button onClick={props.onFired} className={classNames(styles.button, styles.fireButton)} disabled={!props.card || isTapped}>
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
                className={classNames(styles.weaponSlot, props.card ? styles.hasCard : styles.hasNoCard, isTapped ? styles.tapped : null)}
                targetType="weapon"
                id={props.name}
            >
                {content}
            </CardDropTarget>
        ) : (
            <li
                className={classNames(styles.weaponSlot, props.card ? styles.hasCard : styles.hasNoCard, isTapped ? styles.tapped : null)}
            >
                {content}
            </li>
        );
};
