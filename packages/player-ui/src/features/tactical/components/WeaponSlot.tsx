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

    return (
        <CardDropTarget
            render="li"
            className={classNames(styles.weaponSlot, props.card ? styles.hasCard : styles.hasNoCard, isTapped ? styles.tapped : null)}
            targetType="weapon"
            id={props.name}
            disabled={!props.card}
        >
            <div className={styles.slotName}>{props.name}</div>
            <CardDropTarget
                className={styles.cardWrapper}
                targetType="weapon-slot"
                id={props.name}
                disabled={!!props.card}
            >
                {props.card
                    ? <Card className={styles.card} {...props.card} slotted={true} cost={isTapped ? props.costToReactivate : undefined} />
                    : (
                        <CardBase className={styles.card}>
                            <div className={styles.noCardLabel}>No card</div>
                        </CardBase>
                    )}
            </CardDropTarget>
            <Button onClick={props.onDeactivate} className={classNames(styles.button, styles.fireButton)} disabled={!props.card || isTapped}>
                Fire
            </Button>

            <Button onClick={props.onDeactivate} className={classNames(styles.button, styles.discardButton)} disabled={!props.card}>
                <DiscardIcon />
            </Button>
        </CardDropTarget>
    );
};
