import { Snapshot } from '@colyseus/react';
import { ScannedScienceInfo } from 'common-data/features/space/types/GameObjectInfo';
import styles from './HelmSystemScan.module.css';
import { SystemScanBase } from './SystemScanBase';

type Props = Snapshot<ScannedScienceInfo>;

export const ScienceSystemScan = (props: Props) => {
    return (
        <SystemScanBase className={styles.root}>
            (science stuff goes here))
        </SystemScanBase>
    );
};
