import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { default as EjectIcon } from 'common-ui/icons/eject.svg?react';
import { classNames } from 'common-ui/utils/classNames';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import { ActiveCardInfo } from 'src/features/cardui/components/DragCardProvider';
import styles from './DeflectorSlot.module.css';

type Props = {
    cardType: CardType | null;
    slotType: 'deflectorModifier' | 'deflectorSubstance' | 'deflectorDelivery';
    label: string;
    emptyEffectLabel: string;
    onClose?: () => void;
};

const cardHasSubstance = (card: ActiveCardInfo) => {
    const def = getCardDefinition(card.cardType);
    return def?.targetType === 'scan' && def.deflectorSubstance !== undefined;
};

const cardHasDelivery = (card: ActiveCardInfo) => {
    const def = getCardDefinition(card.cardType);
    return def?.targetType === 'scan' && def.deflectorDelivery !== undefined;
};

const cardHasModifier = (card: ActiveCardInfo) => {
    const def = getCardDefinition(card.cardType);
    return def?.targetType === 'scan' && def.deflectorModifier !== undefined;
};

export function DeflectorSlot({ cardType, slotType, label, emptyEffectLabel, onClose }: Props) {
    const slotId = `deflector/${slotType}`;
    const cardDefinition = cardType ? getCardDefinition(cardType) : null;
    const effectParameter = cardDefinition && cardDefinition.targetType === 'scan' ? cardDefinition[slotType] : null;

    const canAcceptCard = slotType === 'deflectorDelivery'
        ? cardHasDelivery
        : slotType === 'deflectorSubstance'
            ? cardHasSubstance
            : cardHasModifier;

    return (
        <CardDropTarget
            className={classNames(styles.slotRoot, cardDefinition ? styles.slotNotEmpty : undefined)}
            targetType="scan"
            id={slotId}
            canAcceptCard={canAcceptCard}
        >
            <span className={styles.slotText}>
                <span className={styles.slotLabel}>{label}</span>
                <span className={styles.slotEffect}>{effectParameter ?? emptyEffectLabel}</span>
                <span className={styles.slotCardName}>
                    {cardDefinition ? `from ${cardDefinition.name}` : 'Default'}
                </span>
            </span>

            {cardDefinition && (
                <button
                    type="button"
                    className={styles.ejectButton}
                    onClick={onClose}
                    aria-label={`Remove ${cardDefinition.name} from the ${label.toLowerCase()} socket`}
                >
                    <EjectIcon className={styles.ejectIcon} />
                </button>
            )}
        </CardDropTarget>
    );
}
