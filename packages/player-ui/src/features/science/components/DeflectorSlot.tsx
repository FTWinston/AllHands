import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { classNames } from 'common-ui/utils/classNames';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import { ActiveCardInfo } from 'src/features/cardui/components/DragCardProvider';
import styles from './DeflectorSlot.module.css';

type Props = {
    cardType: CardType | null;
    slotType: 'deflectorModifier' | 'deflectorSubstance' | 'deflectorDelivery';
    label: string;
    emptyEffectLabel: string;
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

export function DeflectorSlot({ cardType, slotType, label, emptyEffectLabel }: Props) {
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
            <div className={styles.slotLabel}>{label}</div>

            {effectParameter
                ? (
                    <div className={styles.slotCard}>
                        <div className={styles.slotEffect}>{effectParameter}</div>
                        <div className={styles.slotCardName}>{cardDefinition?.name}</div>
                    </div>
                )
                : (
                    <div className={styles.slotEmptyText}>
                        (
                        {emptyEffectLabel}
                        )
                    </div>
                )}
        </CardDropTarget>
    );
}
