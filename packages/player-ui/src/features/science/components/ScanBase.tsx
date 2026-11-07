import { EnemyTargetedCardType } from 'common-data/features/cards/utils/cardDefinitions';
import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { ObjectId } from 'common-data/features/space/types/GameObjectInfo';
import { getIndefiniteArticle } from 'common-data/utils/strings';
import { Button } from 'common-ui/components/Button';
import crewStyles from 'common-ui/CrewColors.module.css';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { default as CloseIcon } from 'common-ui/icons/close.svg?react';
import { SystemIcon } from 'common-ui/icons/systems';
import { classNames } from 'common-ui/utils/classNames';
import { PropsWithChildren } from 'react';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import { default as PowerIcon } from 'src/features/header/assets/power.svg?react';
import styles from './ScanBase.module.css';

type Props = PropsWithChildren<{
    contentClassName?: string;
    targetName?: string;
    targetId: ObjectId;
    system: CrewRoleName;
    /** The scanned system's current power level. */
    power: number;
    vulnerability: EnemyTargetedCardType | null;
    onClose?: () => void;
}>;

export const ScanBase = (props: Props) => {
    const id = `vuln/${props.targetId}/${props.system}`;

    const vulnerabilityName = props.vulnerability ? getCardDefinition(props.vulnerability).name : null;

    return (
        <CardDropTarget
            targetType="scan"
            id={id}
            className={styles.root}
        >
            <div className={styles.header}>
                <span className={classNames(styles.systemChip, crewStyles[props.system])}>
                    <SystemIcon className={styles.systemIcon} system={props.system} />
                </span>

                <div className={styles.titles}>
                    <span className={styles.targetName}>
                        Scan ·
                        {' '}
                        {props.targetName}
                    </span>
                    <h2 className={styles.systemName}>{props.system}</h2>
                </div>

                <span className={styles.power} title="Power">
                    <PowerIcon className={styles.powerIcon} aria-hidden={true} />
                    {props.power}
                </span>

                <Button
                    className={styles.closeButton}
                    palette="grey"
                    outlined={true}
                    icon={<CloseIcon className={styles.closeIcon} />}
                    onClick={props.onClose}
                    ariaLabel="Close scan"
                />
            </div>

            <div className={classNames(styles.content, props.contentClassName)}>
                {props.children}
            </div>

            {vulnerabilityName && (
                <div className={styles.vulnerability} role="status">
                    <svg className={styles.vulnerabilityIcon} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3 2.5 20h19z" />
                        <path d="M12 10v4M12 17v.01" />
                    </svg>
                    <span className={styles.vulnerabilityText}>
                        <span className={styles.vulnerabilityHeading}>Vulnerability found</span>
                        <span>
                            Exposure to
                            {' '}
                            {getIndefiniteArticle(vulnerabilityName)}
                            {' '}
                            <span className={styles.vulnerabilityName}>{vulnerabilityName}</span>
                            {' '}
                            would weaken this system.
                        </span>
                    </span>
                </div>
            )}
        </CardDropTarget>
    );
};
