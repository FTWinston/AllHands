import { Snapshot } from '@colyseus/react';
import { ScannedTacticalInfo } from 'common-data/features/space/types/GameObjectInfo';
import { DiscreteProgress } from 'common-ui/components/DiscreteProgress';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { resolveParameter } from 'common-ui/types/resolveParameters';
import { mergeModifiers } from 'src/features/tactical/utils/mergeModifiers';
import { ScanBase } from './ScanBase';
import { ScanCardSlot } from './ScanCardSlot';
import styles from './ScanTacticalSystem.module.css';

type Props = Snapshot<ScannedTacticalInfo>;

type SlotDisplayProps = Snapshot<ScannedTacticalInfo>['weaponSlots'][number] & { label: string };

const SlotDisplay = (props: SlotDisplayProps) => {
    const mergedModifiers = props.card
        ? mergeModifiers(props.card.modifiers, props.modifiers)
        : undefined;

    const charge = props.charge ?? 0;
    const maxCharge = props.card
        ? resolveParameter('chargeCost', getCardDefinition(props.card.type).parameters, props.card.modifiers, props.modifiers)
        : 0;

    return (
        <ScanCardSlot
            label={props.label}
            card={props.card}
            emptyText="(Empty slot)"
            modifiers={mergedModifiers}
            slotted
            className={styles.weaponSlot}
            cardNameClassName={styles.weaponCardName}
        >
            <DiscreteProgress
                className={styles.charge}
                title="Charge progress"
                value={charge}
                maxValue={maxCharge}
                outlineInactiveBlocks
            />
        </ScanCardSlot>
    );
};

export const ScanTacticalSystem = (props: Props) => {
    const slots = props.weaponSlots.map((slot, index) => (
        <SlotDisplay key={index} label={`Weapon ${index + 1}`} {...slot} />
    ));

    return (
        <ScanBase className={styles.root} expanded>
            {slots}
        </ScanBase>
    );
};
