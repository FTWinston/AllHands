import { Snapshot } from '@colyseus/react';
import { EnemyTargetedCardType } from 'common-data/features/cards/utils/cardDefinitions';
import { ScannedEngineerInfo, ScannedEngineerTileInfo } from 'common-data/features/space/types/GameObjectInfo';
import { InfoPopup } from 'common-ui/components/InfoPopup';
import { default as HealthIcon } from 'common-ui/icons/health.svg?react';
import { SystemIcon } from 'common-ui/icons/systems';
import { default as PowerIcon } from 'src/features/header/assets/power.svg?react';
import { ScanBase } from './ScanBase';
import styles from './ScanEngineerSystem.module.css';

type Props = Snapshot<ScannedEngineerInfo> & {
    name: string;
    vulnerability: EnemyTargetedCardType | null;
    onClose: () => void;
};

const SystemInfo = (props: ScannedEngineerTileInfo) => {
    const name = `${props.system[0].toUpperCase()}${props.system.slice(1)}`;

    return (
        <InfoPopup
            className={styles.system}
            name={`${name} status`}
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
            <span className={styles.systemTitle}>
                <SystemIcon className={styles.systemIcon} system={props.system} />
                <span className={styles.systemName}>{name}</span>
            </span>
            <span className={styles.readings}>
                <span className={styles.reading}>
                    <PowerIcon className={styles.powerIcon} aria-hidden={true} />
                    {props.power}
                </span>
                <span className={styles.reading}>
                    <HealthIcon className={styles.healthIcon} aria-hidden={true} />
                    {props.health}
                </span>
            </span>
        </InfoPopup>
    );
};

export const ScanEngineerSystem = (props: Props) => {
    return (
        <ScanBase
            contentClassName={styles.root}
            system="engineer"
            power={props.power}
            vulnerability={props.vulnerability}
            targetName={props.name}
            targetId={props.targetId}
            onClose={props.onClose}
        >
            {props.engineerTiles.map((tile, index) => (
                <SystemInfo key={index} {...tile} />
            ))}
        </ScanBase>
    );
};
