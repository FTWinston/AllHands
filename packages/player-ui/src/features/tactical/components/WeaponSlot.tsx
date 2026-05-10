import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { resolveParameter } from 'common-data/features/cards/utils/resolveParameters';
import { FiringSolution } from 'common-data/features/space/types/FiringSolution';
import { FiringState } from 'common-data/features/space/types/FiringState';
import { getFiringState } from 'common-data/features/space/utils/getFiringState';
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

export const WeaponSlot = (props: Props) => {
    const { card, charge, firingSolution, primed } = props;

    const cardDefinition = card ? getCardDefinition(card.type) : null;

    // TODO: ensure getFiringState here accounts for SLOT modifiers, as well as card modifiers.
    // (Hopefully they'll have been combined on the backend... right?)
    const firingState = card && cardDefinition
        ? getFiringState(firingSolution, primed, charge, cardDefinition.parameters, card.modifiers)
        : FiringState.NoWeapon;

    const isFullyCharged = firingState !== FiringState.NoWeapon
        && firingState !== FiringState.NotPrimed
        && firingState !== FiringState.NotCharged;

    let statusText: string;
    let mainPallete: ColorPalette | undefined;
    let statusDisabled = false;
    let statusPallete: ColorPalette | undefined;
    let statusHeading;
    let description;

    switch (firingState) {
        case FiringState.NoWeapon:
            statusText = 'equip';
            mainPallete = 'primary';
            statusDisabled = true;
            statusHeading = 'Empty weapon slot';
            description = <>Drag a weapon card into this slot to equip it.</>;
            break;
        case FiringState.NotPrimed:
            statusText = 'prime';
            mainPallete = 'primary';
            statusPallete = 'energy';
            statusHeading = 'Unprimed weapon';
            description = <>Drag a non-weapon card onto this slot to prime it with that card's prime effect.</>;
            break;
        case FiringState.NotCharged:
            statusText = 'charge';
            mainPallete = 'primary';
            statusHeading = 'Charging weapon';
            description = <>Drag non-weapon cards onto this slot to charge it.</>;
            break;
        case FiringState.NoTarget:
            statusText = 'no target';
            mainPallete = 'primary';
            statusHeading = 'No target';
            description = <>Weapon is ready, but no target is currently selected.</>;
            break;
        case FiringState.RangeTooFar:
            statusText = 'range';
            mainPallete = 'danger';
            statusHeading = 'Out of range';
            description = <>Weapon is ready, but you are too far away from the target.</>;
            break;
        case FiringState.RangeTooClose:
            statusText = 'range';
            mainPallete = 'danger';
            statusHeading = 'Out of range';
            description = <>Weapon is ready, but you are too close to the target.</>;
            break;
        case FiringState.RelativeBearingTooWide:
            statusText = 'bearing';
            mainPallete = 'danger';
            statusHeading = 'Not facing target';
            description = <>Weapon is ready, but you are not facing the target.</>;
            break;
        case FiringState.TargetAspectObscured:
            statusText = 'obscured';
            mainPallete = 'danger';
            statusHeading = 'Vulnerability is obscured';
            description = <>Weapon is ready, but target vulnerability is not visible.</>;
            break;
        case FiringState.CanFire:
            statusText = 'ready';
            mainPallete = 'good';
            statusHeading = 'Active weapon';
            description = <>Drag the weapon card to the enemy to attack them.</>;
            break;
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
                /* TODO: this should also account for SLOT modifiers, as well as card modifiers. If they're not already included! */
                maxValue={card && cardDefinition ? resolveParameter('chargeCost', cardDefinition.parameters, card.modifiers) : 0}
                vertical={true}
                decay={props.decay}
            />
        </CardDropTarget>
    );
};
