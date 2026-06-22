import { Snapshot } from '@colyseus/react';
import { ScannedTacticalInfo } from 'common-data/features/space/types/GameObjectInfo';
import { DiscreteProgress } from 'common-ui/components/DiscreteProgress';
import { InfoPopup } from 'common-ui/components/InfoPopup';
import { Card } from 'common-ui/features/cards/components/Card';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { resolveParameter } from 'common-ui/types/resolveParameters';
import { classNames } from 'common-ui/utils/classNames';
import { mergeModifiers } from 'src/features/tactical/utils/mergeModifiers';
import { ScanBase } from './ScanBase';
import styles from './ScanTacticalSystem.module.css';

type Props = Snapshot<ScannedTacticalInfo>;

const SlotDisplay = (props: Snapshot<ScannedTacticalInfo>['weaponSlots'][number]) => {
    if (props.card) {
        const cardDef = getCardDefinition(props.card.type);

        const charge = props.charge ?? 0;
        const maxCharge = resolveParameter('chargeCost', cardDef.parameters, props.card.modifiers, props.modifiers);

        const mergedModifiers: Record<string, number> = mergeModifiers(props.card.modifiers, props.modifiers);

        return (
            <InfoPopup
                description={<Card {...props.card} modifiers={mergedModifiers} slotted={true} disabled={true} />}
                className={styles.weaponSlot}
            >
                <div className={styles.cardName}>{cardDef.name}</div>
                <DiscreteProgress
                    className={styles.charge}
                    title="Charge progress"
                    value={charge}
                    maxValue={maxCharge}
                    outlineInactiveBlocks
                />
            </InfoPopup>
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
        <ScanBase className={styles.root} expanded>
            {slots}
        </ScanBase>
    );
};
