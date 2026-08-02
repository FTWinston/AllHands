import { Snapshot } from '@colyseus/react';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { DraggableCard } from 'src/features/cardui/components/DraggableCard';
import styles from './DeflectorDisplay.module.css';
import { DeflectorSlot } from './DeflectorSlot';

type Props = {
    modifierSlot: CardType | null;
    substanceSlot: CardType | null;
    deliverySlot: CardType | null;
    deflectorCard: Snapshot<CardInstance>;
    availablePower: number;
    unmountModifier: () => void;
    unmountSubstance: () => void;
    unmountDelivery: () => void;
};

export const DeflectorDisplay = (props: Props) => {
    const { modifierSlot, substanceSlot, deliverySlot, deflectorCard, availablePower, unmountModifier, unmountSubstance, unmountDelivery } = props;

    return (
        <div className={styles.deflectorDisplay}>
            <div className={styles.slots}>
                <h2 className={styles.title}>Deflector</h2>
                <DeflectorSlot cardType={modifierSlot} slotType="deflectorModifier" label="Modifier" emptyEffectLabel="Coherent" onClose={unmountModifier} />
                <DeflectorSlot cardType={substanceSlot} slotType="deflectorSubstance" label="Substance" emptyEffectLabel="Graviton" onClose={unmountSubstance} />
                <DeflectorSlot cardType={deliverySlot} slotType="deflectorDelivery" label="Delivery" emptyEffectLabel="Field" onClose={unmountDelivery} />
            </div>

            <div className={styles.deflectorCard}>
                <DraggableCard
                    index={0}
                    id={deflectorCard.id}
                    type={deflectorCard.type}
                    modifiers={deflectorCard.modifiers}
                    availablePower={availablePower}
                    targetType="enemy"
                />
            </div>
        </div>
    );
};
