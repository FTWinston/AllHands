import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { Button } from 'common-ui/components/Button';
import { Card } from 'common-ui/features/cards/components/Card';
import { CardBase } from 'common-ui/features/cards/components/CardBase';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { classNames } from 'common-ui/utils/classNames';
import { RefObject, useEffect, useRef, useState } from 'react';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import { DraggableCard } from 'src/features/cardui/components/DraggableCard';
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

function getCardWrapper(props: Props, isRecharging: boolean, isFocused: boolean, isHovered: boolean, cardRef: RefObject<HTMLDivElement | null>) {
    if (!props.card) {
        return (
            <CardDropTarget
                className={styles.cardWrapper}
                targetType="weapon-slot"
                id={props.name}
            >
                <CardBase className={classNames(styles.card, styles.cardSpace)}>
                    <div className={classNames(styles.noCardLabel, isHovered ? styles.noCardLabelFocused : null)}>Drop here</div>
                </CardBase>
            </CardDropTarget>
        );
    }

    if (isRecharging) {
        return (
            <div ref={cardRef} className={classNames(styles.cardWrapper, isFocused ? styles.cardExpanded : null)}>
                <Card
                    className={styles.card}
                    {...props.card}
                    slotted={true}
                    disabled={true}
                    highlighted={isHovered}
                    showTraits={isFocused}
                />
            </div>
        );
    }

    return (
        <>
            <div className={styles.cardWrapper}>
                <Card
                    className={styles.card}
                    {...props.card}
                    slotted={true}
                    highlighted={true}
                />
            </div>
            <div ref={cardRef} className={classNames(styles.cardWrapper, isFocused ? styles.cardExpanded : null)}>
                <DraggableCard
                    index={0}
                    className={classNames(styles.card)}
                    {...props.card}
                    availablePower={0}
                    targetType="enemy"
                    slotted={true}
                    highlighted={isHovered}
                />
            </div>
        </>
    );
}

export const WeaponSlot = (props: Props) => {
    const isRecharging = !!props.costToReactivate;
    const [isFocused, setIsFocused] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsFocused(false);
    }, [props.card]);

    const handleFocus = () => {
        const card = cardRef.current;
        if (card) {
            const slot = card.closest(`.${styles.weaponSlot}`);
            if (slot) {
                const slotRect = slot.getBoundingClientRect();
                const cardRect = card.getBoundingClientRect();
                card.style.setProperty('--translate-x', `${slotRect.left - cardRect.left}px`);
                card.style.setProperty('--translate-y', `${slotRect.top - cardRect.top}px`);
            }
        }
        setIsFocused(true);
    };

    const cardWrapper = getCardWrapper(props, isRecharging, isFocused, isHovered, cardRef);

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

    return (
        <CardDropTarget
            render="li"
            className={classNames(styles.weaponSlot, styles.hasCard, isRecharging ? styles.recharging : null)}
            targetType="weapon"
            id={props.name}
            disabled={!props.card}
            tabIndex={0}
            onFocus={handleFocus}
            onBlur={() => setIsFocused(false)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {content}
        </CardDropTarget>
    );
};
