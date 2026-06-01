import { Snapshot } from '@colyseus/react';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { CardBase } from 'common-ui/features/cards/components/CardBase';
import { DraggableCard } from 'src/features/cardui/components/DraggableCard';
import styles from './DeflectorDisplay.module.css';
import { DeflectorSlot } from './DeflectorSlot';

type Props = {
    modifierSlot: CardType | null;
    substanceSlot: CardType | null;
    deliverySlot: CardType | null;
    deflectorCard: Snapshot<CardInstance> | null;
    availablePower: number;
};

export const DeflectorDisplay = (props: Props) => {
    const { modifierSlot, substanceSlot, deliverySlot, deflectorCard, availablePower } = props;

    return (
        <div className={styles.deflectorDisplay}>
            <div className={styles.slots}>
                <DeflectorSlot cardType={modifierSlot} slotId="modifier" label="Modifier" />
                <DeflectorSlot cardType={substanceSlot} slotId="substance" label="Substance" />
                <DeflectorSlot cardType={deliverySlot} slotId="delivery" label="Delivery" />
            </div>

            <div className={styles.deflectorCard}>
                {deflectorCard ? (
                    <DraggableCard
                        index={0}
                        id={deflectorCard.id}
                        type={deflectorCard.type}
                        modifiers={deflectorCard.modifiers}
                        availablePower={availablePower}
                        targetType="enemy"
                    />
                ) : (
                    <CardBase className={styles.emptyDeflector}>
                        <div className={styles.emptyDeflectorLabel}>No deflector card</div>
                    </CardBase>
                )}
            </div>
        </div>
    );
};
