import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import styles from './DeflectorSlot.module.css';

type Props = {
    cardType: CardType | null;
    slotId: 'modifier' | 'substance' | 'delivery';
    label: string;
};

export function DeflectorSlot({ cardType, slotId, label }: Props) {
    const cardDefinition = cardType ? getCardDefinition(cardType) : null;
    const effectParameter = cardDefinition ? cardDefinition.parameters[slotId] : null;

    return (
        <CardDropTarget className={styles.slotWrapper} targetType="deflector" id={slotId}>
            <div className={styles.slotLabel}>{label}</div>

            {effectParameter
                ? (
                    <div className={styles.slotCard}>
                        <div className={styles.slotEffect}>{effectParameter}</div>
                        <div className={styles.slotCardName}>{cardDefinition?.name}</div>
                    </div>
                )
                : (
                    <div className={styles.slotCardEmpty}>
                        (empty slot)
                    </div>
                )}
        </CardDropTarget>
    );
}
