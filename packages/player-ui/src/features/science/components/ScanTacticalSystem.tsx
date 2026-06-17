import { Snapshot } from '@colyseus/react';
import { ScannedTacticalInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ScanBase } from './ScanBase';
import styles from './ScanTacticalSystem.module.css';

type Props = Snapshot<ScannedTacticalInfo>;

export const ScanTacticalSystem = (props: Props) => {
    return (
        <ScanBase className={styles.root}>
            (tactical stuff goes here))
        </ScanBase>
    );
};
