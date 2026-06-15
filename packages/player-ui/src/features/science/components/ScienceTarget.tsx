import { IArray, Snapshot } from '@colyseus/react';
import { engineerSystem, helmSystem, scienceSystem, shipSystems, tacticalSystem } from 'common-data/features/ships/types/ShipSystem';
import { GameObjectInfo, ScannedEngineerInfo, ScannedHelmInfo, ScannedScienceInfo, ScannedTacticalInfo } from 'common-data/features/space/types/GameObjectInfo';
import colorPalettes from 'common-ui/ColorPalette.module.css';
import { ObjectIcon } from 'common-ui/objects';
import { classNames } from 'common-ui/utils/classNames';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import { EngineerSystemScan } from './EngineerSystemScan';
import { HelmSystemScan } from './HelmSystemScan';
import { ScienceSystemScan } from './ScienceSystemScan';
import styles from './ScienceTarget.module.css';
import { TacticalSystemScan } from './TacticalSystemScan';
import { UnrevealedSystemScan } from './UnrevealedSystemScan';

type Props = GameObjectInfo & {
    targetNumber: number;
    totalTargets: number;
    systemOrder: IArray<number> | null;
    scannedHelm: Snapshot<ScannedHelmInfo> | null;
    scannedTactical: Snapshot<ScannedTacticalInfo> | null;
    scannedScience: Snapshot<ScannedScienceInfo> | null;
    scannedEngineer: Snapshot<ScannedEngineerInfo> | null;
};

function renderSystem(system: number | undefined, props: Props) {
    if (system === helmSystem && props.scannedHelm) {
        return <HelmSystemScan {...props.scannedHelm} />;
    } else if (system === tacticalSystem && props.scannedTactical) {
        return <TacticalSystemScan {...props.scannedTactical} />;
    } else if (system === scienceSystem && props.scannedScience) {
        return <ScienceSystemScan {...props.scannedScience} />;
    } else if (system === engineerSystem && props.scannedEngineer) {
        return <EngineerSystemScan {...props.scannedEngineer} />;
    }

    if (system) {
        return <UnrevealedSystemScan system={shipSystems[system]} />;
    } else {
        return <UnrevealedSystemScan />;
    }
}

export const ScienceTarget = (props: Props) => {
    return (
        <div className={classNames(styles.target, colorPalettes.primary)}>
            <CardDropTarget
                targetType="enemy"
                id={props.id}
                className={styles.dropTargetOverlay}
                droppingClassName={styles.dropping}
                couldDropClassName={styles.couldDrop}
            />

            <h2 className={styles.name}>{props.name}</h2>

            <div className={styles.count}>
                #
                {' '}
                {props.targetNumber}
                {' '}
                /
                {' '}
                {props.totalTargets}
            </div>

            <ObjectIcon
                appearance={props.appearance}
                className={styles.image}
            />

            <div className={styles.scansRoot}>
                {renderSystem(props.systemOrder?.[0], props)}
                {renderSystem(props.systemOrder?.[1], props)}
                {renderSystem(props.systemOrder?.[2], props)}
                {renderSystem(props.systemOrder?.[3], props)}
            </div>
        </div>
    );
};
