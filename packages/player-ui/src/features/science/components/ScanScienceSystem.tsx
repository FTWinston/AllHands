import { Snapshot } from '@colyseus/react';
import { ScannedScienceInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ScanBase } from './ScanBase';
import styles from './ScanScienceSystem.module.css';

type Props = Snapshot<ScannedScienceInfo>;

export const ScanScienceSystem = (props: Props) => {
    return (
        <ScanBase className={styles.root}>
            (science stuff goes here))
        </ScanBase>
    );
};
