import { Snapshot } from '@colyseus/react';
import { ScannedHelmInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { ScanBase } from './ScanBase';
import styles from './ScanHelmSystem.module.css';

type Props = Snapshot<ScannedHelmInfo>;

export const ScanHelmSystem = (props: Props) => {
    const manueverName = props.activeManeuver
        ? getCardDefinition(props.activeManeuver.type)?.name
        : undefined;

    return (
        <ScanBase className={styles.root} system="helm" revealed>
            {props.activeManeuver ? `Maneuvering: ${manueverName}` : 'No active maneuver'}
            {/* TODO: show evade chance */}
            {/* TODO: show maneuver progress */}
        </ScanBase>
    );
};
