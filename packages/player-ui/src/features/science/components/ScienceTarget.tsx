import { IArray, Snapshot } from '@colyseus/react';
import { EnemyTargetedCardType } from 'common-data/features/cards/utils/cardDefinitions';
import { ShipSystem, shipSystems } from 'common-data/features/ships/types/ShipSystem';
import { GameObjectInfo, ObjectId, ScannedEngineerInfo, ScannedHelmInfo, ScannedHullInfo, ScannedScienceInfo, ScannedTacticalInfo } from 'common-data/features/space/types/GameObjectInfo';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import colorPalettes from 'common-ui/ColorPalette.module.css';
import crewStyles from 'common-ui/CrewColors.module.css';
import { SystemIcon } from 'common-ui/icons/systems';
import { ShieldedObjectIcon } from 'common-ui/objects/shields/ShieldedObjectIcon';
import { classNames } from 'common-ui/utils/classNames';
import { TargetReadout } from 'src/components/TargetReadout';
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
    /** This target's hull, if science is scanning it. */
    scannedHull: ScannedHullInfo | null;
    closeRevealedSystem: () => void;
};

type SystemSelectorProps = {
    targetId: ObjectId;
    systemIndex: number;
    system?: ShipSystem;
};

const SelectableSystem = (props: SystemSelectorProps) => {
    const id = `target/${props.targetId}/${props.systemIndex}`;

    const content = props.system ? (
        <>
            <SystemIcon className={styles.systemIcon} system={props.system} />
            <span className={styles.systemName}>{props.system}</span>
        </>
    )
        : (
            <>
                <span className={styles.unknownSystem}>?</span>
                <span className={styles.unknownLabel}>Unknown</span>
                <span className={styles.dropLabel}>Drop to scan</span>
            </>
        );

    return (
        <CardDropTarget
            targetType="scan"
            id={id}
            className={classNames(styles.selectableSystem, props.system ? crewStyles[props.system] : styles.unknown)}
            couldDropClassName={styles.selectableSystemCouldDrop}
            droppingClassName={styles.selectableSystemDropping}
        >
            {content}
        </CardDropTarget>
    );
};

type NonRevealedProps = Pick<Props, 'id' | 'name' | 'appearance' | 'targetNumber' | 'totalTargets' | 'systemOrder' | 'scannedHull'>;

const NonRevealedContent = (props: NonRevealedProps) => (
    <div className={styles.notRevealedContent}>
        <div className={styles.name}>
            <span className={styles.label}>Target</span>
            <h2 className={styles.nameText}>{props.name}</h2>
        </div>

        <div className={styles.count}>
            {props.targetNumber}
            {' / '}
            {props.totalTargets}
        </div>

        {/* While the hull is scanned, its readouts take the frame's corners, so the frame isn't drawn. */}
        <div className={classNames(styles.frame, props.scannedHull && styles.unframed)}>
            <ShieldedObjectIcon
                appearance={props.appearance}
                shield={props.scannedHull?.shield ?? null}
                className={styles.image}
            />
        </div>

        {props.scannedHull && (
            <>
                <TargetReadout label="Shield" side="start" className={styles.shieldReadout}>
                    {props.scannedHull.shield}
                    %
                </TargetReadout>
                <TargetReadout label="Hull" side="end" className={styles.hullReadout}>
                    {props.scannedHull.health}
                    {' / '}
                    {props.scannedHull.maxHealth}
                </TargetReadout>
            </>
        )}

        <p className={styles.prompt}>Drag a scan card onto this ship</p>

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
                            scannedHull={props.scannedHull}
                        />
                    );

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
