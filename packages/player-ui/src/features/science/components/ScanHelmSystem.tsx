import { Snapshot } from '@colyseus/react';
import { ScannedHelmInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ScanBase } from './ScanBase';
import styles from './ScanHelmSystem.module.css';

type Props = Snapshot<ScannedHelmInfo>;

export const ScanHelmSystem = (props: Props) => {
    return (
        <ScanBase className={styles.root}>
            {props.activeManeuver ? `Maneuvering: ${props.activeManeuver.type}` : 'No active maneuver'}
        </ScanBase>
    );
};
