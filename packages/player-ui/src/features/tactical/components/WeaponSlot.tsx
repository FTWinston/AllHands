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
import { CardBase } from 'common-ui/features/cards/components/CardBase';
import { CardDisplay } from 'common-ui/features/cards/components/CardDisplay';
import { UICardDefinition } from 'common-ui/features/cards/types/UICardDefinition';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { ColorPalette } from 'common-ui/types/ColorPalette';
import { resolveParameters } from 'common-ui/types/resolveParameters';
import { classNames } from 'common-ui/utils/classNames';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import { ActiveCardInfo, useActiveCard } from 'src/features/cardui/components/DragCardProvider';
import { DraggableCard } from 'src/features/cardui/components/DraggableCard';
import { mergeModifiers } from '../utils/mergeModifiers';
import styles from './WeaponSlot.module.css';

type Props = Snapshot<WeaponSlotInfo> & {
    firingSolution: FiringSolution | null;
};

// Only weapon and weapon slot cards can be spent as charge, and damaged cards can't be used.
const canSpendOnCharge = (card: ActiveCardInfo) => !card.isDamaged
    && (card.targetType === 'weapon' || card.targetType === 'weapon-slot')
    && !getCardDefinition(card.cardType).traits?.includes('expendable');

function getCardWrapper(props: Props, cardDefinition: UICardDefinition | null, fullyCharged: boolean, canModify: boolean) {
    const { card, modifiers } = props;

    if (!card || !cardDefinition) {
        return (
            <CardDropTarget
                className={styles.emptyCradle}
                targetType="weapon-slot"
                id={props.id}
            >
                <CardBase className={classNames(styles.card, styles.cardSpace)}>
                    <div className={styles.noCardLabel}>Drag a weapon card here</div>
                </CardBase>
            </CardDropTarget>
        );
    }

    const parameters = Object.fromEntries(
        Object.entries(cardDefinition.parameters).filter((entry): entry is [string, number] => entry[1] !== null)
    ) as CardParametersBase;

    const mergedModifiers: Record<string, number> = mergeModifiers(card.modifiers, modifiers);

    return (
        <CardDropTarget
            className={styles.cradle}
            targetType="weapon"
            id={props.id}
            disabled={!canModify}
        >
            <div className={styles.cardWrapper}>
                <CardDisplay
                    {...cardDefinition}
                    parameters={parameters}
                    className={styles.card}
                    modifiers={mergedModifiers}
                    extraTraits={card.extraTraits}
                    slotted={true}
                />
            </div>
            <div className={styles.cardWrapper}>
                <DraggableCard
                    index={0}
                    className={classNames(styles.card, styles.actualCard, fullyCharged ? styles.chargedCard : null)}
                    {...card}
                    modifiers={mergedModifiers}
                    extraTraits={card.extraTraits}
                    availablePower={0}
                    targetType="enemy"
                    slotted={true}
                />
            </div>
        </CardDropTarget>
    );
}

export const WeaponSlot = (props: Props) => {
    const { id, card, modifiers, charge, decay, firingSolution, modified, hasBeenFullyCharged } = props;

    const activeCard = useActiveCard();
    const activeCardDefinition = activeCard?.targetType === 'weapon'
        ? cardDefinitions[activeCard.cardType] as WeaponTargetCardDefinition
        : null;

    const slotCardDefinition = card ? getCardDefinition(card.type) : null;

    const weaponTraitMismatch = activeCardDefinition !== null
        && slotCardDefinition !== null
        && !modified
        && activeCardDefinition.requiredWeaponTrait !== undefined
        && (slotCardDefinition.traits === undefined || !slotCardDefinition.traits.includes(activeCardDefinition.requiredWeaponTrait));

    const slotParameters = slotCardDefinition && card ? resolveParameters(slotCardDefinition.parameters, card.modifiers, modifiers) : {} as CardParameters;

    const firingState = card && slotCardDefinition
        ? getFiringState(firingSolution, hasBeenFullyCharged, charge, slotParameters)
        : FiringState.NoWeapon;

    const isFullyCharged = firingState !== FiringState.NoWeapon
        && firingState !== FiringState.NotCharged;

    const totalCharge = slotParameters['totalCharge'] ?? 0;

    // Mirrors the server: free charging until first full, then only rechargeable weapons.
    const canBeCharged = !!card
        && charge < totalCharge
        && (!hasBeenFullyCharged || card.extraTraits?.['rechargeable'] !== undefined);

    let statusTitle: string;
    let statusHint: string;
    let mainPallete: ColorPalette | undefined;
    let statusClassName: string | undefined;

    switch (firingState) {
        case FiringState.NoWeapon:
            statusTitle = 'Empty';
            statusHint = 'Equip a weapon card';
            mainPallete = 'primary';
            statusClassName = styles.statusEmpty;
            break;
        case FiringState.NotCharged:
            mainPallete = 'primary';
            if (canBeCharged && charge === 0 && !modified && !hasBeenFullyCharged) {
                statusTitle = 'Unmodified';
                statusHint = 'Modify, or charge it';
                statusClassName = styles.statusUnmodified;
            } else {
                statusTitle = canBeCharged ? 'Charging' : 'Spent';
                statusHint = canBeCharged ? 'Drop cards on the meter' : 'Can\'t be recharged';
                statusClassName = styles.statusCharging;
            }
            break;
        case FiringState.NoTarget:
            statusTitle = 'No target';
            statusHint = 'Nothing to fire at';
            mainPallete = 'primary';
            break;
        case FiringState.RangeTooFar:
            statusTitle = 'Out of range';
            statusHint = 'Too far away to fire';
            mainPallete = 'danger';
            break;
        case FiringState.RangeTooClose:
            statusTitle = 'Out of range';
            statusHint = 'Too close to fire';
            mainPallete = 'danger';
            break;
        case FiringState.RelativeBearingTooWide:
            statusTitle = 'Not facing';
            statusHint = 'Turn towards the target';
            mainPallete = 'danger';
            break;
        case FiringState.TargetAspectObscured:
            statusTitle = 'Obscured';
            statusHint = 'Target is facing away';
            mainPallete = 'danger';
            break;
        case FiringState.CanFire:
            statusTitle = 'Ready';
            statusHint = 'Drag onto the target';
            mainPallete = 'good';
            break;
    }

    return (
        <li className={classNames(styles.slot, colorPalletes[mainPallete], card ? null : styles.empty, mainPallete === 'primary' ? null : styles.alert)}>
            <div className={styles.body}>
                {getCardWrapper(props, slotCardDefinition, isFullyCharged, !!card && !modified && !weaponTraitMismatch)}

                <CardDropTarget
                    className={styles.chargeTarget}
                    targetType="any"
                    id={`charge:${id}`}
                    canAcceptCard={canSpendOnCharge}
                    disabled={!canBeCharged}
                >
                    <DiscreteProgress
                        className={styles.progress}
                        title="Charge progress"
                        value={charge ?? 0}
                        maxValue={totalCharge}
                        vertical={true}
                        outlineInactiveBlocks={true}
                        decay={decay}
                    />
                </CardDropTarget>
            </div>

            <div className={classNames(styles.status, statusClassName)}>
                <span className={styles.statusTitle}>{statusTitle}</span>
                <span className={styles.statusHint}>{statusHint}</span>
            </div>
        </li>
    );
};
