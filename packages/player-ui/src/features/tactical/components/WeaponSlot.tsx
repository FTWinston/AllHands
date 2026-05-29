import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { resolveParameters } from 'common-data/features/cards/utils/resolveParameters';
import { FiringSolution } from 'common-data/features/space/types/FiringSolution';
import { FiringState } from 'common-data/features/space/types/FiringState';
import { WeaponSlotInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getFiringState } from 'common-data/features/space/utils/getFiringState';
import colorPalletes from 'common-ui/ColorPalette.module.css';
import { DiscreteProgress } from 'common-ui/components/DiscreteProgress';
import { InfoPopup } from 'common-ui/components/InfoPopup';
import { CardBase } from 'common-ui/features/cards/components/CardBase';
import { CardDisplay } from 'common-ui/features/cards/components/CardDisplay';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { UICardDefinition } from 'common-ui/features/cards/types/UICardDefinition';
import { ColorPalette } from 'common-ui/types/ColorPalette';
import { classNames } from 'common-ui/utils/classNames';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import { DraggableCard } from 'src/features/cardui/components/DraggableCard';
import styles from './WeaponSlot.module.css';

type Props = WeaponSlotInfo & {
    firingSolution: FiringSolution | null;
};

function getCardWrapper(props: Props, cardDefinition: UICardDefinition | null, fullyCharged: boolean) {
    if (!props.card || !cardDefinition) {
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

    // Build display parameters with damageType override applied
    const parameters = props.damageType
        ? { ...cardDefinition.parameters, damageType: props.damageType } as CardParameters
        : cardDefinition.parameters;

    return (
        <>
            <div className={styles.cardWrapper}>
                <CardDisplay
                    {...cardDefinition}
                    parameters={parameters}
                    className={styles.card}
                    modifiers={props.modifiers}
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
    const { id, card, modifiers, charge, decay, firingSolution, primed } = props;

    const cardDefinition = card ? getCardDefinition(card.type) : null;

    const slotParameters = cardDefinition && card ? resolveParameters(cardDefinition.parameters, card.modifiers, modifiers) : {} as CardParameters;

    const firingState = card && cardDefinition
        ? getFiringState(firingSolution, primed, charge, slotParameters)
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
            statusHeading = 'Target is obscured';
            description = <>Weapon is ready, but target is not facing you.</>;
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
            id={id}
            disabled={!card}
        >
            {getCardWrapper(props, cardDefinition, isFullyCharged)}

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
                value={charge ?? 0}
                maxValue={slotParameters['chargeCost'] ?? 0}
                vertical={true}
                decay={decay}
            />
        </CardDropTarget>
    );
};
