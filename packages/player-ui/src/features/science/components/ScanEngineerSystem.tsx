import { Snapshot } from '@colyseus/react';
import { ScannedEngineerInfo, ScannedEngineerTileInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ScanBase } from './ScanBase';
import styles from './ScanEngineerSystem.module.css';

type Props = Snapshot<ScannedEngineerInfo>;

const SystemInfo = (props: ScannedEngineerTileInfo) => {
    return (
        <div className={styles.systemInfo}>
            <div className={styles.systemName}>{props.system}</div>
            <div className={styles.systemPower}>{props.power}</div>
            <div className={styles.systemHealth}>{props.health}</div>
        </div>
    );
};

export const ScanEngineerSystem = (props: Props) => {
    return (
        <ScanBase className={styles.root} revealed>
            {props.engineerTiles.map((tile, index) => (
                <SystemInfo key={index} {...tile} />
            ))}
        </ScanBase>
    );
};
