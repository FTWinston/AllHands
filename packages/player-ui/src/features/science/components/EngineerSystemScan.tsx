import { Snapshot } from '@colyseus/react';
import { ScannedEngineerInfo } from 'common-data/features/space/types/GameObjectInfo';
import styles from './HelmSystemScan.module.css';
import { SystemScanBase } from './SystemScanBase';

type Props = Snapshot<ScannedEngineerInfo>;

export const EngineerSystemScan = (props: Props) => {
    return (
        <SystemScanBase className={styles.root}>
            (engineer stuff goes here))
        </SystemScanBase>
    );
};
