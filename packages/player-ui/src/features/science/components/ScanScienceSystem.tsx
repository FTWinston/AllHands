import { Snapshot } from '@colyseus/react';
import { ScannedScienceInfo } from 'common-data/features/space/types/GameObjectInfo';
import { InfoPopup } from 'common-ui/components/InfoPopup';
import { Card } from 'common-ui/features/cards/components/Card';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { classNames } from 'common-ui/utils/classNames';
import { ScanBase } from './ScanBase';
import styles from './ScanScienceSystem.module.css';

type Props = Snapshot<ScannedScienceInfo>;

const DeflectorSlot = (props: Snapshot<ScannedScienceInfo>) => {
    if (props.deflectorCard) {
        const cardDef = getCardDefinition(props.deflectorCard.type);

        return (
            <InfoPopup
                className={styles.deflectorSlot}
                description={<Card {...props.deflectorCard} disabled={true} />}
            >
                <div className={styles.itemLabel}>Deflector</div>
                <div className={styles.cardName}>{cardDef.name}</div>
            </InfoPopup>
        );
    } else {
        return (
            <div className={classNames(styles.deflectorSlot, styles.emptySlot)}>
                <div className={styles.itemLabel}>Deflector</div>
                <div className={styles.cardName}>(No action)</div>
            </div>
        );
    }
};

export const ScanScienceSystem = (props: Props) => {
    const scanTargets = !props.scanSystems || props.scanSystems.length === 0
        ? <div className={styles.notScanning}>(Not scanning your ship)</div>
        : (
            <div className={styles.scanTargetList}>
                Your
                {' '}
                {props.scanSystems.join(', ')}
            </div>
        );

    return (
        <ScanBase className={styles.root} expanded>
            <div className={styles.scanTargets}>
                <div className={styles.itemLabel}>Scanning</div>
                {scanTargets}
            </div>
            <DeflectorSlot {...props} />
        </ScanBase>
    );
};
