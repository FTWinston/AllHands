import { Snapshot } from '@colyseus/react';
import { EnemyTargetedCardType } from 'common-data/features/cards/utils/cardDefinitions';
import { ScannedHelmInfo } from 'common-data/features/space/types/GameObjectInfo';
import { RadialProgress } from 'common-ui/components/RadialProgress';
import crewStyles from 'common-ui/CrewColors.module.css';
import { classNames } from 'common-ui/utils/classNames';
import { ScanBase } from './ScanBase';
import { ScanCardSlot } from './ScanCardSlot';
import styles from './ScanHelmSystem.module.css';
import { ScanSection } from './ScanSection';

type Props = Snapshot<ScannedHelmInfo> & {
    name: string;
    vulnerability: EnemyTargetedCardType | null;
    onClose: () => void;
};

export const ScanHelmSystem = (props: Props) => {
    const progress = props.maneuverProgress
        ? (
            <span className={classNames(styles.maneuverProgress, crewStyles.helm)}>
                <RadialProgress progress={props.maneuverProgress} title="Maneuver progress" backgroundColor="var(--panel)" />
            </span>
        )
        : undefined;

    return (
        <ScanBase
            system="helm"
            power={props.power}
            vulnerability={props.vulnerability}
            targetName={props.name}
            targetId={props.targetId}
            onClose={props.onClose}
        >
            <ScanCardSlot
                label="Maneuver"
                card={props.activeManeuver}
                emptyText="No maneuver"
                end={progress}
            />

            <ScanSection label="Evasion">
                {props.evasionChance}
                %
            </ScanSection>
        </ScanBase>
    );
};
