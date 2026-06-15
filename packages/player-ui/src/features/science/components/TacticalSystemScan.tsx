import { Snapshot } from '@colyseus/react';
import { ScannedTacticalInfo } from 'common-data/features/space/types/GameObjectInfo';
import styles from './HelmSystemScan.module.css';
import { SystemScanBase } from './SystemScanBase';

type Props = Snapshot<ScannedTacticalInfo>;

export const TacticalSystemScan = (props: Props) => {
    return (
        <SystemScanBase className={styles.root}>
            (tactical stuff goes here))
        </SystemScanBase>
    );
};
