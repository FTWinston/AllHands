import { Snapshot } from '@colyseus/react';
import { ScannedTacticalInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { resolveParameter } from 'common-ui/types/resolveParameters';
import { classNames } from 'common-ui/utils/classNames';
import { ScanBase } from './ScanBase';
import styles from './ScanTacticalSystem.module.css';

type Props = Snapshot<ScannedTacticalInfo>;

const SlotDisplay = (props: Snapshot<ScannedTacticalInfo>['weaponSlots'][number]) => {
    if (props.card) {
        const cardDef = getCardDefinition(props.card.type);

        const charge = props.charge ?? 0;
        const maxCharge = resolveParameter('chargeCost', cardDef.parameters, props.card.modifiers, props.modifiers);

        return (
            <div className={classNames(styles.weaponSlot, styles.emptySlot)}>
                <div className={styles.cardName}>{cardDef.name}</div>
                <div className={styles.charge}>{`${charge} / ${maxCharge}`}</div>
            </div>
        );
    } else {
        return (
            <div className={classNames(styles.weaponSlot, styles.emptySlot)}>
                (Empty slot)
            </div>
        );
    }
};

export const ScanTacticalSystem = (props: Props) => {
    const slots = props.weaponSlots.map((slot, index) => (
        <SlotDisplay key={index} {...slot} />
    ));

    return (
        <ScanBase className={styles.root} system="tactical" revealed>
            {slots}
        </ScanBase>
    );
};
