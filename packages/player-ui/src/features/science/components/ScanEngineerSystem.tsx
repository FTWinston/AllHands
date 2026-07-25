import { Snapshot } from '@colyseus/react';
import { ScannedEngineerInfo, ScannedEngineerTileInfo } from 'common-data/features/space/types/GameObjectInfo';
import { InfoPopup } from 'common-ui/components/InfoPopup';
import { SystemIcon } from 'common-ui/icons/systems';
import { ScanBase } from './ScanBase';
import styles from './ScanEngineerSystem.module.css';

type Props = Snapshot<ScannedEngineerInfo> & {
    onClose: () => void;
};

const SystemInfo = (props: ScannedEngineerTileInfo) => {
    return (
        <InfoPopup
            className={styles.system}
            name={`${props.system[0].toUpperCase()}${props.system.slice(1)} status`}
            description={(
                <>
                    <p>
                        Power:
                        {' '}
                        {props.power}
                    </p>
                    <p>
                        Health:
                        {' '}
                        {props.health}
                    </p>
                </>
            )}
        >
            <SystemIcon className={styles.systemIcon} system={props.system} />
            <div className={styles.systemPower}>{props.power}</div>
            <div className={styles.separator}>/</div>
            <div className={styles.systemHealth}>{props.health}</div>
        </InfoPopup>
    );
};

export const ScanEngineerSystem = (props: Props) => {
    return (
        <ScanBase
            contentClassName={styles.root}
            system="engineer"
            targetId={props.targetId}
            onClose={props.onClose}
        >
            {props.engineerTiles.map((tile, index) => (
                <SystemInfo key={index} {...tile} />
            ))}
        </ScanBase>
    );
};
