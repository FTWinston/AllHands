import { IArray, Snapshot } from '@colyseus/react';
import { GameObjectInfo, RelationshipViewer, ScannedEngineerInfo, ScannedHelmInfo, ScannedScienceInfo, ScannedSystemOrderInfo, ScannedTacticalInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getDisplayRelationship } from 'common-data/features/space/utils/getDisplayRelationship';
import { HorizontalScroll } from 'common-ui/components/HorizontalScroll';
import { ScienceTarget } from './ScienceTarget';
import styles from './ScienceTargetList.module.css';

type Props = {
    targets: IArray<GameObjectInfo>;
    scannedShipId: string | null;
    systemOrderByTarget: Record<string, ScannedSystemOrderInfo>;
    scannedHelm: Snapshot<ScannedHelmInfo> | null;
    scannedTactical: Snapshot<ScannedTacticalInfo> | null;
    scannedScience: Snapshot<ScannedScienceInfo> | null;
    scannedEngineer: Snapshot<ScannedEngineerInfo> | null;
    viewer: RelationshipViewer;
};

export const ScienceTargetList = (props: Props) => {
    const { targets, scannedShipId, scannedHelm, scannedTactical, scannedScience, scannedEngineer } = props;

    return (
        <HorizontalScroll
            className={styles.scrollArea}
            contentClassName={styles.content}
            contentRender={<ul />}
            snap={true}
        >
            {targets.map((target, index) => (
                <li className={styles.itemWrapper} key={target.id}>
                    <ScienceTarget
                        id={target.id}
                        name={target.name}
                        appearance={target.appearance}
                        faction={target.faction}
                        relationship={getDisplayRelationship(target, props.viewer)}
                        motion={target.motion}
                        targetNumber={index + 1}
                        totalTargets={targets.length}
                        systemOrder={props.systemOrderByTarget[target.id]?.order ?? null}
                        scannedHelm={target.id === scannedShipId ? scannedHelm : null}
                        scannedTactical={target.id === scannedShipId ? scannedTactical : null}
                        scannedScience={target.id === scannedShipId ? scannedScience : null}
                        scannedEngineer={target.id === scannedShipId ? scannedEngineer : null}
                    />
                </li>
            ))}
        </HorizontalScroll>
    );
};
