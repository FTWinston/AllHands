import { Snapshot } from '@colyseus/react';
import { ScannedEngineerInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ScanBase } from './ScanBase';
import styles from './ScanEngineerSystem.module.css';

type Props = Snapshot<ScannedEngineerInfo>;

export const ScanEngineerSystem = (_props: Props) => {
    return (
        <ScanBase className={styles.root}>
            (engineer stuff goes here))
        </ScanBase>
    );
};
