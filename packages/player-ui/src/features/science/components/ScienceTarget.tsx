import { IArray, Snapshot } from '@colyseus/react';
import { EnemyTargetedCardType } from 'common-data/features/cards/utils/cardDefinitions';
import { ShipSystem, shipSystems } from 'common-data/features/ships/types/ShipSystem';
import { GameObjectInfo, ObjectId, ScannedEngineerInfo, ScannedHelmInfo, ScannedScienceInfo, ScannedTacticalInfo } from 'common-data/features/space/types/GameObjectInfo';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import colorPalettes from 'common-ui/ColorPalette.module.css';
import { ObjectIcon } from 'common-ui/objects';
import { classNames } from 'common-ui/utils/classNames';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import { ScanEngineerSystem } from './ScanEngineerSystem';
import { ScanHelmSystem } from './ScanHelmSystem';
import { ScanScienceSystem } from './ScanScienceSystem';
import { ScanTacticalSystem } from './ScanTacticalSystem';
import styles from './ScienceTarget.module.css';

type Props = GameObjectInfo & {
    relationship: RelationshipType;
    targetNumber: number;
    totalTargets: number;
    systemOrder: IArray<number> | null;
    identifiedVulnerability: EnemyTargetedCardType | null;
    scannedHelm: Snapshot<ScannedHelmInfo> | null;
    scannedTactical: Snapshot<ScannedTacticalInfo> | null;
    scannedScience: Snapshot<ScannedScienceInfo> | null;
    scannedEngineer: Snapshot<ScannedEngineerInfo> | null;
    closeRevealedSystem: () => void;
};

type SystemSelectorProps = {
    targetId: ObjectId;
    systemIndex: number;
    system?: ShipSystem;
};

const SelectableSystem = (props: SystemSelectorProps) => {
    const id = `target/${props.targetId}/unknown/${props.systemIndex}`;

    const content = props.system ? (
        <div className={styles.systemName}>
            {props.system}
        </div>
    )
        : (
            <div className={styles.unknownSystem}>
                ?
            </div>
        );

    return (
        <CardDropTarget
            targetType="scan"
            id={id}
            className={styles.selectableSystem}
            couldDropClassName={styles.selectableSystemCouldDrop}
            droppingClassName={styles.selectableSystemDropping}
        >
            {content}
        </CardDropTarget>
    );
};

type NonRevealedProps = Pick<Props, 'id' | 'name' | 'appearance' | 'targetNumber' | 'totalTargets' | 'systemOrder'>;

const NonRevealedContent = (props: NonRevealedProps) => (
    <div className={styles.notRevealedContent}>
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

        <ul className={styles.systemSelector}>
            <SelectableSystem systemIndex={0} targetId={props.id} system={props.systemOrder?.[0] === undefined ? undefined : shipSystems[props.systemOrder[0]]} />
            <SelectableSystem systemIndex={1} targetId={props.id} system={props.systemOrder?.[1] === undefined ? undefined : shipSystems[props.systemOrder[1]]} />
            <SelectableSystem systemIndex={2} targetId={props.id} system={props.systemOrder?.[2] === undefined ? undefined : shipSystems[props.systemOrder[2]]} />
            <SelectableSystem systemIndex={3} targetId={props.id} system={props.systemOrder?.[3] === undefined ? undefined : shipSystems[props.systemOrder[3]]} />
        </ul>
    </div>
);

export const ScienceTarget = (props: Props) => {
    // Only one system can be revealed at a time, so we just assume that only one can be non null.
    // If all are null, we show the non-revealed content: the name and appearance of the target,
    // plus the system selector drop targets that only show when dragging a scan card.
    const content = props.scannedHelm
        ? <ScanHelmSystem {...props.scannedHelm} name={props.name} onClose={props.closeRevealedSystem} vulnerability={props.identifiedVulnerability} />
        : props.scannedTactical
            ? <ScanTacticalSystem {...props.scannedTactical} name={props.name} onClose={props.closeRevealedSystem} vulnerability={props.identifiedVulnerability} />
            : props.scannedScience
                ? <ScanScienceSystem {...props.scannedScience} name={props.name} onClose={props.closeRevealedSystem} vulnerability={props.identifiedVulnerability} />
                : props.scannedEngineer
                    ? <ScanEngineerSystem {...props.scannedEngineer} name={props.name} onClose={props.closeRevealedSystem} vulnerability={props.identifiedVulnerability} />
                    : (
                        <NonRevealedContent
                            id={props.id}
                            name={props.name}
                            appearance={props.appearance}
                            targetNumber={props.targetNumber}
                            totalTargets={props.totalTargets}
                            systemOrder={props.systemOrder}
                        />
                    );

    /*
props.identifiedVulnerability
        ? <ScanVulnerability name={props.name} system="engineer" targetId={props.id} onClose={props.closeRevealedSystem} vulnerability={props.identifiedVulnerability} />
        :
                    */

    return (
        <div className={classNames(styles.rootOuter, colorPalettes.primary)}>
            <div className={styles.rootInner}>
                <CardDropTarget
                    targetType="enemy"
                    id={props.id}
                    className={styles.dropTargetOverlay}
                    droppingClassName={styles.dropping}
                    couldDropClassName={styles.couldDrop}
                />
                {content}
            </div>
        </div>
    );
};
