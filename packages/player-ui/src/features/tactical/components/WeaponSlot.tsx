import { Snapshot } from '@colyseus/react';
import { WeaponTargetCardDefinition } from 'common-data/features/cards/types/CardDefinition';
import { CardParameters, CardParametersBase } from 'common-data/features/cards/types/CardParameters';
import { cardDefinitions } from 'common-data/features/cards/utils/cardDefinitions';
import { FiringSolution } from 'common-data/features/space/types/FiringSolution';
import { FiringState } from 'common-data/features/space/types/FiringState';
import { WeaponSlotInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getFiringState } from 'common-data/features/space/utils/getFiringState';
import colorPalletes from 'common-ui/ColorPalette.module.css';
import { DiscreteProgress } from 'common-ui/components/DiscreteProgress';
import { InfoPopup } from 'common-ui/components/InfoPopup';
import { CardBase } from 'common-ui/features/cards/components/CardBase';
import { CardDisplay } from 'common-ui/features/cards/components/CardDisplay';
import { UICardDefinition } from 'common-ui/features/cards/types/UICardDefinition';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { ColorPalette } from 'common-ui/types/ColorPalette';
import { resolveParameters } from 'common-ui/types/resolveParameters';
import { classNames } from 'common-ui/utils/classNames';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import { useActiveCard } from 'src/features/cardui/components/DragCardProvider';
import { DraggableCard } from 'src/features/cardui/components/DraggableCard';
import { mergeModifiers } from '../utils/mergeModifiers';
import styles from './WeaponSlot.module.css';

type Props = Snapshot<WeaponSlotInfo> & {
    firingSolution: FiringSolution | null;
};

function getCardWrapper(props: Props, cardDefinition: UICardDefinition | null, fullyCharged: boolean) {
    const { card, modifiers, damageType } = props;

    if (!card || !cardDefinition) {
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

    // Build display parameters with damageType: resolved from server override or card definition
    const resolvedDamageType = damageType
        ?? (cardDefinition.targetType === 'weapon-slot' ? cardDefinition.damageType : null);
    const rawParameters = resolvedDamageType
        ? { ...cardDefinition.parameters, damageType: resolvedDamageType }
        : cardDefinition.parameters;
    const parameters = Object.fromEntries(
        Object.entries(rawParameters).filter((entry): entry is [string, number | string] => entry[1] !== null)
    ) as CardParametersBase;

    const mergedModifiers: Record<string, number> = mergeModifiers(card.modifiers, modifiers);

    return (
        <>
            <div className={styles.cardWrapper}>
                <CardDisplay
                    {...cardDefinition}
                    parameters={parameters}
                    className={styles.card}
                    modifiers={mergedModifiers}
                    slotted={true}
                    highlighted={true}
                />
            </div>
            <div className={styles.cardWrapper}>
                <DraggableCard
                    index={0}
                    className={classNames(styles.card, styles.actualCard, fullyCharged ? styles.chargedCard : null)}
                    {...card}
                    modifiers={mergedModifiers}
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

    const activeCard = useActiveCard();
    const activeCardDefinition = activeCard?.targetType === 'weapon'
        ? cardDefinitions[activeCard.cardType] as WeaponTargetCardDefinition
        : null;

    const slotCardDefinition = card ? getCardDefinition(card.type) : null;

    const weaponTraitMismatch = activeCardDefinition !== null
        && slotCardDefinition !== null
        && activeCardDefinition.requiredWeaponTrait !== undefined
        && (slotCardDefinition.traits === undefined || !slotCardDefinition.traits.includes(activeCardDefinition.requiredWeaponTrait));

    const slotParameters = slotCardDefinition && card ? resolveParameters(slotCardDefinition.parameters, card.modifiers, modifiers) : {} as CardParameters;

    const firingState = card && slotCardDefinition
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
            disabled={!card || weaponTraitMismatch}
        >
            {getCardWrapper(props, slotCardDefinition, isFullyCharged)}

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
