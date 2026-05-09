import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { resolveParameter } from 'common-data/features/cards/utils/resolveParameters';
import { FiringSolution } from 'common-data/features/space/types/FiringSolution';
import { Cooldown } from 'common-data/types/Cooldown';
import colorPalletes from 'common-ui/ColorPalette.module.css';
import { DiscreteProgress } from 'common-ui/components/DiscreteProgress';
import { InfoPopup } from 'common-ui/components/InfoPopup';
import { Card } from 'common-ui/features/cards/components/Card';
import { CardBase } from 'common-ui/features/cards/components/CardBase';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { ColorPalette } from 'common-ui/types/ColorPalette';
import { classNames } from 'common-ui/utils/classNames';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import { DraggableCard } from 'src/features/cardui/components/DraggableCard';
import styles from './WeaponSlot.module.css';

export type SlotProps = {
    id: string;
    card?: CardInstance | null;
    charge: number;
    decay?: Cooldown | null;
    primed: boolean;
};

type Props = SlotProps & {
    firingSolution: FiringSolution | null;
};

function getCardWrapper(props: Props, fullyCharged: boolean) {
    if (!props.card) {
        return (
            <CardDropTarget
                className={styles.cardWrapper}
                targetType="weapon-slot"
                id={props.id}
            >
                <CardBase className={classNames(styles.card, styles.cardSpace)}>
                    <div className={styles.noCardLabel}>Drop weapon card here</div>
                </CardBase>
            </CardDropTarget>
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
            <div className={styles.cardWrapper}>
                <DraggableCard
                    index={0}
                    className={classNames(styles.card, styles.actualCard, fullyCharged ? styles.chargedCard : null)}
                    {...props.card}
                    availablePower={0}
                    targetType="enemy"
                    slotted={true}
                />
            </div>
        </>
    );
}

// TODO: these should be determined from the card.
const maxAngleOffset = Math.PI / 2;
const minTargetAspect = -Math.PI;
const maxTargetAspect = Math.PI;

export const WeaponSlot = (props: Props) => {
    const { card, charge, firingSolution, primed } = props;

    const cardDefinition = card ? getCardDefinition(card.type) : null;
    const maxCharge = cardDefinition?.parameters.cost ?? 0;
    const isFullyCharged = card ? charge >= maxCharge : false;

    let statusText: string;
    let mainPallete: ColorPalette | undefined;
    let statusDisabled = false;
    let statusPallete: ColorPalette | undefined;
    let statusHeading;
    let description;

    if (maxCharge && card && cardDefinition) {
        if (!primed) {
            statusText = 'prime';
            mainPallete = 'primary';
            statusPallete = 'energy';
            statusHeading = 'Unprimed weapon';
            description = <>Drag a non-weapon card onto this slot to prime it with that card's prime effect.</>;
        } else if (charge < maxCharge) {
            statusText = 'charge';
            mainPallete = 'primary';
            statusHeading = 'Charging weapon';
            description = <>Drag non-weapon cards onto this slot to charge it.</>;
        } else if (!firingSolution) {
            statusText = 'no target';
            mainPallete = 'primary';
            statusHeading = 'No target';
            description = <>Weapon is ready, but no target is currently selected.</>;
        } else if (firingSolution.range > resolveParameter('maxRange', cardDefinition.parameters, card.modifiers)) {
            statusText = 'range';
            mainPallete = 'danger';
            statusHeading = 'Out of range';
            description = <>Weapon is ready, but you are too far away from the target.</>;
        } else if (firingSolution.range < resolveParameter('minRange', cardDefinition.parameters, card.modifiers)) {
            statusText = 'range';
            mainPallete = 'danger';
            statusHeading = 'Out of range';
            description = <>Weapon is ready, but you are too close to the target.</>;
        } else if (Math.abs(firingSolution.relativeBearing) > maxAngleOffset) {
            statusText = 'bearing';
            mainPallete = 'danger';
            statusHeading = 'Not facing target';
            description = <>Weapon is ready, but you are not facing the target.</>;
        } else if (firingSolution.targetAspect < minTargetAspect || firingSolution.targetAspect > maxTargetAspect) {
            statusText = 'obscured';
            mainPallete = 'danger';
            statusHeading = 'Vulnerability is obscured';
            description = <>Weapon is ready, but target vulnerability is not visible.</>;
        } else {
            statusText = 'ready';
            mainPallete = 'good';
            statusHeading = 'Active weapon';
            description = <>Drag the weapon card to the enemy to attack them.</>;
        }
    } else {
        statusText = 'equip';
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
            id={props.id}
            disabled={!props.card}
        >
            {getCardWrapper(props, isFullyCharged)}

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
                value={props.charge ?? 0}
                maxValue={props.card ? getCardDefinition(props.card.type).parameters.cost : 0}
                vertical={true}
                decay={props.decay}
            />
        </CardDropTarget>
    );
};
