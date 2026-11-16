import { Snapshot } from '@colyseus/react';
import { WeaponTargetCardDefinition } from 'common-data/features/cards/types/CardDefinition';
import { CardParameters, CardParametersBase } from 'common-data/features/cards/types/CardParameters';
import { cardDefinitions } from 'common-data/features/cards/utils/cardDefinitions';
import { cumbersomeAimTime } from 'common-data/features/cards/utils/weaponTraitStats';
import { FiringSolution } from 'common-data/features/space/types/FiringSolution';
import { FiringState } from 'common-data/features/space/types/FiringState';
import { WeaponSlotInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getFiringState } from 'common-data/features/space/utils/getFiringState';
import colorPalletes from 'common-ui/ColorPalette.module.css';
import { Button } from 'common-ui/components/Button';
import { DiscreteProgress } from 'common-ui/components/DiscreteProgress';
import { CardBase } from 'common-ui/features/cards/components/CardBase';
import { CardDisplay } from 'common-ui/features/cards/components/CardDisplay';
import { UICardDefinition } from 'common-ui/features/cards/types/UICardDefinition';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { useTimeProvider } from 'common-ui/hooks/useTimeProvider';
import { default as EjectIcon } from 'common-ui/icons/eject.svg?react';
import { ColorPalette } from 'common-ui/types/ColorPalette';
import { resolveParameters } from 'common-ui/types/resolveParameters';
import { classNames } from 'common-ui/utils/classNames';
import { useEffect, useState } from 'react';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import { ActiveCardInfo, useActiveCard } from 'src/features/cardui/components/DragCardProvider';
import { DraggableCard } from 'src/features/cardui/components/DraggableCard';
import { mergeModifiers } from '../utils/mergeModifiers';
import { canChargeWeapon, canPlayOnWeapon, getAimedFor, isWeaponActive } from '../utils/weaponCards';
import styles from './WeaponSlot.module.css';

type Props = Snapshot<WeaponSlotInfo> & {
    /** Counting from 1, shown on the slot while it's empty. */
    slotNumber: number;
    firingSolution: FiringSolution | null;
    /** The id of the ship the firing solution is for, which a cumbersome weapon has to hold its aim on. */
    targetId?: string | null;
    /** Whether weapons can't fire just now (see the Hold Fire card). */
    holdingFire?: boolean;
    /** Whether the helm is holding the ship steady, so that cumbersome weapons needn't hold their aim. */
    aimSteadied?: boolean;
    /** Discard the slotted weapon, losing its charge. */
    onEject?: () => void;
};

// Only weapon and weapon slot cards can be spent as charge, and damaged cards can't be used.
const canSpendOnCharge = (card: ActiveCardInfo) => !card.isDamaged
    && (card.targetType === 'weapon' || card.targetType === 'weapon-slot')
    && !getCardDefinition(card.cardType).traits?.includes('expendable');

function getCardWrapper(props: Props, cardDefinition: UICardDefinition | null, fullyCharged: boolean, canModify: boolean, active: boolean) {
    const { card, modifiers } = props;

    if (!card || !cardDefinition) {
        return (
            <CardDropTarget
                className={styles.emptyCradle}
                targetType="weapon-slot"
                id={props.id}
            >
                <CardBase className={classNames(styles.card, styles.cardSpace)}>
                    <div className={styles.noCardLabel}>{`Weapon slot ${props.slotNumber}`}</div>
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
                    playable={!active}
                />
            </div>
        </CardDropTarget>
    );
}

export const WeaponSlot = (props: Props) => {
    const { id, card, modifiers, charge, decay, firingSolution, modified, hasBeenFullyCharged, aimStartTimes, targetId = null, holdingFire = false, aimSteadied = false, onEject } = props;
    const timeProvider = useTimeProvider();

    // A weapon with a drain that has been fired stays active on its target, draining its charge, and can't be fired again.
    const isActive = isWeaponActive(props);

    const activeCard = useActiveCard();
    const activeCardDefinition = activeCard?.targetType === 'weapon'
        ? cardDefinitions[activeCard.cardType] as WeaponTargetCardDefinition
        : null;

    const slotCardDefinition = card ? getCardDefinition(card.type) : null;

    // While a weapon-target card is being dragged, the weapon only takes it if it can be played here. Otherwise, it takes a modifier while it has none, unless it's energised.
    const canModify = activeCardDefinition !== null
        ? canPlayOnWeapon(activeCardDefinition, { card, modified })
        : canPlayOnWeapon({ targetType: 'weapon' }, { card, modified });

    const slotParameters = slotCardDefinition && card ? resolveParameters(slotCardDefinition.parameters, card.modifiers, modifiers) : {} as CardParameters;

    const aimedFor = getAimedFor({ card, aimStartTimes }, targetId, timeProvider.getServerTime(), aimSteadied);
    const firingState = card && slotCardDefinition
        ? getFiringState(firingSolution, hasBeenFullyCharged, charge, slotParameters, undefined, aimedFor)
        : FiringState.NoWeapon;

    // While a weapon holds its aim, the progress has to be redrawn as time passes.
    const isAiming = firingState === FiringState.Aiming;
    const [, setTick] = useState(0);
    useEffect(() => {
        if (!isAiming) {
            return;
        }

        const interval = setInterval(() => setTick(tick => tick + 1), 100);
        return () => clearInterval(interval);
    }, [isAiming]);

    const isFullyCharged = firingState !== FiringState.NoWeapon
        && firingState !== FiringState.NotCharged;

    const totalCharge = slotParameters['totalCharge'] ?? 0;

    // Mirrors the server: free charging until first full, then only rechargeable weapons, as often as there's room.
    const canBeCharged = canChargeWeapon({ card, charge, hasBeenFullyCharged }, totalCharge);

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
        case FiringState.Aiming:
            statusTitle = 'Aiming';
            statusHint = `Hold aim: ${Math.min(99, Math.floor((aimedFor ?? 0) / cumbersomeAimTime * 100))}%`;
            mainPallete = 'primary';
            break;
        case FiringState.CanFire:
            statusTitle = 'Ready';
            statusHint = 'Drag onto the target';
            mainPallete = 'good';
            break;
    }

    // Weapons that are being held can't fire, whatever else is true of them.
    if (holdingFire && card) {
        statusTitle = 'Holding fire';
        statusHint = 'Weapons are held';
        mainPallete = 'primary';
    }

    // An active weapon is busy with its target, whatever it could otherwise do.
    if (isActive) {
        statusTitle = 'Active';
        if (canBeCharged) {
            statusHint = 'Drop cards to hold';
        } else {
            statusHint = charge >= totalCharge ? 'Fully charged' : 'Running down';
        }
        mainPallete = 'good';
        statusClassName = styles.statusActive;
    }

    return (
        <li className={classNames(styles.slot, colorPalletes[mainPallete], card ? null : styles.empty, mainPallete === 'primary' ? null : styles.alert, firingState === FiringState.CanFire && !isActive && !holdingFire ? styles.ready : null, isActive ? styles.active : null)}>
            <div className={styles.body}>
                {getCardWrapper(props, slotCardDefinition, isFullyCharged, canModify, isActive)}

                <CardDropTarget
                    className={styles.chargeTarget}
                    targetType="any"
                    id={`charge:${id}`}
                    canAcceptCard={canSpendOnCharge}
                    disabled={!canBeCharged}
                >
                    {card
                        ? (
                            <DiscreteProgress
                                className={styles.progress}
                                title="Charge progress"
                                value={charge ?? 0}
                                maxValue={totalCharge}
                                vertical={true}
                                outlineInactiveBlocks={true}
                                decay={decay}
                            />
                        )
                        : <div className={styles.emptyMeter} />}
                </CardDropTarget>
            </div>

            <div className={classNames(styles.status, statusClassName)}>
                <span className={styles.statusText}>
                    <span className={styles.statusTitle}>{statusTitle}</span>
                    <span className={styles.statusHint}>{statusHint}</span>
                </span>

                {slotCardDefinition && (
                    <Button
                        className={styles.ejectButton}
                        palette="danger"
                        icon={<EjectIcon />}
                        onClick={onEject}
                        ariaLabel={`Eject ${slotCardDefinition.name} from weapon slot ${props.slotNumber}`}
                    />
                )}
            </div>
        </li>
    );
};
