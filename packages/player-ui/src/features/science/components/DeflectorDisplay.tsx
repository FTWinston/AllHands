import { Snapshot } from '@colyseus/react';
import { DefaultDeflectorEffectDelivery, DefaultDeflectorEffectModifier, DefaultDeflectorEffectSubstance } from 'common-data/features/cards/types/CardDefinition';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { classNames } from 'common-ui/utils/classNames';
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

// Typed so these can't drift from the effect the engine uses for an empty slot.
const defaultModifier: DefaultDeflectorEffectModifier = 'Modulated';
const defaultSubstance: DefaultDeflectorEffectSubstance = 'Graviton';
const defaultDelivery: DefaultDeflectorEffectDelivery = 'Field';

export const DeflectorDisplay = (props: Props) => {
    const { modifierSlot, substanceSlot, deliverySlot, deflectorCard, availablePower, unmountModifier, unmountSubstance, unmountDelivery } = props;

    const wireClassName = (slot: CardType | null) => classNames(styles.wire, slot ? styles.wireFilled : null);

    return (
        <section className={styles.deflectorDisplay} aria-label="Deflector">
            <h2 className={styles.title}>Deflector</h2>

            <div className={styles.body}>
                <div className={styles.slots}>
                    <DeflectorSlot cardType={modifierSlot} slotType="deflectorModifier" label="Modifier" emptyEffectLabel={defaultModifier} onClose={unmountModifier} />
                    <DeflectorSlot cardType={substanceSlot} slotType="deflectorSubstance" label="Substance" emptyEffectLabel={defaultSubstance} onClose={unmountSubstance} />
                    <DeflectorSlot cardType={deliverySlot} slotType="deflectorDelivery" label="Delivery" emptyEffectLabel={defaultDelivery} onClose={unmountDelivery} />
                </div>

                {/* Each socket feeds into the card it builds, drawn like a route on the sector map. */}
                <svg className={styles.wires} aria-hidden="true" viewBox="0 0 26 202" preserveAspectRatio="none">
                    <path className={wireClassName(modifierSlot)} d="M0 31H6Q12 31 12 37V95Q12 101 18 101H26" />
                    <path className={wireClassName(substanceSlot)} d="M0 101H26" />
                    <path className={wireClassName(deliverySlot)} d="M0 171H6Q12 171 12 165V107Q12 101 18 101H26" />
                </svg>

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
        </section>
    );
};
