import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { Cooldown } from 'common-data/types/Cooldown';
import colorPalletes from 'common-ui/ColorPalette.module.css';
import { DiscreteProgress } from 'common-ui/components/DiscreteProgress';
import { InfoPopup } from 'common-ui/components/InfoPopup';
import { Card } from 'common-ui/features/cards/components/Card';
import { CardBase } from 'common-ui/features/cards/components/CardBase';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { ColorPalette } from 'common-ui/types/ColorPalette';
import { classNames } from 'common-ui/utils/classNames';
import { RefObject, useRef, useState } from 'react';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import { DraggableCard } from 'src/features/cardui/components/DraggableCard';
import styles from './WeaponSlot.module.css';

type WeaponProps = {
    card: CardInstance;
    charge: number;
    discharge?: Cooldown | null;
    noFireReason?: string | null;
    primed: boolean;
};

export type SlotProps = {
    name: string;
    weapon: WeaponProps | null;
};

type Props = SlotProps & {
    onFired: () => void;
};

function getCardWrapper(props: Props, fullyCharged: boolean, isHovered: boolean, cardRef: RefObject<HTMLDivElement | null>) {
    if (!props.weapon) {
        return (
            <CardDropTarget
                className={styles.cardWrapper}
                targetType="weapon-slot"
                id={props.name}
            >
                <CardBase className={classNames(styles.card, styles.cardSpace)}>
                    <div className={classNames(styles.noCardLabel, isHovered ? styles.noCardLabelFocused : null)}>Drop weapon card here</div>
                </CardBase>
            </CardDropTarget>
        );
    }

    if (!fullyCharged) {
        return (
            <div ref={cardRef} className={styles.cardWrapper}>
                <Card
                    className={styles.card}
                    {...props.weapon.card}
                    slotted={true}
                    disabled={true}
                    highlighted={isHovered}
                />
            </div>
        );
    }

    return (
        <>
            <div className={styles.cardWrapper}>
                <Card
                    className={styles.card}
                    {...props.weapon.card}
                    slotted={true}
                    highlighted={true}
                />
            </div>
            <div ref={cardRef} className={styles.cardWrapper}>
                <DraggableCard
                    index={0}
                    className={classNames(styles.card, styles.cardExpanded)}
                    {...props.weapon.card}
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
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const maxCharge = props.weapon?.card ? getCardDefinition(props.weapon.card.type).cost : 0;
    const isFullyCharged = props.weapon ? props.weapon.charge >= maxCharge : false;

    let statusText: string;
    let mainPallete: ColorPalette | undefined;
    let statusDisabled = false;
    let statusPallete: ColorPalette | undefined;
    let statusHeading;
    let description;

    if (maxCharge) {
        if (!props.weapon?.primed) {
            statusText = 'prime';
            mainPallete = 'primary';
            statusPallete = 'energy';
            statusHeading = 'Unprimed weapon';
            description = <>Drag a non-weapon card onto this slot to prime it with that card's prime effect.</>;
        } else if (props.weapon.charge < maxCharge) {
            statusText = 'charge';
            mainPallete = 'primary';
            statusHeading = 'Charging weapon';
            description = <>Drag non-weapon cards onto this slot to charge it.</>;
        } else if (props.weapon.noFireReason) {
            statusText = props.weapon.noFireReason;
            mainPallete = 'danger';
            statusHeading = 'Blocked weapon';
            description = <>Weapon is ready, but unable to fire at this enemy.</>;
        } else {
            statusText = 'ready';
            mainPallete = 'good';
            statusHeading = 'Active weapon';
            description = <>Drag the weapon card to the enemy to attack them.</>;
        }
    } else {
        statusText = 'empty';
        mainPallete = 'primary';
        statusDisabled = true;
        statusHeading = 'Empty weapon slot';
        description = <>Drag a weapon card into this slot to equip it.</>;
    }

    return (
        <CardDropTarget
            render="li"
            className={classNames(styles.weaponSlot, colorPalletes[mainPallete], isFullyCharged ? null : styles.recharging)}
            targetType="weapon"
            id={props.name}
            disabled={!props.weapon}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {getCardWrapper(props, isFullyCharged, isHovered, cardRef)}

            <div className={styles.content}>

                <InfoPopup
                    className={classNames(styles.statusIndicator, statusDisabled ? styles.statusDisabled : null, colorPalletes[statusPallete ?? ''])}
                    name={statusHeading}
                    description={description}
                    palette={mainPallete}
                >
                    {statusText}
                </InfoPopup>

                <DiscreteProgress
                    className={styles.progress}
                    title="Charge progress"
                    value={props.weapon?.charge ?? 0}
                    maxValue={props.weapon?.card ? getCardDefinition(props.weapon.card.type).cost : 0}
                    vertical={true}
                />
            </div>
        </CardDropTarget>
    );
};
