import { Snapshot } from '@colyseus/react';
import { ScannedHelmInfo } from 'common-data/features/space/types/GameObjectInfo';
import styles from './HelmSystemScan.module.css';
import { SystemScanBase } from './SystemScanBase';

type Props = Snapshot<ScannedHelmInfo>;

export const HelmSystemScan = (props: Props) => {
    return (
        <SystemScanBase className={styles.root}>
            (helm stuff goes here))
        </SystemScanBase>
    );
};
