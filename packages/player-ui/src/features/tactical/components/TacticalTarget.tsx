import { IArray } from '@colyseus/react';
import { GameObjectInfo, ScannedHullInfo, SubTargetInfo } from 'common-data/features/space/types/GameObjectInfo';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import colorPalettes from 'common-ui/ColorPalette.module.css';
import { classNames } from 'common-ui/utils/classNames';
import { TargetReadout } from 'src/components/TargetReadout';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import { ShieldedObjectIcon } from 'src/features/shields/components/ShieldedObjectIcon';
import { SubTargetList } from './SubTargetList';
import styles from './TacticalTarget.module.css';

type Props = GameObjectInfo & {
    relationship: RelationshipType;
    targetNumber: number;
    totalTargets: number;
    subTargets?: IArray<SubTargetInfo> | null;
    targetAspect?: number;
    /** This target's hull, if science is scanning it. */
    scannedHull?: ScannedHullInfo | null;
};

export const TacticalTarget = (props: Props) => {
    return (
        <div
            className={classNames(
                styles.target,
                colorPalettes.primary,
                props.subTargets && props.subTargets.length > 0 ? styles.hasVulnerabilities : styles.noVulnerabilities
            )}
        >
            <CardDropTarget
                targetType="enemy"
                id={props.id}
                className={styles.dropTargetOverlay}
                droppingClassName={styles.dropping}
                couldDropClassName={styles.couldDrop}
            />

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

            <SubTargetList
                className={styles.vulnerabilities}
                subTargets={props.subTargets ?? []}
                targetId={props.id}
                targetAspect={props.targetAspect}
            />
        </div>
    );
};
