import { Snapshot } from '@colyseus/react';
import { EnemyTargetedCardType } from 'common-data/features/cards/utils/cardDefinitions';
import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { ObjectId, ScannedBaseInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getIndefiniteArticle } from 'common-data/utils/strings';
import { Button } from 'common-ui/components/Button';
import crewStyles from 'common-ui/CrewColors.module.css';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { default as CardsIcon } from 'common-ui/icons/cards.svg?react';
import { default as CloseIcon } from 'common-ui/icons/close.svg?react';
import { SystemIcon } from 'common-ui/icons/systems';
import { classNames } from 'common-ui/utils/classNames';
import { PropsWithChildren, ReactNode } from 'react';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import { default as PowerIcon } from 'src/features/header/assets/power.svg?react';
import styles from './ScanBase.module.css';
import { ScanHand } from './ScanHand';

type Props = PropsWithChildren<{
    contentClassName?: string;
    targetName?: string;
    targetId: ObjectId;
    system: CrewRoleName;
    /** The scanned system's current power level. */
    power: number;
    /** The cards in the scanned system's hand, or null (or undefined) if science hasn't read it. */
    hand: Snapshot<ScannedBaseInfo>['hand'] | undefined;
    vulnerability: EnemyTargetedCardType | null;
    onClose?: () => void;
}>;

const VulnerabilityIcon = ({ className }: { className: string }) => (
    <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3 2.5 20h19z" />
        <path d="M12 10v4M12 17v.01" />
    </svg>
);

type SecondScanProps = {
    id: string;
    disabled?: boolean;
    icon: ReactNode;
    name: string;
    hint: string;
};

/** One of the two things a scan card can do to a system that's already revealed, shown only while dragging a scan card. */
const SecondScan = (props: SecondScanProps) => (
    <CardDropTarget
        targetType="scan"
        id={props.id}
        disabled={props.disabled}
        className={styles.secondScan}
        couldDropClassName={styles.secondScanCouldDrop}
        droppingClassName={styles.secondScanDropping}
    >
        {props.icon}
        <span className={styles.secondScanName}>{props.name}</span>
        <span className={styles.secondScanHint}>{props.hint}</span>
    </CardDropTarget>
);

export const ScanBase = (props: Props) => {
    const vulnerabilityName = props.vulnerability ? getCardDefinition(props.vulnerability).name : null;

    return (
        <div className={styles.root}>
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

            {props.hand && <ScanHand className={styles.hand} cards={props.hand} />}

            {vulnerabilityName && (
                <div className={styles.vulnerability} role="status">
                    <VulnerabilityIcon className={styles.vulnerabilityIcon} />
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

            {/* A scan card dropped on a revealed system either finds how to hurt it, or reads what it's about to do. */}
            <div className={styles.secondScans}>
                <SecondScan
                    id={`vuln/${props.targetId}/${props.system}`}
                    icon={<VulnerabilityIcon className={styles.secondScanIcon} />}
                    name="Find vulnerability"
                    hint="How to hurt it"
                />
                <SecondScan
                    id={`hand/${props.targetId}/${props.system}`}
                    disabled={!!props.hand}
                    icon={<CardsIcon className={styles.secondScanIcon} aria-hidden={true} />}
                    name="Read hand"
                    hint="What it'll do next"
                />
            </div>
        </div>
    );
};
