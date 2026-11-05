import { IArray } from '@colyseus/react';
import { GameObjectInfo, SubTargetInfo } from 'common-data/features/space/types/GameObjectInfo';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import colorPalettes from 'common-ui/ColorPalette.module.css';
import { ObjectIcon } from 'common-ui/objects';
import { classNames } from 'common-ui/utils/classNames';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import { SubTargetList } from './SubTargetList';
import styles from './TacticalTarget.module.css';

type Props = GameObjectInfo & {
    relationship: RelationshipType;
    targetNumber: number;
    totalTargets: number;
    subTargets?: IArray<SubTargetInfo> | null;
    targetAspect?: number;
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

            <div className={styles.frame}>
                <ObjectIcon
                    appearance={props.appearance}
                    className={styles.image}
                />
            </div>

            <SubTargetList
                className={styles.vulnerabilities}
                subTargets={props.subTargets ?? []}
                targetId={props.id}
                targetAspect={props.targetAspect}
            />
        </div>
    );
};
