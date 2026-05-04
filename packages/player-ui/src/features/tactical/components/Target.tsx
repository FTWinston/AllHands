import { TacticalTargetInfo } from 'common-data/features/space/types/GameObjectInfo';
import colorPalettes from 'common-ui/ColorPalette.module.css';
import { ObjectIcon } from 'common-ui/objects';
import { classNames } from 'common-ui/utils/classNames';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import styles from './Target.module.css';
import { VulnerabilityList } from './VulnerabilityList';

type Props = Omit<TacticalTargetInfo, 'slotNoFireReasons'> & {
    targetNumber: number;
    totalTargets: number;
};

export const Target = (props: Props) => {
    return (
        <div
            className={classNames(
                styles.target,
                colorPalettes.primary,
                props.vulnerabilities && props.vulnerabilities.length > 0 ? styles.hasVulnerabilities : styles.noVulnerabilities
            )}
        >
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

            <VulnerabilityList
                className={styles.vulnerabilities}
                vulnerabilities={props.vulnerabilities ?? []}
                targetId={props.id}
            />
        </div>
    );
};
